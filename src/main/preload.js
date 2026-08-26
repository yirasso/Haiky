'use strict'

/* The bridge, and one trick that is most of why porting the engine is small.

   In the app the engine came from, the creature learnt what the agent was
   doing by watching `body.dataset.run` with a MutationObserver — a deliberate
   choice, so that it had no edge into the module graph and could not be part
   of a cycle. There is no host page here to write that attribute, so **this
   writes it**. The observer, the flash on `done`, the worry on `stopped` and
   every pose that hangs off them are then untouched code: the creature cannot
   tell that the fact now arrives over IPC from a hook instead of from a
   composer next door.

   Everything else the page may do is named here, and the list is the whole of
   it. The renderer gets no `require`, no `ipcRenderer`, and no way to ask for
   a channel by name. */

const { contextBridge, ipcRenderer } = require('electron')

/* The run state, written where the engine already looks for it. Guarded on
   readyState because a hook can land before the document has a body — the
   creature would then miss the very first turn of a session, which is the one
   it most wants to react to. */
let pending = null
function writeRun (run) {
  if (!document.body) { pending = run; return }
  if (run) document.body.dataset.run = run
  else delete document.body.dataset.run
}

document.addEventListener('DOMContentLoaded', () => {
  if (pending !== null) { writeRun(pending); pending = null }
})

ipcRenderer.on('haiky:run', (_e, run) => writeRun(run))

contextBridge.exposeInMainWorld('haiky', {
  /* Where the strip is and where the bar sits inside it. Pushed rather than
     asked for, because every source of a change is in main. */
  onPlace: cb => ipcRenderer.on('haiky:place', (_e, p) => cb(p)),

  /* Whether there are Claude Code sessions open, and what they are. */
  onSessions: cb => ipcRenderer.on('haiky:sessions', (_e, s) => cb(s)),

  /* Where the pointer is, in the strip's own coordinates, or null once it has
     left. This arrives from main rather than from the page's own pointermove,
     and the reason is written down in overlay.js: a window that is never
     activated is never forwarded mouse movement, however the flag is set. */
  onCursor: cb => ipcRenderer.on('haiky:cursor', (_e, p) => cb(p)),

  /* Where the ink is this moment, and how big. Main does the hit test against
     it — see the note in overlay.js for why that moved out of the page. Sent
     only when it has moved enough to matter, so a creature standing still
     sends nothing at all. */
  ink: (x, y, r, hold) => ipcRenderer.send('haiky:ink', { x, y, r, hold: !!hold }),

  /* An act, by name. Main holds the allowlist; a name that is not on it does
     nothing at all, and that is the whole permission surface. */
  act: name => ipcRenderer.invoke('haiky:act', String(name || '')),

  /* Saying something to it. What goes across is what was said and the little
     it knows about the moment — its mood, what Claude Code is doing, which
     folders are open, where it is standing. It never hands over a path, a
     transcript or a line of code: what the creature can see is decided on the
     far side, not asked for politely here. */
  talk: ctx => ipcRenderer.invoke('haiky:talk', ctx),
  ready: () => ipcRenderer.invoke('haiky:ready'),

  /* The one thing the ask box needs and nothing else does. The window is
     unfocusable so that clicking the creature never takes your caret; a text
     field in such a window cannot be typed into, so this lifts it for exactly
     as long as the box is open. */
  focus: on => ipcRenderer.send('haiky:focus', !!on),

  settings: {
    get: () => ipcRenderer.invoke('haiky:settings-get'),
    onChange: cb => ipcRenderer.on('haiky:settings', (_e, s) => cb(s))
  }
})
