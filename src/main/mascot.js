'use strict'

/* The creature, when it speaks.

   Ported from the voice of the app the creature came from. Three things
   changed and the rest is that file: the ledger points at its own document
   instead of being folded into the creature's, `situation()` describes a
   taskbar rather than an app window, and the act list is this app's.

   Everything about *how* it speaks lives in MASCOT.md at the repo root, and
   that file is not documentation about the prompt — it is the prompt. This
   reads it whole and hands it over as the system prompt, so changing the
   creature's character is editing a markdown file and nothing else.

   Two decisions are load-bearing and both came across unchanged.

   **The preset goes.** A plain string in `systemPrompt` replaces the
   claude_code preset outright, which is what turns this from a coding
   assistant wearing a costume into an ordinary chat that happens to be a small
   creature. It is also why MASCOT.md has to say everything: there is no preset
   underneath it catching what it forgot.

   **Always haiku.** The creature says one sentence and should cost
   accordingly. A mascot that got slower and more expensive because you
   switched a session to Opus would be a tax on a decoration.

   The acts are a closed enum in the schema rather than tools, and that is
   deliberate: they all happen in the renderer, and a structured field the page
   switches on cannot do anything the page cannot already do. An MCP server
   here would be a permission surface bought for nothing.

   No project root, no settings, no tools, one turn — a pass with a root under
   it is a pass that could go reading rather than answering, and MASCOT.md
   promises it cannot read anything. The promise is kept here, by not handing
   over the means, rather than by asking it nicely. */

const path = require('node:path')
const fs = require('node:fs')
const { app } = require('electron')
const { query, SYSTEM_PROMPT_DYNAMIC_BOUNDARY } = require('@anthropic-ai/claude-agent-sdk')
const store = require('./store')

const EXE = process.platform === 'win32' ? 'claude.exe' : 'claude'

function executable () {
  if (app.isPackaged) {
    const packed = path.join(process.resourcesPath, 'claude', EXE)
    if (fs.existsSync(packed)) return packed
  }
  try {
    const p = require.resolve('@anthropic-ai/claude-agent-sdk-' + process.platform + '-' + process.arch + '/' + EXE)
    if (fs.existsSync(p)) return p
  } catch {
    // fall through — the SDK finds its own copy or says so
  }
  return undefined
}

/* Whether there is anything to talk to at all. The renderer hides the right
   button on a false, so nothing opens a box that would then have to admit it
   could do nothing. */
const ready = () => !!executable() && !!character()

/* Read once and keep it. In a packaged build the file is inside app.asar,
   which fs reads through happily; in development it is the file on disk and
   restarting is how you pick up an edit — same as any other source file. */
let CHARACTER = null
function character () {
  if (CHARACTER !== null) return CHARACTER
  try {
    CHARACTER = fs.readFileSync(path.join(app.getAppPath(), 'MASCOT.md'), 'utf8')
  } catch {
    /* Without the file there is no creature to be, and a fallback personality
       invented here would be a second character nobody wrote down. Better to
       be plainly broken than quietly someone else. */
    CHARACTER = ''
  }
  return CHARACTER
}

/* The acts, and the half of them that are the creature itself. Being able to
   change its own body is what makes a mood answerable: told to wake up it can
   decide to wake up, or decide not to and say so, and either way what it
   decided is what you then see. A mascot that says "estou acordado" while
   still visibly asleep is a mascot lying to you in two channels at once.

   This list, the ACT table in the renderer and the table in MASCOT.md are
   three copies of one fact and all three must agree. The schema validates
   against this one, the renderer performs from its own, and the creature only
   knows the acts exist because the markdown told it. */
const ACTS = [
  'none',
  'sleep', 'sit', 'dance', 'angry', 'sad', 'happy', 'wake', 'calm', 'wink', 'confused',
  'jump', 'bigger', 'smaller', 'hide'
]

/* `drop` is its own field and not an act, and that is a bug fix rather than a
   preference. Forgetting used to be `act: 'forget'` — one signal with no target
   — so "forget that I have a cat" and "forget everything" arrived identical and
   both wiped the lot, name included. A vague instruction must never be read as
   the most destructive thing it could mean. */
const REPLY = {
  type: 'object',
  properties: {
    say: { type: 'string', description: 'What the creature says. One sentence, two at the very outside. No markdown.' },
    act: { type: 'string', enum: ACTS, description: 'One act to perform, or none.' },
    name: { type: 'string', description: 'A name it has just been given, or empty.' },
    remember: { type: 'string', description: 'One short fact worth keeping forever, or empty. Usually empty.' },
    drop: { type: 'string', description: 'To forget ONE thing, the number of that memory from the numbered list, e.g. "2". To forget absolutely everything including your own name, the word "all" — only when that is plainly what was asked. Otherwise empty.' }
  },
  required: ['say', 'act', 'name', 'remember', 'drop'],
  additionalProperties: false
}

