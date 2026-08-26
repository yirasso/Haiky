'use strict'

/* What Claude Code is doing, and how it gets here.

   A hook fires inside Claude Code and posts to this server, which turns it
   into one of the five words the creature has always understood — `working`,
   `waiting`, `done`, `stopped`, or nothing at all. Those five are not invented
   here: they are the run states of the app the engine came from, and using
   them again is what lets the whole of its reaction to them be untouched code.

   **`async: true` on every hook is not a detail.** A hook Claude Code waits
   for is a hook that makes Claude Code slower, and nothing about a mascote is
   worth a millisecond of somebody's turn. Asynchronous hooks are dispatched
   and forgotten; if this server is not running, or is busy, or has been
   uninstalled and the settings not yet cleaned, Claude Code notices nothing.

   **Five events and no more.** The obvious design puts PreToolUse and
   PostToolUse in as well, and it would mean a hundred requests for a turn
   with fifty tool calls — to tell us something we already knew, because
   nothing expires between the prompt and the stop. They are where the flavour
   would come from later ("it is reading a file", "it is running tests") and
   that is a reason to add them when there is something to do with them, not
   now.

   The security is small because the surface is small: loopback only, a random
   token in a header, a fixed set of paths, and a body that is read for one
   field and otherwise ignored. It accepts nothing that can change anything —
   the worst a forged request can do is make a cartoon look thoughtful. */

const http = require('node:http')
const crypto = require('node:crypto')

/* Where to start looking. Nothing owns this number; it is high, unassigned,
   and if something else has it we take the next one and write it down. */
const BASE = 47821
const TRIES = 12

/* How long `done` and `stopped` stay on the body before they lapse. The
   engine flashes for 2.4s on the first and 2.6s on the second and then wants
   the state gone, or the next turn's finish is not a change and does not
   flash at all. */
const LAPSE = 3200

/* And how long a turn is allowed to run before we stop believing in it.

   Every state here is set by an event and cleared by another one, so a lost
   event is a creature stuck in a pose for the rest of the day — thinking hard
   about a turn that ended an hour ago. And events do get lost: the hooks can
   be removed while a turn is in flight, Claude Code can be killed between the
   prompt and the stop, and an asynchronous hook is by definition one nobody
   waited to see arrive.

   Twenty minutes, because the number has to be longer than a real turn and a
   real turn can be very long. This is a backstop, not a timeout: if it is
   ever reached in ordinary use it is hiding a bug rather than covering one. */
const STALE = 20 * 60 * 1000

const STATES = new Set(['working', 'waiting', 'done', 'stopped', 'end'])

let server = null
let port = 0
let token = ''
let onRun = null

/* One state per session, because two Claude Codes can be busy at once and the
   creature has one face. What it shows is the most demanding of them: being
   asked a question outranks working, and working outranks having finished.
   Anything else and a turn finishing in one window would cancel the question
   waiting in another. */
const RANK = { waiting: 4, working: 3, stopped: 2, done: 1 }
const runs = new Map()
const lapses = new Map()

function worst () {
  let best = ''
  for (const v of runs.values()) {
    if (!best || (RANK[v] || 0) > (RANK[best] || 0)) best = v
  }
  return best
}

let last = null
function publish () {
  const now = worst()
  if (now === last) return
  last = now
  if (onRun) onRun(now)
}

function set (id, state) {
  clearTimeout(lapses.get(id))
  lapses.delete(id)

  if (state === 'end') { runs.delete(id); publish(); return }

  runs.set(id, state)
  publish()

  /* Finished and stopped are moments, not conditions. They lapse quickly so
     that the next one is a change again — a body that stayed on `done` for
     ever would flash once and never after. Working and waiting are
     conditions, and lapse only as a backstop against an event that never
     came. Both go through the same timer, because two mechanisms for
     "forget this eventually" is one of them nobody maintains. */
  const after = state === 'done' || state === 'stopped' ? LAPSE : STALE
  lapses.set(id, setTimeout(() => {
    lapses.delete(id)
    if (runs.get(id) === state) { runs.delete(id); publish() }
  }, after))
}

const loopback = a =>
  a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1'

function handle (req, res) {
  const done = code => { res.writeHead(code, { 'content-type': 'application/json' }); res.end('{}') }

  // never anything but this machine, whatever the OS thinks it bound to
  if (!loopback(req.socket.remoteAddress)) return done(403)
  if (req.headers['x-haiky'] !== token) return done(403)
  if (req.method !== 'POST') return done(405)

  const m = /^\/haiky\/([a-z]+)$/.exec(req.url || '')
  if (!m || !STATES.has(m[1])) return done(404)
  const state = m[1]

  /* The body is Claude Code's hook payload and the only field wanted out of
     it is which session it was. Capped, because a body is somebody else's
     size and this is a mascot. */
  let body = ''
  let over = false
  req.on('data', c => {
    if (over) return
    body += c
    if (body.length > 65536) { over = true; body = '' }
  })
  req.on('end', () => {
    let id = 'one'
    try {
      const d = JSON.parse(body)
      if (d && d.session_id) id = String(d.session_id)
    } catch {
      /* No body, or not JSON. One anonymous session is a worse answer than a
         real id and a better one than dropping the event. */
    }
    set(id, state)
    done(200)
  })
  req.on('error', () => done(400))
}

/* A fixed port written into somebody's settings file has to survive the day
   another program takes it, so this walks upward and reports what it got.
   hooks.js compares that against what is installed and rewrites the block if
   they have drifted — which is why nothing here has to get it right first
   time. */
function listen (want) {
  return new Promise(resolve => {
    let p = Number(want) || BASE
    let n = 0
    const s = http.createServer(handle)
    s.on('error', err => {
      if (err && err.code === 'EADDRINUSE' && ++n < TRIES) {
        p = BASE + n
        s.listen(p, '127.0.0.1')
        return
      }
      resolve(0)
    })
    s.on('listening', () => { server = s; port = p; resolve(p) })
    s.listen(p, '127.0.0.1')
  })
}

async function start (opts) {
  const o = opts || {}
  onRun = o.onRun || null
  token = o.token || crypto.randomBytes(16).toString('hex')
  const got = await listen(o.port)
  return { port: got, token }
}

function stop () {
  for (const t of lapses.values()) clearTimeout(t)
  lapses.clear()
  runs.clear()
  if (server) { try { server.close() } catch {} }
  server = null
}

const state = () => ({ port, token, run: worst(), sessions: runs.size })

module.exports = { start, stop, state, BASE }
