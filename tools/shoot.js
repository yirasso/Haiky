'use strict'

/* The screenshots in the README, regenerated: `npm run shots`.
 *
 * Same argument as tools/make-icon.js. An icon that was drawn once in some
 * other program is an asset nobody can reproduce; so is a screenshot cropped
 * out of somebody's desktop one afternoon. This loads the shipping renderer —
 * src/renderer/overlay.html, its own stylesheet, its own 1,532 lines — into an
 * ordinary BrowserWindow, drives it through the same surfaces main drives it
 * through, and photographs the result.
 *
 * Two things in the frame are not the app and are named as such in the README:
 * the backdrop, which is drawn rather than photographed because a real desktop
 * would put whatever was open that afternoon into a public repository, and the
 * one sentence the creature says, which is written here rather than paid for.
 * The creature, its shape, its colours, its physics and the placement of every
 * bubble are the app.
 */

const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

const ROOT = path.join(__dirname, '..')
const PAGE = path.join(ROOT, 'src', 'renderer', 'overlay.html')
const OUT = path.join(ROOT, 'docs', 'images')

/* A window the size of the picture. The creature is 60px here because 60px is
 * what it is on your taskbar — there is no reason for a screenshot to flatter
 * it into something bigger than the thing you will actually get.
 */
const W = 760
const H = 210
const BAR = 48                                  // a Windows 11 taskbar, near enough

/* The room, in the shape geometry.layout() sends over haiky:place. `floor` is
 * the top edge of the bar, exactly as it is in the app. `left` and `right` are
 * the one liberty: the walls are brought in to a narrow band in the middle so
 * that the creature, which chooses where to stand, chooses somewhere the
 * camera is pointing. It walks and falls inside that band under its own rules.
 */
const place = {
  edge: 'bottom',
  hidden: false,
  win: { x: 0, y: 0, width: W, height: H },
  bar: { x: 0, y: H - BAR, width: W, height: BAR },
  floor: H - BAR,
  ceiling: 0,
  left: W / 2 - 45,
  right: W / 2 + 45,
  scale: 1,
  displayId: 0
}

const wait = ms => new Promise(r => setTimeout(r, ms))

/* Each shot: a file name, what to do to the creature, and how long to leave it
 * before the shutter. The waits are the interesting part — `done` is caught
 * 170ms in because the hop is the notification, and `think` at 700ms because
 * the dots are only up while a question of ours is in flight.
 */
const SHOTS = [
  {
    file: 'creature.png',
    what: 'standing on the bar',
    async run (js) { await wait(2600) }
  },
  {
    file: 'done.png',
    what: 'a turn has finished — blue, and a hop',
    async run (js) {
      await wait(1200)
      await js('__shot.run("working")')
      await wait(900)
      await js('__shot.run("done")')
      await wait(170)
    }
  },
  {
    file: 'ask.png',
    what: 'the right button, and the box it opens',
    async run (js) {
      await wait(1800)
      await js('__shot.rclick()')
      await wait(600)
    }
  },
  {
    file: 'think.png',
    what: 'the squint and the three dots — a question of ours in flight',
    async run (js) {
      await wait(1600)
      await js('__shot.rclick()')
      await wait(400)
      await js('__shot.typed("como é que estás?")')
      await js('__shot.submit()')
      await wait(700)
    }
  },
  {
    file: 'say.png',
    what: 'the bubble, over its head',
    async run (js) {
      await wait(1600)
      await js('__shot.rclick()')
      await wait(400)
      await js('__shot.typed("como é que estás?")')
      await js('__shot.submit()')
      await wait(2100)
    }
  }
]

async function shoot (win, shot) {
  const js = code => win.webContents.executeJavaScript(code, true)

  await win.loadFile(PAGE)
  await js(`__shot.backdrop(${BAR})`)
  await js(`__shot.place(${JSON.stringify(place)})`)
  await js('__shot.sessions([{ where: "Haiky" }])')

  await shot.run(js)

  const img = await win.webContents.capturePage()
  const png = img.toPNG()
  fs.writeFileSync(path.join(OUT, shot.file), png)
  const s = img.getSize()
  console.log(`  ${shot.file.padEnd(14)} ${s.width}×${s.height}  ${(png.length / 1024).toFixed(0)}KB  — ${shot.what}`)
}

app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true })

  const win = new BrowserWindow({
    width: W,
    height: H,
    show: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    backgroundColor: '#14171f',
    webPreferences: {
      preload: path.join(__dirname, 'shoot-preload.js'),
      contextIsolation: false,
      sandbox: false,
      // the creature is not a stopwatch; nothing here is throttled off-screen
      backgroundThrottling: false
    }
  })

  /* It must not eat a click meant for whatever is underneath while it sits
     there for the fifteen seconds this takes. */
  win.setIgnoreMouseEvents(true)

  console.log(`\nshooting ${SHOTS.length} into docs/images/ at ${W}×${H}\n`)
  for (const shot of SHOTS) await shoot(win, shot)
  console.log('')

  win.destroy()
  app.quit()
}).catch(err => {
  console.error(err)
  app.exit(1)
})
