'use strict'

/* What it does not need a model to understand.

   FILE.md asks for a creature that is cheap and, more to the point, *fast* —
   "muito rápido com respostas, deverá ter foco em ser responsivo". A round
   trip to Haiku is a second and a half and about a cent of a cent. For "dorme"
   that is a second and a half of a creature standing there awake, which is the
   one thing that makes a mascot feel like software.

   So the short imperatives about its own body are matched here and answered
   before anything leaves the machine. Everything else — every question, every
   remark, everything with a person in it — goes to the model, because that is
   the half a table of regexes is no good at and the half worth paying for.

   Three guards keep this from eating the conversation, and all three exist
   because the failure mode is the same: a router that is too eager turns a
   creature with a personality into a vending machine.

   1. **Short only.** Over sixty characters and it is not a command, it is a
      sentence, whatever verbs are in it.
   2. **Never a question.** "estás a dormir?" is a thing somebody is asking
      you, and answering it by falling asleep is a joke that stops being funny
      the first time it was not meant.
   3. **Anchored.** The pattern has to account for the whole message, not find
      a word inside it. "não durmas" and "dorme" are one character apart in a
      substring search and opposite in meaning.

   What comes back has the same shape as a reply from the model, so nothing
   downstream knows or cares which of the two answered.

   The replies are deliberately thin. An act that is visible needs no caption —
   MASCOT.md says as much — and a canned sentence repeated for the hundredth
   time is worse than silence. Where there is a line at all there are two, and
   they alternate, so it is not the same noise every time. */

const MAX = 60

/* Each entry is anchored at both ends by `wrap` below. The Portuguese is
   European on purpose: "está dormindo" is somebody else's mascot. */
const TABLE = [
  { act: 'sleep', re: '(ir )?dormir|dorme|adormece(r)?|go to sleep|sleep|nap' },
  { act: 'wake', re: 'acorda(r)?|acorde|wake( up)?|get up' },
  { act: 'sit', re: 'senta(r)?(-te)?|sentar|sit( down)?' },
  { act: 'dance', re: 'danca(r)?|dança(r)?|baila(r)?|dance' },
  { act: 'jump', re: 'salta(r)?|pula(r)?|jump|hop' },
  { act: 'happy', re: 'fica (feliz|contente)|se feliz|be happy|cheer up' },
  { act: 'sad', re: 'fica triste|be sad' },
  { act: 'angry', re: 'fica (zangado|furioso)|be angry|get angry' },
  { act: 'calm', re: 'acalma(r)?(-te)?|calma|calm down|relax' },
  { act: 'wink', re: 'pisca(r)?( o olho)?|wink' },
  { act: 'bigger', re: '(fica(r)? |sê |se )?(maior|grande)|cresce(r)?|bigger|grow|larger' },
  { act: 'smaller', re: '(fica(r)? |sê |se )?(mais )?(pequen[oa]|menor)|encolhe(r)?|smaller|shrink' },
  {
    act: 'hide',
    re: '(vai-te )?embora|desaparece|some|esconde(-te)?|sai daqui|go away|hide|leave',
    say: ['Até já.', 'Está bem.']
  }
]

/* A leading "por favor", a trailing "!", a "podes …" — the shapes a spoken
   instruction actually arrives in. Stripped rather than added to every pattern,
   because thirteen patterns each carrying the same optional prefix is thirteen
   places to forget it. */
const TRIM = /^(por favor,?\s+|se faz favor,?\s+|please,?\s+|podes\s+|pode\s+|can you\s+|could you\s+|)/
const TAIL = /[\s!.,]+$/

const wrap = re => new RegExp('^(' + re + ')$', 'i')
const READY = TABLE.map(e => ({ act: e.act, test: wrap(e.re), say: e.say || null }))

// which of the two lines came out last, per act, so a repeat is not a parrot
const turn = new Map()

function pick (lines, act) {
  if (!lines || !lines.length) return ''
  const i = ((turn.get(act) || 0) + 1) % lines.length
  turn.set(act, i)
  return lines[i]
}

/* Returns a reply in the model's own shape, or null to mean "this one is not
   mine". Null is the common answer and must stay that way: the moment this
   starts guessing at anything with a person in it, the creature stops being
   somebody. */
function match (text) {
  const raw = String(text || '').trim()
  if (!raw || raw.length > MAX) return null
  if (raw.includes('?')) return null

  const said = raw.replace(TAIL, '').replace(TRIM, '').trim()
  if (!said) return null

  for (const e of READY) {
    if (!e.test.test(said)) continue
    return { ok: true, say: pick(e.say, e.act), act: e.act, byScript: true }
  }
  return null
}

module.exports = { match, MAX }
