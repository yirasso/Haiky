'use strict'

/* What the app remembers between launches, and the only place that writes it.

   Everything lives in userData as plain JSON: the
   whole of it is a few hundred records of a few fields each, and a database
   for that is a dependency bought with nothing.

   Two rules it keeps, both learned the expensive way in Origin.

   Writes are trailing and coalesced. The renderer calls save() every time its
   model changes — every keystroke in a draft, every drag of a slider — and
   does no debouncing of its own, because a debounce per caller is a debounce
   to get wrong per caller. One timer per document, armed on the first change
   and reset by each one after it, and the file is written once the changes
   stop. Which means every write has to be matched by a flush before the app
   can go away, or the last few seconds of work leave with it.

   Writes are atomic. A JSON file half-written is a JSON file that will not
   parse, and the app would come back next launch having forgotten everything
   rather than the one thing it was in the middle of saving. Writing to a
   sibling and renaming over the target makes the swap a single operation as
   far as anything reading it is concerned.

   Reads are forgiving. A file that is missing, unparseable, or from a version
   this build does not know about is not an error — it is an app that has not
   been run yet, which is a state it must open in anyway. */

const { app } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

/* the whitelist. A document name reaches this module from the renderer, and a
   renderer that picks its own filename picks ..\..\Startup\something.json —
   so the names are a fixed set and anything else is not a typo to repair but
   a message to drop. Nothing in this app hands a name across at all, which
   is why the writable set below is empty. */
const DOCS = {
  /* Everything the creature is, as a preference: whether it is there at all,
     how big, which skin, whether it makes a sound, and whether it comes back
     at login. Written by main from the settings window and from the acts, and
     absent from WRITABLE for the ordinary reason — a page that could write
     this could switch its own autostart on. */
  prefs: {
    version: 1,
    on: true,
    scale: 1,
    skin: 'ink',
    sound: false,
    autostart: false,
    hooksInstalled: false,
    port: 0,
    token: ''
  },
  /* The creature's name and the handful of things it has been told worth
     keeping. Not in WRITABLE: main writes it, from the one place that knows
     what was said — a page that could write this could write the creature a
     memory it never had. */
  mascot: { version: 1, name: '', memory: [] },
  /* What the creature has cost. Its own ledger, written only by the module
     that spends it, and never cleared by anything the creature itself does:
     what a call cost you is a fact about your account, not a memory. */
  usage: {
    version: 1,
    calls: 0, in: 0, out: 0, cost: 0,
    week: { resets: '', calls: 0, in: 0, out: 0, cost: 0 }
  }
}

// what the renderer is allowed to hand to save() through the bridge
const WRITABLE = new Set()

const IDLE = 400   // long enough to coalesce a slider being dragged

const file = name => path.join(app.getPath('userData'), name + '.json')

/** @type {Map<string, {value: unknown, timer: NodeJS.Timeout | null}>} */
const held = new Map()

/* the shape a document falls back to. Returned by value, so a caller that
   mutates what it got does not edit the default for everyone after it. */
const fallback = name => JSON.parse(JSON.stringify(DOCS[name] ?? {}))

function load (name) {
  if (!(name in DOCS)) throw new Error('unknown document: ' + name)
  if (held.has(name)) return held.get(name).value

  let value = fallback(name)
  try {
    const read = JSON.parse(fs.readFileSync(file(name), 'utf8'))
    /* a version from the future is a file this build cannot read without
       guessing at it, and guessing at someone's projects is worse than
       starting over visibly */
    if (read && typeof read === 'object' && read.version === DOCS[name].version) {
      value = { ...fallback(name), ...read }
    }
  } catch {
    // not written yet, or hand-edited into nonsense — either way, the default
  }

  held.set(name, { value, timer: null })
  return value
}

function write (name) {
  const slot = held.get(name)
  if (!slot) return
  slot.timer = null
  const target = file(name)
  const tmp = target + '.tmp'
  try {
    fs.writeFileSync(tmp, JSON.stringify(slot.value, null, 2))
    fs.renameSync(tmp, target)
  } catch {
    /* a failed write is worth neither a crash nor a dialog: the value is still
       in memory, the next change will try again, and the worst case is that
       the app opens tomorrow the way it opened today */
    try { fs.unlinkSync(tmp) } catch {}
  }
}

function save (name, value) {
  if (!(name in DOCS)) return
  const slot = held.get(name) || { value: null, timer: null }
  slot.value = { ...value, version: DOCS[name].version }
  held.set(name, slot)
  clearTimeout(slot.timer)
  slot.timer = setTimeout(() => write(name), IDLE)
}

/* everything still on a timer, now. Called on the window closing and again on
   the app quitting, because either can be the last thing that happens. */
function flush () {
  for (const [name, slot] of held) {
    if (!slot.timer) continue
    clearTimeout(slot.timer)
    write(name)
  }
}

module.exports = { load, save, flush, WRITABLE, DOCS }
