'use strict'

/* The layer the creature lives in.

   A transparent, frameless, unfocusable strip lying over the taskbar. Three
   of its properties are load-bearing and each was arrived at by doing the
   other thing first:

   **`setAlwaysOnTop(true, 'screen-saver')`** and not plain alwaysOnTop. The
   Windows taskbar is itself topmost, so an ordinary always-on-top window
   loses to it and the creature spends its life behind the thing it is
   supposed to be standing on. `screen-saver` is the level that wins.

   **`setIgnoreMouseEvents(true, { forward: true })`** by default, toggled off
   only while the pointer is actually over the drawn shape. This is the exact
   Windows equivalent of what the stylesheet already does — `pointer-events:
   none` on the layer, `auto` on the ink — and it keeps the original promise:
   a creature that can stand anywhere is a creature that can stand on your
   Start button, and the answer is for it to be untouchable rather than for it
   to be careful. `forward: true` is what still delivers mousemove to the page
   while everything else passes through, which is how the page can tell it is
   being approached at all.

   **`focusable: false`**, so clicking the creature never steals the caret out
   of whatever you were typing in. The ask box will have to lift this for as
   long as it is open and put it back after; until there is an ask box, there
   is nothing to lift it for. */

const path = require('node:path')
const { BrowserWindow, screen, ipcMain } = require('electron')
const geometry = require('./geometry')

let win = null
let place = null
let ignoring = true

const send = (channel, payload) => {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
}

/* Re-measured rather than remembered. Folding the taskbar, moving it to
   another edge, plugging in a monitor and changing the scaling all arrive as
   the same event, and all of them are answered by asking again. */
function place_ () {
  if (!win || win.isDestroyed()) return
  const next = geometry.layout(screen.getPrimaryDisplay())
  const same = place &&
    place.win.x === next.win.x && place.win.y === next.win.y &&
    place.win.width === next.win.width && place.win.height === next.win.height
  place = next
  if (!same) win.setBounds(next.win)

  /* Asked for again on every pass, and this is the fix for a real complaint:
     the creature was appearing *behind* the taskbar, with only the top of its
     head showing. Being granted the screen-saver level once is not the same
     as keeping it — the Windows shell re-asserts the taskbar's own topmost
     standing, a UAC prompt or a full-screen app takes the band and gives it
     back differently, and SetWindowPos on a bounds change can reorder us. It
     is one cheap call, it is idempotent, and the alternative is a creature
     that is fine until it is quietly not. */
  win.setAlwaysOnTop(true, 'screen-saver')
  send('haiky:place', next)
}

function create () {
  place = geometry.layout(screen.getPrimaryDisplay())

  win = new BrowserWindow({
    ...place.win,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    /* Measured: without this the window comes back 1920x1152 when 1920x1200
       was asked for. Windows fits an ordinary window inside the work area,
       and the work area is the screen minus the taskbar — so the one part of
       the screen the creature most needs to be able to stand on is exactly
       the part it was being kept out of. */
    enableLargerThanScreen: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    acceptFirstMouse: true,
    /* 'toolbar' keeps it out of Alt-Tab and off the taskbar in a way
       skipTaskbar alone does not always manage on Windows. */
    type: 'toolbar',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      /* the strip is mostly empty and animating at 60fps; there is no reason
         for it to stop when it is not the foreground window */
      backgroundThrottling: false
    }
  })

  win.setAlwaysOnTop(true, 'screen-saver')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false })
  win.setIgnoreMouseEvents(true, { forward: true })

  win.loadFile(path.join(__dirname, '..', 'renderer', 'overlay.html'))

  win.once('ready-to-show', () => {
    win.showInactive()
    /* And again once it is up, because the clamp can be applied on show as
       well as on create. Cheap, idempotent, and the alternative is a floor
       the creature stands 48px above. */
    win.setBounds(place.win)
    win.setAlwaysOnTop(true, 'screen-saver')
    send('haiky:place', place)
  })

  /* Something else went topmost — a UAC prompt, a game, another overlay. Ask
     for the top again rather than assume we kept it. */
  win.on('blur', () => win.setAlwaysOnTop(true, 'screen-saver'))

  screen.on('display-metrics-changed', place_)
  screen.on('display-added', place_)
  screen.on('display-removed', place_)

  /* An auto-hidden taskbar changes nothing either rectangle reports, so there
     is no event to listen for. This is the only polling in the app and it is
     deliberately slow: it exists to catch a bar that was dragged to another
     edge while nothing else happened. */
  setInterval(place_, 4000)
  setInterval(pollCursor, POLL)

  return win
}