const MEMORIES = 24        // what it can carry; the oldest falls off the end

const ZERO = { calls: 0, in: 0, out: 0, cost: 0 }

const who = () => {
  const d = store.load('mascot')
  return { name: d.name || '', memory: Array.isArray(d.memory) ? d.memory : [] }
}

/* Two documents rather than one, and the split is not tidiness: what the
   creature *is* and what it has *cost you* answer to different owners.
   Forgetting is about the person; clearing the bill on the creature's say-so
   would be the app losing your money's paper trail because you asked it to
   lose a memory. */
const bill = () => {
  const d = store.load('usage')
  return { ...ZERO, ...d, week: { resets: '', ...ZERO, ...(d.week || {}) } }
}

/* The plan's own clock, not a calendar of ours: when the reset stamp the
   account reports changes, the window has rolled and the week goes back to
   nothing.

   Nothing calls this yet. The host this was ported from had a plan document
   to read the stamp out of; Haiky spawns the binary itself and has no such
   document, so `week` below accumulates and never rolls. Kept rather than
   deleted because dropping the field means a version bump, and a version bump
   takes the lifetime total with it. See "Known limits" in README.md. */
function rollWeek (resets) {
  const key = String(resets || '')
  if (!key) return
  const b = bill()
  if (b.week.resets === key) return
  store.save('usage', { ...b, week: { resets: key, ...ZERO } })
}

function state () {
  const k = who()
  const b = bill()
  return { name: k.name, memories: k.memory.length, spent: b, week: b.week, ready: ready() }
}

/* Forgetting from outside the conversation — a tray item, or anything else
   that wants to clear the person without asking the creature to. The live path
   is not this one: `drop: "all"` in a reply is handled inline in talk(), where
   the numbered single drop is handled too, so that both readings of "forget"
   are decided in one place against one list. Nothing calls this yet. */
function forget () {
  store.save('mascot', { name: '', memory: [] })
  return state()
}

/* The bill is written the moment it is known, and before anything can go wrong
   with the reply: what a call cost you is not conditional on its answer having
   been usable. */
function keep (add) {
  const b = bill()
  const sum = (a, c) => ({ calls: a.calls + c.calls, in: a.in + c.in, out: a.out + c.out, cost: a.cost + c.cost })
  const next = sum(b, add)
  store.save('usage', { ...next, week: { resets: b.week.resets, ...sum(b.week, add) } })
}

/* What the creature is told about right now. Deliberately thin, and the list
   is the whole of it: the mood, where it is standing, and what Claude Code is
   doing — no transcript, no files, no code, no window titles. MASCOT.md
   promises it cannot see those, and the promise is kept here by not sending
   them rather than by asking it nicely.

   The folder name is the one borderline entry and it earns its place: it is
   how a creature that lives beside your work can tell Tuesday from Wednesday,
   and a basename is not a path. */
function situation (ctx) {
  const bits = []
  if (ctx.mood) bits.push('Your mood right now: ' + ctx.mood + '.')

  const live = Array.isArray(ctx.sessions) ? ctx.sessions : []
  if (!live.length) {
    bits.push('Claude Code is not open.')
  } else if (live.length === 1) {
    bits.push('Claude Code is open, working in a folder called ' + (live[0] || 'something') + '.')
  } else {
    bits.push('There are ' + live.length + ' Claude Code sessions open: ' + live.join(', ') + '.')
  }

  const run = {
    working: 'A turn is running right now.',
    waiting: 'It has stopped to ask him something and is waiting.',
    done: 'A turn has just finished.',
    stopped: 'A turn just failed.'
  }[ctx.run]
  if (run) bits.push(run)
  else if (live.length) bits.push('Nothing is running at the moment.')

  if (ctx.where) bits.push('You are standing at the ' + ctx.where + ' of the taskbar.')
  return bits.join(' ')
}

