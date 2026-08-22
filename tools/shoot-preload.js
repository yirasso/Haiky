'use strict'

/* The stand-in bridge, for the screenshots only.

   `src/renderer/mascot.js` reads `window.haiky` once, at the top, and guards
   every use of it — the comment there says the file is opened in a plain
   browser now and then to look at the shape. This is that, with the eleven
   channels answered by a script instead of by main, so the creature can be
   put into a state and photographed.

   Nothing here is loaded by the app. The renderer cannot tell the difference,
   which is the point: what the camera sees is the shipping engine, in the
   shipping stylesheet, driven through the same surfaces main drives it
   through. The only inventions are the backdrop and the sentence it says,
   and both are marked as such in the README. */

const cbs = {}

/* One reply, delayed, so that the wait is long enough to photograph the
   squint and the three dots on the way to the bubble. */
let SAY = 'Estou aqui.'
let DELAY = 1400

window.haiky = {
  onPlace: cb => { cbs.place = cb },
  onSessions: cb => { cbs.sessions = cb },
  onCursor: cb => { cbs.cursor = cb },

  // renderer → main: swallowed. Nothing is listening and nothing needs to.
  ink: () => {},
  focus: () => {},

  act: async () => true,
  ready: async () => true,
  talk: async () => {
    await new Promise(r => setTimeout(r, DELAY))
    return { ok: true, say: SAY }
  },

  settings: {
    get: async () => ({ scale: 1 }),
    onChange: cb => { cbs.settings = cb }
  }
}

/* The camera's own controls. Everything below pushes on a public surface —
   the three main-to-renderer callbacks, `body.dataset.run` where the preload
   writes it, and real events on the ink — so no state is reached into. */
window.__shot = {
  say (text, delay) { SAY = text; if (delay != null) DELAY = delay },

  place: p => cbs.place && cbs.place(p),
  sessions: s => cbs.sessions && cbs.sessions(s),
  cursor: p => cbs.cursor && cbs.cursor(p),

  run (r) {
    if (r) document.body.dataset.run = r
    else delete document.body.dataset.run
  },

  // the right button, on the ink, where mascot.js listens for it
  rclick () {
    const el = document.querySelector('.mas-body')
    const r = el.getBoundingClientRect()
    el.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true, cancelable: true,
      clientX: r.x + r.width / 2, clientY: r.y + r.height / 2
    }))
  },

  typed (text) {
    const i = document.querySelector('.mas-ask input')
    if (i) i.value = text
  },

  submit () {
    const f = document.querySelector('.mas-ask')
    if (f) f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  },

  /* A desktop to stand on. Drawn, not photographed: a gradient where a
     wallpaper would be and a strip of neutral rounded squares where the
     taskbar would be. It is deliberately nobody's real desktop — a screenshot
     of one would put whatever happened to be open that afternoon into a
     public repository. */
  backdrop (bar) {
    const css = document.createElement('style')
    css.textContent = `
      #shot-sky {
        position: fixed; inset: 0; z-index: -2;
        background:
          radial-gradient(120% 90% at 22% 0%, #37415f 0%, rgba(55,65,95,0) 60%),
          radial-gradient(90% 80% at 88% 12%, #3d3350 0%, rgba(61,51,80,0) 55%),
          linear-gradient(168deg, #232a3f 0%, #191d2c 58%, #14171f 100%);
      }
      #shot-bar {
        position: fixed; left: 0; right: 0; bottom: 0; height: ${bar}px; z-index: -1;
        background: rgba(18, 20, 26, .94);
        border-top: 1px solid rgba(255, 255, 255, .07);
      }
      #shot-icons {
        position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
        height: ${bar}px; display: flex; gap: 9px; align-items: center; z-index: -1;
      }
      #shot-icons i { width: 25px; height: 25px; border-radius: 7px; background: rgba(255,255,255,.13) }
      #shot-clock {
        position: fixed; right: 15px; bottom: 0; height: ${bar}px; z-index: -1;
        display: flex; flex-direction: column; justify-content: center; align-items: flex-end;
        gap: 1px; color: rgba(255,255,255,.66);
        font: 11px/1.2 "Segoe UI", system-ui, sans-serif;
      }`
    document.head.appendChild(css)

    const sky = document.createElement('div')
    sky.id = 'shot-sky'

    const strip = document.createElement('div')
    strip.id = 'shot-bar'

    const icons = document.createElement('div')
    icons.id = 'shot-icons'
    icons.innerHTML = '<i></i><i></i><i></i><i></i><i></i>'

    const clock = document.createElement('div')
    clock.id = 'shot-clock'
    clock.innerHTML = '<span>14:32</span><span>22/08/2026</span>'

    document.body.append(sky, strip, icons, clock)
  }
}