/* ── the pointer, and why main has to go and fetch it ──
   Electron can forward mouse movement into a click-through window, and it
   does not reach this one. Measured rather than assumed: a sweep of six
   hundred cursor positions straight across the strip produced not a single
   pointermove in the page. The cause is `focusable: false` — the window never
   becomes foreground, and the forwarding never fires for a window that is
   never active. It is worth knowing before somebody deletes this loop and
   puts `{ forward: true }` back to work: the flag is still set below, it is
   simply not enough on its own.

   So main goes and gets it. `getCursorScreenPoint` is one cheap syscall; it
   runs only while the strip is visible, and the point is passed on only while
   the cursor is actually inside the strip, which for a bar 144px tall is a
   small fraction of a day. The renderer still owns the hit test, because it
   is the only thing that knows where the ink is this frame.

   Leaving is sent once, as a null, rather than allowed to lapse. A creature
   you moused away from must let go of the pointer immediately or it keeps the
   window solid over your taskbar. */
const POLL = 1000 / 30
let inside = false
let at = { x: -1e4, y: -1e4 }
let was = { x: -1e4, y: -1e4 }

/* Where the ink is, published by the renderer whenever it has moved enough to
   matter. The hit test used to live over there, which was right when the
   window was a 144px strip: the worst a mistake could do was make a slice of
   your taskbar unclickable.

   The window is the whole screen now and that changes the stakes completely —
   a hit test that says yes and never says no again would leave every click
   you make landing on an invisible sheet of glass. So the test moved here,
   where the same loop that reads the cursor also decides, and there is no
   round trip that can be dropped, delayed or answered by a page that has
   stopped painting. The renderer publishes a fact; main draws the conclusion. */
ipcMain.on('haiky:ink', (_e, p) => {
  if (p && typeof p.x === 'number') at = p
})

function pollCursor () {
  if (!win || win.isDestroyed() || !win.isVisible()) {
    if (!ignoring) setIgnore(true)
    return
  }
  const b = win.getBounds()
  const p = screen.getCursorScreenPoint()
  const x = p.x - b.x
  const y = p.y - b.y
  const within = x >= 0 && x < b.width && y >= 0 && y < b.height

  /* The gaze wants the pointer wherever it is; the hit test only cares
     whether it is on the creature. Both come out of this one reading. */
  if (!within) {
    if (inside) { inside = false; send('haiky:cursor', null) }
    setIgnore(true)
    return
  }
  /* Only when it has actually moved. The strip used to be 144px tall and the
     cursor was rarely in it; the window is the whole screen now, so an
     ungated poll would send thirty messages a second for ever — and, worse,
     would tell the creature the pointer was "moving" while it sat perfectly
     still on the other side of the screen, which is enough to keep it awake
     and staring all day. */
  inside = true
  if (Math.abs(x - was.x) >= 2 || Math.abs(y - was.y) >= 2) {
    was = { x, y }
    send('haiky:cursor', { x, y })
  }

  /* Held beats the test. The creature follows the pointer exactly while it is
     being carried, so it cannot fail — but a hand moves faster than a frame,
     and one flip to ignoring mid-throw drops the pointer capture and leaves
     the thing glued to the cursor with no way to let go of it. */
  if (at.hold) { setIgnore(false); return }

  const r = Number(at.r) || 0
  setIgnore(!(r > 0 && Math.hypot(x - at.x, y - at.y) <= r))
}

/* Focusable, for as long as somebody is typing into it.

   `focusable: false` is what stops a click on the creature from pulling the
   caret out of whatever you were writing, and it is also why the ask box
   could not be typed into: a window that cannot be activated cannot deliver
   a keystroke. So it is lifted on the way in and put back on the way out.

   Put back on blur as well as on request, because the two ways out of that
   box are Escape and clicking somewhere else, and only one of them tells us. */
ipcMain.on('haiky:focus', (_e, on) => {
  if (!win || win.isDestroyed()) return
  win.setFocusable(!!on)
  if (on) win.focus()
  else win.blur()
})

function setIgnore (next) {
  if (next === ignoring || !win || win.isDestroyed()) return
  ignoring = next
  win.setIgnoreMouseEvents(next, { forward: true })
}

const get = () => win
const layout = () => place

function setShown (on) {
  if (!win || win.isDestroyed()) return
  if (on) { win.showInactive(); win.setAlwaysOnTop(true, 'screen-saver') } else win.hide()
}

const isShown = () => !!(win && !win.isDestroyed() && win.isVisible())

module.exports = { create, get, layout, send, setShown, isShown, remeasure: place_ }