async function talk (ctx) {
  const said = String((ctx && ctx.text) || '').trim().slice(0, 2000)
  if (!said) return { ok: false, why: 'empty' }

  const doc = character()
  if (!doc) return { ok: false, why: 'no-character' }

  /* ── why this is two blocks and not one string ──
     Measured, and not guessed, because the obvious move was wrong. A message
     costs about 5,700 input tokens; MASCOT.md is about 2,100 of them and the
     other 3,600 are the harness, which is a floor. So shortening the character
     file was always going to be a third of the problem at best — and when it
     was tried, replacing the whole file with one line, the token count fell to
     3,617 and the cost went **up**, $0.0158 to $0.0192.

     That is prompt caching, and it says the opposite of what you would guess:
     the file is not expensive *because* it is long, it is cheap because it is
     long and never changes. What costs money is a system prompt that varies.

     So the split is the fix rather than the scissors. Everything before the
     boundary is eligible for caching across sessions; everything after is not.
     The character goes in front because it is the same bytes every time, and
     the name and the memories go behind because they are exactly the part that
     changes — which is also why they must never be folded into the doc to
     "keep it in one place". */
  const kept = who()
  const system = [
    doc,
    SYSTEM_PROMPT_DYNAMIC_BOUNDARY,
    [
      kept.name
        ? 'You have been given a name and it is ' + kept.name + '.'
        : 'You have not been given a name yet.',
      '',
      // numbered, because the numbers are how it names one to forget
      kept.memory.length
        ? 'What you remember, oldest first:\n' + kept.memory.map((m, i) => (i + 1) + '. ' + m).join('\n')
        : 'You remember nothing yet.'
    ].join('\n')
  ]

  const prompt = [
    situation(ctx || {}),
    '',
    '--- what was said to you ---',
    said
  ].join('\n')

  const env = { ...process.env, CLAUDE_AGENT_SDK_CLIENT_APP: 'haiky/' + app.getVersion() }

  const q = query({
    prompt,
    options: {
      cwd: app.getPath('userData'),
      env,
      pathToClaudeCodeExecutable: executable(),
      settingSources: [],
      strictMcpConfig: true,
      tools: [],
      permissionMode: 'plan',
      /* an array and not a string, so the preset is still replaced outright but
         the character file sits in a cacheable prefix — see the note above */
      systemPrompt: system,
      model: 'haiku',
      maxTurns: 1,
      outputFormat: { type: 'json_schema', schema: REPLY }
    }
  })

  let out = null
  const add = { calls: 0, in: 0, out: 0, cost: 0 }
  try {
    for await (const m of q) {
      if (m.type !== 'result') continue
      /* Taken off every result and not only the successful ones: a turn that
         failed after the model answered still cost what it cost, and a meter
         that only counts the wins is a meter that flatters itself. */
      for (const u of Object.values(m.modelUsage || {})) {
        add.in += (u.inputTokens || 0) + (u.cacheReadInputTokens || 0) + (u.cacheCreationInputTokens || 0)
        add.out += u.outputTokens || 0
      }
      add.cost += Number(m.total_cost_usd || 0)
      add.calls += 1
      if (m.subtype === 'success' && m.structured_output) out = m.structured_output
    }
  } catch (err) {
    if (add.calls) keep(add)
    return { ok: false, why: 'failed', detail: String((err && err.message) || err) }
  }
  if (add.calls) keep(add)
  if (!out) return { ok: false, why: 'failed' }

  const say = String(out.say || '').trim()
  const act = ACTS.includes(out.act) ? out.act : 'none'
  const name = String(out.name || '').trim().slice(0, 40)
  const note = String(out.remember || '').trim().slice(0, 240)
  const drop = String(out.drop || '').trim().toLowerCase()

  // the record only changes when something in it actually did
  let dirty = false
  const next = { name: kept.name, memory: kept.memory.slice() }

  /* Forgetting, and the two readings kept apart. `all` is the whole person and
     has to have been asked for in those terms; a number is one line out of the
     list it was shown. Anything else — a name, a phrase, a number that is not
     on the list, an empty string — drops nothing, because the failure this
     replaces was a vague instruction taken as the most destructive one. */
  if (drop === 'all') {
    if (next.name || next.memory.length) { next.name = ''; next.memory = []; dirty = true }
  } else if (drop) {
    const i = Number.parseInt(drop, 10)
    if (Number.isInteger(i) && i >= 1 && i <= next.memory.length) {
      next.memory.splice(i - 1, 1)
      dirty = true
    }
  }

  if (name && name !== kept.name) { next.name = name; dirty = true }
  if (note && !next.memory.includes(note)) {
    next.memory.push(note)
    while (next.memory.length > MEMORIES) next.memory.shift()
    dirty = true
  }
  if (dirty) store.save('mascot', next)

  return { ok: true, say, act, name: next.name }
}

module.exports = { talk, state, forget, rollWeek, ready, ACTS }
