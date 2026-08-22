'use strict'

/* Haiky.

   A small creature that lives over the Windows taskbar and keeps company
   while Claude Code works. It is not a coding assistant and must never become
   one: there is a very good one already on the screen, and a mascot that
   starts answering technical questions is a worse copy of the thing next to
   it.

   The app has no window in the ordinary sense. There is a transparent strip
   lying over the taskbar, a tray icon, and eventually a settings window.
   Which means the tray is not decoration: without it there is no way to quit,
   and it is built before anything that could fail.

   Four things run and they are deliberately independent of one another:

     sessions.js   is Claude Code open, and where          → whether it is seen
     bridge.js     what Claude Code is doing               → what it does
     overlay.js    the window, and where the floor is      → where it lives
     hooks.js      the one thing that writes somebody else's file
     intents.js    what it understands for free            → what it says
     mascot.js     what it does not                        → what it says

   Nothing launches with Claude Code and nothing tries to. Haiky starts at
   login, sits invisible, and appears when a session file appears. Watching
   for a file is a fact; watching for a process to be spawned is a race. */

const { app, Tray, Menu, dialog, nativeImage, nativeTheme, globalShortcut, ipcMain, shell } = require('electron')
const path = require('node:path')

const overlay = require('./overlay')
const sessions = require('./sessions')
const bridge = require('./bridge')
const hooks = require('./hooks')
const mascot = require('./mascot')
const intents = require('./intents')
const store = require('./store')

/* One creature. A second instance would put a second strip over the taskbar
   and the two would walk through each other, which is funny exactly once. */
if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

app.setAppUserModelId('co.nanomark.haiky')

let tray = null
let live = []

const prefs = () => store.load('prefs')

function setPref (patch) {
  const next = { ...prefs(), ...patch }
  store.save('prefs', next)
  return next
}

const backupDir = () => path.join(app.getPath('userData'), 'backups')

/* ── whether it is seen ──
   Two conditions and one function, so there is no third place that decides
   this and gets it wrong. The master switch is yours; the second is the whole
   of "opens automatically with Claude Code" — it is here rather than in a
   launcher because appearing is cheaper and more reliable than starting. */
function refreshShown () {
  const p = prefs()
  const want = !!p.on && (p.withClaude === false || live.length > 0)
  overlay.setShown(want)
}

/* Coming back at login, and the half of it that is only true in development.

   `setLoginItemSettings` defaults to `process.execPath`, which in a packaged
   build is Haiky.exe and is exactly right. Running from a checkout it is
   node_modules/electron/dist/electron.exe — and Electron with no app path
   opens its own welcome window. So the entry would have started something,
   just not this, and the failure would have arrived at the next login rather
   than at the click.

   Packaged, the app path is inside the asar and must not be passed. */
function applyAutostart (on) {
  const args = app.isPackaged ? ['--hidden'] : [app.getAppPath(), '--hidden']
  app.setLoginItemSettings({ openAtLogin: !!on, path: process.execPath, args })
  setPref({ autostart: !!on })
}

const autostartOn = () => !!app.getLoginItemSettings().openAtLogin

/* ── the one thing that writes somebody else's file ──
   Never without being asked, and never without showing exactly what will be
   written. The dialog prints the JSON rather than a description of it: a
   summary of a settings change is a summary somebody has to take on trust,
   and this is the one action in the app that touches a file Haiky does not
   own.

   Nothing calls this, or uninstall(), since the tray item that did was
   removed. On this machine the hooks are already in and syncHooks() keeps
   them repaired, so nothing is missing — but a fresh install now has no way
   to put them in, and without them the creature never learns what Claude Code
   is doing, which is the whole of what it is for. Both are kept whole rather
   than deleted because what is missing is the entry point, not the
   machinery. */
