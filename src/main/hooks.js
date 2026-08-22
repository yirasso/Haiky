'use strict'

/* Writing into somebody else's settings file, carefully.

   ~/.claude/settings.json belongs to Claude Code and to the person using it.
   This machine's copy holds an enabledPlugins list, an autoMode allowlist and
   a long environment description somebody wrote by hand — none of which this
   app has any business touching, and all of which would be gone if this took
   the easy road and wrote the file out from a template.

   So four rules, and every one of them is here because the alternative is
   somebody losing work they cannot get back:

   1. **Merge, never replace.** The file is read, one key is changed, and
      everything else is written back exactly as it was found.
   2. **Back up first**, into Haiky's own folder rather than Claude's. A
      backup written into ~/.claude/backups would be Haiky leaving litter in a
      directory another program owns and may prune.
   3. **Write atomically** — temp file, then rename. A settings.json caught
      half-written does not parse, and Claude Code would open tomorrow having
      forgotten the lot.
   4. **Remove exactly what was added.** Ours are recognisable by their url,
      and nothing else in the file is looked at, let alone deleted. An event
      left empty by the removal loses its key; a `hooks` left empty loses its
      key too, so uninstalling gets back to the file that was there before
      rather than to a scattering of empty arrays.

   What goes in is five events. Each one is `type: "http"`, which needs no
   script on disk, and `async: true`, which is the load-bearing half: Claude
   Code dispatches it and carries on, so a mascot that is slow, busy or not
   running cannot cost anybody a millisecond of a turn. */

const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')

const FILE = path.join(os.homedir(), '.claude', 'settings.json')

/* The five, and what each one means to a creature. The matcher on
   Notification is what keeps this down to five requests a turn rather than
   one for every notification Claude Code raises — the filtering happens
   inside Claude Code, before anything is sent. */
const EVENTS = [
  { event: 'UserPromptSubmit', state: 'working' },
  { event: 'Notification', state: 'waiting', matcher: 'permission_prompt' },
  { event: 'Stop', state: 'done' },
  { event: 'StopFailure', state: 'stopped' },
  { event: 'SessionEnd', state: 'end' }
]

const url = (port, state) => 'http://127.0.0.1:' + port + '/haiky/' + state

// ours, and nothing else's. Every removal and every comparison goes through this.
const mine = h =>
  !!h && h.type === 'http' && typeof h.url === 'string' &&
  /^http:\/\/127\.0\.0\.1:\d+\/haiky\//.test(h.url)

function handler (port, token, state) {
  return {
    type: 'http',
    url: url(port, state),
    headers: { 'X-Haiky': token },
    /* Dispatched and forgotten. Without this the creature is a tax on every
       turn, and with it the worst case of this whole feature is a hook that
       goes nowhere. */
    async: true,
    timeout: 5
  }
}

function read () {
  try {
    const d = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    return d && typeof d === 'object' && !Array.isArray(d) ? d : {}
  } catch {
    /* Not there, or not JSON. Returning {} is right for the first case and
       the caller refuses to write in the second — see `install`. */
    return {}
  }
}

const exists = () => fs.existsSync(FILE)

/* Unreadable is not the same as absent, and the difference decides whether it
   is safe to write. A file that exists but will not parse is a file somebody
   is in the middle of editing, or one this build does not understand, and
   merging into {} would silently replace it with a settings file containing
   nothing but our hooks. */
function readable () {
  if (!exists()) return true
  try { JSON.parse(fs.readFileSync(FILE, 'utf8')); return true } catch { return false }
}

function backup (dir) {
  if (!exists()) return ''
  try {
    fs.mkdirSync(dir, { recursive: true })
    const at = new Date().toISOString().replace(/[:.]/g, '-')
    const to = path.join(dir, 'claude-settings-' + at + '.json')
    fs.copyFileSync(FILE, to)
    return to
  } catch {
    return ''
  }
}

function write (doc) {
  const tmp = FILE + '.haiky-tmp'
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(tmp, JSON.stringify(doc, null, 2) + '\n')
  fs.renameSync(tmp, FILE)
}

/* Ours out, everything else left exactly where it was. Returns whether it
   changed anything, so a sync that has nothing to do writes nothing. */
function strip (doc) {
  const hooks = doc.hooks
  if (!hooks || typeof hooks !== 'object') return false
  let dirty = false

  for (const event of Object.keys(hooks)) {
    const groups = hooks[event]
    if (!Array.isArray(groups)) continue

    const kept = []
    for (const g of groups) {
      if (!g || !Array.isArray(g.hooks)) { kept.push(g); continue }
      const left = g.hooks.filter(h => !mine(h))
      if (left.length === g.hooks.length) { kept.push(g); continue }
      dirty = true
      // a group that held nothing but ours goes with them
      if (left.length) kept.push({ ...g, hooks: left })
    }
    if (!dirty) continue
    if (kept.length) hooks[event] = kept
    else delete hooks[event]
  }

  if (dirty && !Object.keys(hooks).length) delete doc.hooks
  return dirty
}

/* What would be written, so that a person can read it before agreeing to it.
   The consent dialog shows this and nothing paraphrased — a summary of a
   settings change is a summary somebody has to trust. */
function preview (port, token) {
  const hooks = {}
  for (const e of EVENTS) {
    const group = { hooks: [handler(port, token, e.state)] }
    if (e.matcher) group.matcher = e.matcher
    hooks[e.event] = [group]
  }
  return { hooks }
}

function install (port, token, backupDir) {
  if (!readable()) return { ok: false, why: 'unreadable' }
  const doc = read()
  strip(doc)                                   // any older port or token of ours

  const saved = backup(backupDir)
  const add = preview(port, token).hooks
  const hooks = doc.hooks && typeof doc.hooks === 'object' ? doc.hooks : {}

  for (const event of Object.keys(add)) {
    const groups = Array.isArray(hooks[event]) ? hooks[event] : []
    hooks[event] = groups.concat(add[event])
  }
  doc.hooks = hooks

  try { write(doc) } catch (err) {
    return { ok: false, why: 'write', detail: String((err && err.message) || err) }
  }
  return { ok: true, backup: saved }
}

function remove (backupDir) {
  if (!readable()) return { ok: false, why: 'unreadable' }
  if (!exists()) return { ok: true, changed: false }
  const doc = read()
  if (!strip(doc)) return { ok: true, changed: false }
  const saved = backup(backupDir)
  try { write(doc) } catch (err) {
    return { ok: false, why: 'write', detail: String((err && err.message) || err) }
  }
  return { ok: true, changed: true, backup: saved }
}

/* Installed, and pointing at this server? The second half is what makes the
   fixed port safe: another program takes 47821 while Haiky is closed, the
   bridge comes up on 47822, and this notices the drift at the next launch
   instead of leaving a creature that never reacts to anything. */
function status (port, token) {
  const doc = read()
  const hooks = doc.hooks
  let found = 0
  let matching = 0
  if (hooks && typeof hooks === 'object') {
    for (const groups of Object.values(hooks)) {
      if (!Array.isArray(groups)) continue
      for (const g of groups) {
        if (!g || !Array.isArray(g.hooks)) continue
        for (const h of g.hooks) {
          if (!mine(h)) continue
          found++
          const want = url(port, (/\/haiky\/([a-z]+)$/.exec(h.url) || [])[1])
          if (h.url === want && h.headers && h.headers['X-Haiky'] === token) matching++
        }
      }
    }
  }
  return {
    installed: found > 0,
    complete: matching === EVENTS.length && found === EVENTS.length,
    found,
    expected: EVENTS.length
  }
}

module.exports = { install, remove, status, preview, FILE, EVENTS }
