'use strict'

/* Whether Claude Code is open, and where.

   Claude Code writes one small JSON file per live session into
   ~/.claude/sessions, named for the process id, and it looks like this:

     { "pid": 10572, "sessionId": "0e840087-…", "cwd": "C:\\Dev\\Origin",
       "startedAt": 1787162478674, "version": "2.1.234",
       "kind": "interactive", "entrypoint": "claude-desktop",
       "name": "origin-65" }

   That directory IS the answer to "is it open", and watching it is exact,
   instant and free. This is the whole of what makes the creature appear when
   you start working and go away when you stop, and it is worth saying what it
   replaces: enumerating processes on a timer, which is slower, heavier, wrong
   between polls, and would have had to guess which node.exe was which.

   Nothing here launches with Claude Code and nothing tries to. Haiky starts
   at login, sits invisible, and appears when a file appears. Watching for a
   file is a fact; watching for a process to be spawned is a race.

   Two things the directory gets wrong, and both are handled rather than
   trusted:

   **Files outlive their process.** A session killed with the task manager, or
   lost to a crash, leaves its file behind — this machine had sixty-two of
   them and four live sessions. So every file is checked against its pid
   before it counts. `process.kill(pid, 0)` sends no signal; it asks whether
   the process is there.

   **Pids are reused.** A file whose process died and whose number has since
   been handed to something else reads as alive. It is left that way on
   purpose: the failure is a creature that stays visible slightly too long,
   the fix would be comparing process start times through another syscall, and
   that is a lot of machinery bought to make a mascot disappear promptly. */

const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

const DIR = path.join(os.homedir(), '.claude', 'sessions')
const NAME = /^\d+\.json$/          // the .key files beside them are not sessions
const SETTLE = 160                  // one rescan for a burst of writes
const RETRY = 5000                  // how often to look for a directory that is not there yet

let listeners = []
let current = []
let timer = null
let watcher = null
let retry = null

/* Alive, as far as this user can tell. EPERM means the process exists and
   belongs to somebody else, which for our purposes is the same as alive —
   and is the answer you get for an elevated Claude Code. */
function alive (pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (err) {
    return err && err.code === 'EPERM'
  }
}

function read () {
  let names = []
  try {
    names = fs.readdirSync(DIR)
  } catch {
    return []                        // never run, or removed while we watched it
  }

  const out = []
  for (const n of names) {
    if (!NAME.test(n)) continue
    let d = null
    try {
      d = JSON.parse(fs.readFileSync(path.join(DIR, n), 'utf8'))
    } catch {
      /* Half-written, or hand-edited into nonsense. Skipping it is right and
         also self-repairing: the next write brings it back. */
      continue
    }
    if (!d || !alive(d.pid)) continue
    out.push({
      pid: d.pid,
      id: String(d.sessionId || ''),
      cwd: String(d.cwd || ''),
      // the folder's own name is the only part of a path worth showing
      where: path.basename(String(d.cwd || '')) || '',
      name: String(d.name || ''),
      entrypoint: String(d.entrypoint || ''),
      startedAt: Number(d.startedAt) || 0
    })
  }
  out.sort((a, b) => a.startedAt - b.startedAt)
  return out
}

const key = list => list.map(s => s.pid + ':' + s.id).join('|')

function rescan () {
  timer = null
  const next = read()
  if (key(next) === key(current)) return    // a write that changed nothing
  current = next
  for (const fn of listeners) {
    try { fn(current) } catch {}
  }
}

const soon = () => {
  /* Claude Code writes the file, then the key beside it, and an editor saving
     over one would do worse. One rescan for the burst. */
  clearTimeout(timer)
  timer = setTimeout(rescan, SETTLE)
}

function watch () {
  if (watcher) return
  try {
    watcher = fs.watch(DIR, { persistent: false }, soon)
    watcher.on('error', () => { drop(); later() })
  } catch {
    later()                                  // the directory is not there yet
  }
}

function drop () {
  if (!watcher) return
  try { watcher.close() } catch {}
  watcher = null
}

/* Claude Code has never been run on this machine, or ~/.claude was cleared out
   from under us. Neither is an error to report — it is a directory that will
   probably exist later, so we keep looking, slowly. */
function later () {
  if (retry) return
  retry = setInterval(() => {
    if (!fs.existsSync(DIR)) return
    clearInterval(retry)
    retry = null
    watch()
    rescan()
  }, RETRY)
}

function start (onChange) {
  if (onChange) listeners.push(onChange)
  if (watcher || retry) return list()
  watch()
  rescan()
  return list()
}

const list = () => current.slice()

function stop () {
  drop()
  clearTimeout(timer); timer = null
  if (retry) { clearInterval(retry); retry = null }
  listeners = []
}

module.exports = { start, list, stop, DIR }