async function askToInstall () {
  const { port, token } = bridge.state()
  if (!port) {
    dialog.showMessageBox({
      type: 'warning',
      title: 'Haiky',
      message: 'No port to listen on.',
      detail: 'Haiky could not open a local port, so there is nowhere for Claude Code to send anything. Nothing was written.'
    })
    return
  }

  const body = JSON.stringify(hooks.preview(port, token), null, 2)
  const r = await dialog.showMessageBox({
    type: 'question',
    title: 'Haiky',
    message: 'Let Haiky see what Claude Code is doing?',
    detail: [
      'This merges the block below into ' + hooks.FILE + '.',
      '',
      'Nothing else in that file is touched, a copy of it is saved first, and',
      'removing this puts the file back exactly as it was. Every hook is',
      'asynchronous, so Claude Code never waits for Haiky.',
      '',
      body
    ].join('\n'),
    buttons: ['Install', 'Cancel'],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  })
  if (r.response !== 0) return

  const out = hooks.install(port, token, backupDir())
  if (!out.ok) {
    dialog.showMessageBox({
      type: 'error',
      title: 'Haiky',
      message: 'Nothing was written.',
      detail: out.why === 'unreadable'
        ? hooks.FILE + ' is there but will not parse. Haiky will not merge into a file it cannot read — that would replace it. Fix or move it and try again.'
        : String(out.detail || 'The file could not be written.')
    })
    return
  }
  setPref({ hooksInstalled: true })
  paintTray()
}

function uninstall () {
  const out = hooks.remove(backupDir())
  setPref({ hooksInstalled: false })
  paintTray()
  if (!out.ok) {
    dialog.showMessageBox({
      type: 'error',
      title: 'Haiky',
      message: 'The hooks could not be removed.',
      detail: hooks.FILE + ' could not be read or written. Nothing was changed.'
    })
  }
}

/* Installed once and drifted since — most likely because something else took
   the port while Haiky was closed and the bridge came up on the next one.
   Repairing it without asking again is honouring the consent already given,
   not taking a new liberty: the block is the same block, pointed at the same
   app, on a number nobody chose. */
function syncHooks () {
  if (!prefs().hooksInstalled) return
  const { port, token } = bridge.state()
  if (!port) return
  if (hooks.status(port, token).complete) return
  hooks.install(port, token, backupDir())
}

/* The tray icon, in the pair the creature is drawn from — a pale body with
   dark eyes on a dark taskbar, and the other way round on a light one.

   Windows does not invert a tray icon for you, and it is the first thing this
   app shows: the first version shipped a black creature, which on a default
   Windows 11 taskbar is a creature nobody can see. Followed live, because the
   taskbar changes colour the moment the system theme does and an icon that
   only got it right at launch is one that goes invisible while you watch. */
function trayIcon () {
  const on = nativeTheme.shouldUseDarkColors ? 'on-dark' : 'on-light'
  return nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'tray-' + on + '-16.png'))
}

function buildTray () {
  tray = new Tray(trayIcon())
  tray.setToolTip('Haiky')
  paintTray()
  tray.on('click', () => tray.popUpContextMenu())
  nativeTheme.on('updated', () => { if (tray) tray.setImage(trayIcon()) })
}

/* What it has cost you, in the one place you would think to look. Under a
   cent says under a cent rather than zero: a meter that reads nothing after
   money has left is a meter you stop believing, and this one will sit under
   a cent for a long while — which is the honest answer and also the
   reassuring one. */
function spent () {
  const s = mascot.state()
  if (!s.spent.calls) return 'Has not spoken yet'
  const c = s.spent.cost
  const money = c < 0.01 ? 'under $0.01' : '$' + c.toFixed(2)
  return s.spent.calls + (s.spent.calls === 1 ? ' reply' : ' replies') + ' · ' + money
}

/* The menu is what it costs, two switches, and the way out.

   The bill is first because it is the only line here you open the menu to
   read; everything else you came to click. What Claude Code is doing was the
   top line and is now nowhere: the creature on your taskbar already says it,
   in colour and in posture, and a menu that restates the thing you can see is
   a menu that made you open it for nothing.

   There is no master switch any more. "Somebody there" was a second way to
   mean Quit that left the app running invisibly, and two words for one
   intention is one of them being misread. If you do not want it, close it. */
