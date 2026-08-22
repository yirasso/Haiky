'use strict'

/* The tray icon, drawn rather than shipped.

   Sixteen pixels of a creature is not an asset worth keeping in a repository
   and re-exporting by hand every time the silhouette changes. It is the same
   superellipse the engine draws, sampled once into RGBA and wrapped in the
   smallest legal PNG — about forty lines, no dependency, and it regenerates
   from the shape rather than drifting away from it.

   `node build/make-icon.js` */

const zlib = require('node:zlib')
const fs = require('node:fs')
const path = require('node:path')

const crcTable = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

const crc = buf => {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk (type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const sum = Buffer.alloc(4)
  sum.writeUInt32BE(crc(body))
  return Buffer.concat([len, body, sum])
}

function png (w, h, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8      // bit depth
  ihdr[9] = 6      // truecolour with alpha
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0                     // filter: none
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

/* The idle pose, near enough: a superellipse a little wider than it is tall,
   with two eyes. Supersampled 4x4 per pixel so the edge is not a staircase at
   sixteen pixels, which is the only size anybody will ever see this at. */
function draw (size, ink, paper) {
  const px = Buffer.alloc(size * size * 4)
  const S = 4
  const cx = size / 2, cy = size / 2 + size * 0.02
  const rx = size * 0.40, ry = size * 0.38
  const n = 2.6                                  // superellipse exponent
  const inBody = (x, y) => {
    const u = Math.abs((x - cx) / rx), v = Math.abs((y - cy) / ry)
    return Math.pow(u, n) + Math.pow(v, n) <= 1
  }
  const eye = (x, y, ex) => {
    const dx = (x - (cx + ex)) / (size * 0.075)
    const dy = (y - (cy - size * 0.05)) / (size * 0.115)
    return dx * dx + dy * dy <= 1
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let body = 0, hole = 0
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const px_ = x + (sx + 0.5) / S, py_ = y + (sy + 0.5) / S
          if (!inBody(px_, py_)) continue
          body++
          if (eye(px_, py_, -size * 0.135) || eye(px_, py_, size * 0.135)) hole++
        }
      }
      const total = S * S
      const a = Math.round((body / total) * 255)
      // the eyes are the paper showing through, so they are simply less ink
      const lit = body ? hole / body : 0
      const i = (y * size + x) * 4
      /* `ink` is the body and the eyes are its opposite, which is the same
         pair the stylesheet draws from. Passed in rather than fixed, because
         a tray icon has to be light on a dark taskbar and dark on a light
         one, and Windows does not invert it for you — a black creature on
         the default Windows 11 taskbar is a creature nobody can see. */
      const v = Math.round(ink + (paper - ink) * lit)
      px[i] = v
      px[i + 1] = v
      px[i + 2] = v
      px[i + 3] = a
    }
  }
  return px
}

const DARK = 20, LIGHT = 242        // the two ends of the pair, as one channel

const out = path.join(__dirname, '..', 'src', 'assets')
fs.mkdirSync(out, { recursive: true })

/* Named for the background they go on, not for the ink they are drawn in,
   because that is the question main has to answer when it picks one. */
for (const size of [16, 32]) {
  for (const [name, ink, paper] of [['on-dark', LIGHT, DARK], ['on-light', DARK, LIGHT]]) {
    const file = path.join(out, 'tray-' + name + '-' + size + '.png')
    fs.writeFileSync(file, png(size, size, draw(size, ink, paper)))
    console.log('wrote', file)
  }
}

/* And the app icon, which electron-builder finds by name in buildResources
   and turns into the .ico. Dark, because an installer and a Start menu are
   light far more often than not, and because 512 is the size it wants. */
const app = path.join(__dirname, 'icon.png')
fs.writeFileSync(app, png(512, 512, draw(512, DARK, LIGHT)))
console.log('wrote', app)