function paintTray () {
  if (!tray) return
  const p = prefs()

  tray.setContextMenu(Menu.buildFromTemplate([
    { label: spent(), enabled: false },
    { type: 'separator' },
    {
      label: 'Only when Claude Code is open',
      type: 'checkbox',
      checked: p.withClaude !== false,
      click: m => { setPref({ withClaude: m.checked }); refreshShown(); paintTray() }
    },
    {
      label: 'Start with Windows',
      type: 'checkbox',
      checked: autostartOn(),
      click: m => { applyAutostart(m.checked); paintTray() }
    },
    { type: 'separator' },
    { label: 'Where its memory lives', click: () => shell.openPath(app.getPath('userData')) },
    { label: 'Quit Haiky', click: () => app.quit() }
  ]))
}

app.whenReady().then(async () => {
  buildTray()

  /* The bridge first, because the hook block that gets repaired below has to
     name the port it actually got. The token is kept across launches so that
     a settings file written last week still authenticates today. */
  const p = prefs()
  const got = await bridge.start({
    port: p.port,
    token: p.token,
    onRun: run => overlay.send('haiky:run', run)
  })
  setPref({ port: got.port, token: got.token })

  overlay.create()

  live = sessions.start(next => {
    live = next
    overlay.send('haiky:sessions', live)
    refreshShown()
    paintTray()
  })

  syncHooks()
  refreshShown()
  paintTray()

  /* Somewhere to put it out of the way that does not involve the tray — for
     the demo, the screenshot and the full-screen game. Registration can fail
     if something else holds the combination, and that is not worth a dialog:
     the tray still switches it off. */
  globalShortcut.register('Control+Shift+H', () => {
    setPref({ on: !prefs().on })
    refreshShown()
    paintTray()
  })
})

/* The strip is the only window and closing it is not a thing that can happen
   from outside, so the default "quit when the last window closes" would only
   ever fire by accident. The tray decides when this app is over. */
app.on('window-all-closed', () => {})

app.on('second-instance', () => {
  setPref({ on: true })
  refreshShown()
  paintTray()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  sessions.stop()
  bridge.stop()
  store.flush()
})

/* ── the acts ──
   The whole of what the creature is allowed to do to the machine it lives on.
   In Origin this was a list of the host's own buttons to press, and the
   guarantee was that the creature could do nothing the page could not already
   do. There is no page here, so the guarantee is restated rather than
   inherited: every act below is one narrow function taking no argument, there
   is no shell, no path and no name that reaches a filesystem, and a name that
   is not in this object does nothing at all.

   Read this as the permission list, and keep it that way. The moment one of
   them takes an argument from the renderer, the guarantee is gone. */
const ACT = {
  none: () => {},
  hide: () => { setPref({ on: false }); refreshShown(); paintTray() },
  bigger: () => setPref({ scale: Math.min(2, Number((prefs().scale + 0.25).toFixed(2))) }),
  smaller: () => setPref({ scale: Math.max(0.5, Number((prefs().scale - 0.25).toFixed(2))) })
}

ipcMain.handle('haiky:act', (_e, name) => {
  const fn = ACT[name]
  if (!fn) return { ok: false }
  fn()
  overlay.send('haiky:settings', prefs())
  return { ok: true }
})

/* ── the voice ──
   Two answerers behind one channel, and the order is the whole point. The
   script table is asked first and takes the short imperatives about its own
   body — dorme, salta, fica maior — in well under a millisecond and for
   nothing at all. Only what it declines to claim goes to Haiku.

   FILE.md asked for exactly this, and for a reason worth restating: a
   creature that takes a second and a half to sit down is a creature you stop
   asking. The model is for the half a table of regexes is no good at, which
   is everything with a person in it.

   Nothing downstream is told which one answered, and the page could not use
   the difference if it were. */
ipcMain.handle('haiky:talk', async (_e, ctx) => {
  const c = ctx || {}
  const quick = intents.match(c.text)
  if (quick) return quick
  return mascot.talk({ ...c, sessions: Array.isArray(c.sessions) ? c.sessions : [] })
})

/* Whether there is anything to talk to at all — a Claude Code binary to run
   the turn through, and a MASCOT.md to be somebody out of. Asked by the page
   before it offers you a box, because a box that opens and then admits it
   can do nothing costs a click to learn what an inert button says for free. */
ipcMain.handle('haiky:ready', () => mascot.ready())

ipcMain.handle('haiky:settings-get', () => prefs())
