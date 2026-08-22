/* Somebody in there.

   Ported from vendor/removed-snapshot/renderer/mascot.js, which was itself
   lifted whole out of Origin. The engine below IS that file: the geometry,
   the poses, the gaze, the gait, the sleep and the blink are unchanged,
   because they were right and because the snapshot's README names exactly
   which of them were arrived at by doing the other thing first.

   What changed is only where it lives, and it changed in five places. In
   Origin the creature stood in a window and learnt everything by reading
   the app's own DOM: the caret out of the composer's text mirror, the
   streaming answer out of #rows, the perches off .rail and .topbar, and the
   acts by pressing the app's own buttons. There is no app here. It stands on
   the Windows taskbar, it is told what Claude Code is doing by a hook, and
   its perches are fractions of the bar it is standing on. Each of the five
   is commented where it happens; nothing else was touched.

   The one that is worth knowing about before you read any of it: the run
   state still arrives as `body.dataset.run`, because the preload writes it
   there. So the MutationObserver, the flash on done, the worry on stopped
   and every pose hanging off them are untouched code. The creature cannot
   tell that the fact now comes over IPC from a hook rather than from a
   composer next door, and that is the point.

   This is that, and it says nothing. The silence is the whole of the first
   version and it is deliberate: a mascot that offers advice is a mascot that
   interrupts, and Clippy did not fail for being ugly. Expression first. A
   voice only once the expression is worth trusting.

   Five things below were learnt the expensive way by jeremy-prt/bloub (MIT),
   whose architecture notes are the blueprint for this file. Each is a bug you
   would otherwise ship:

   1. Every pose is sampled at the SAME angles, so a morph between any two is
      a linear interpolation of points. No path-morphing library, and two
      shapes drawn a year apart stay compatible by construction.
   2. Gaze mixes in ABSOLUTELY on both axes. Nudging the eyes relative to the
      pose makes them sink every time the expression changes underneath them.
   3. The wander is applied AFTER the gaze, never before, or a creature told
      where to look keeps sliding off the thing it was told to look at.
   4. A state that changes mid-fade blends from the frame ON SCREEN, not from
      the pose we were nominally in. Otherwise it jumps.
   5. Blink is a closed form of the clock rather than an accumulator, so it
      can be asked about any moment at any time, never drifts, and has no
      schedule to keep in step.

   Eyes are shapes over the body, clipped to it, so an eye that slides past
   the edge as the creature turns away is trimmed rather than left hanging
   outside the silhouette and nobody has to work out where that edge is.

   And it walks. It lives in a layer over the whole strip and moves about it
   by perching, and which perch depends on what Claude Code is doing — which
   is the whole of why this reads as somebody rather than as a screensaver.

   The engine contract's important half is that this file never asks whether
   it ought to be running. It measures its own svg at the top of every frame
   and returns without booking another one when there is nothing to draw into
   — so hiding the creature in CSS *is* switching the engine off. */

(function () {
  'use strict'

  const svg = document.querySelector('.mas')
  if (!svg) return

  const gBody = svg.querySelector('.mas-b')
  const body = svg.querySelector('.mas-body')
  const clip = svg.querySelector('.mas-clip-p')
  const eyeL = svg.querySelector('.mas-eye-l')
  const eyeR = svg.querySelector('.mas-eye-r')
  const halo = svg.querySelector('.mas-halo')
  const dots = svg.querySelectorAll('.mas-dot')
  const huh = svg.querySelector('.mas-huh')
  if (!gBody || !body || !eyeL || !eyeR) return

  /* The silhouette goes to two places and they must never disagree: the shape
     that is drawn, and the shape the eyes are clipped to. One call, so a
     fourth caller cannot add itself to only one of them. */
  const shape = d => { body.setAttribute('d', d); if (clip) clip.setAttribute('d', d) }

  // what it says, and where you say something back
  const sayEl = document.querySelector('.mas-say')
  const askEl = document.querySelector('.mas-ask')
  const askIn = askEl && askEl.querySelector('input')

  const root = document.documentElement

  /* ── CHANGE 1 OF 5: what main tells it ──
     Two facts arrive from outside the page and neither is polled for: the
     strip it is standing in, and the preferences. The third — what Claude
     Code is doing — is written straight onto `body.dataset.run` by the
     preload, which is why nothing below had to learn a new way to ask.

     `api` is guarded at every use rather than assumed. This file is opened
     in a plain browser now and then to look at the shape, and a creature
     that throws on load is a creature you cannot look at. */
  let place = null                            // the strip, and the bar inside it
  const api = window.haiky || {}

  if (api.onPlace) api.onPlace(p => { place = p; wake() })

  /* The folder names of whatever Claude Code has open, and nothing else off
     that record — not the pid, not the path, not the session id. It is the
     one thing the creature is told about your work, and a basename is how
     something living beside it can tell Tuesday from Wednesday. */
  let sessions = []
  if (api.onSessions) {
    api.onSessions(list => {
      sessions = (list || []).map(s => s.where).filter(Boolean)
      readAuth()
    })
  }

  if (api.settings) {
    const applyPrefs = p => {
      if (!p) return
      /* 60px is the size every fraction in this file was measured against,
         so scale multiplies it rather than replacing it. */
      root.style.setProperty('--mas-size', Math.round(60 * (Number(p.scale) || 1)) + 'px')
      wake()
    }
    api.settings.get().then(applyPrefs).catch(() => {})
    api.settings.onChange(applyPrefs)
  }

  /* Every rate in this file is written in seconds against this one number, so
     slowing the creature down is one edit and the ratios between a dozen
     literals survive it. Same lever as RATE in field.js, and for the same
     reason. */
  const RATE = 1

  const N = 64                  // samples per outline; the other tuning knob
  const TAU = Math.PI * 2
  const CX = 50, CY = 54, R = 32

  /* ── the poses ──
     Nine numbers each, and a table of points built from them once at load. The
     points are what gets interpolated; these numbers are only how the points
     were arrived at and nothing reads them per frame — except `open` and
     `tilt`, which belong to the eyes and are blended as numbers because the
     eyes are two ellipses rather than a path.

     This was a circle for a while, and the reason is worth writing down: the
     profile had exactly two knobs, how much the crown swelled and how much the
     base narrowed, and a radial profile with only those two can make eggs and
     nothing else. Three knobs turned it into somebody.

     `nTop` and `nBot` are superellipse exponents, one per half — 2 is a plain
     ellipse and anything above squares that half off, so the creature can have
     a round head and *sit* on a flat base rather than float on a curve.
     `tuft` raises a narrow crest at the crown, and a crest is the whole of
     what gives a blob a top and therefore a front. `lean` shears the body
     against its own height about the base it sits on, so it can crane forward,
     hunch over its work, or slump.

     All of it is still sampled at the same angles, so all of it is still one
     linear interpolation of points between any two poses. */
  /* The eyes carry four of these and they are worth naming, because between
     them they are every face the creature has. `open` squashes the eye
     vertically and `wide` stretches it sideways; `bow` lifts its middle on a
     parabola with the corners pinned, which is what *bends* a lens into an
     arch rather than just moving it; `tilt` leans the whole thing.

     Unbowed and fully open it is a circle — the resting eye, and round on
     purpose. Squashed thin and bowed hard it is the ⌒ of a grin. Bowed the
     other way it is a scowl. One number takes you between them, which is why
     none of this needed a second eye shape or a sprite sheet. */
  const POSE = {
    //          w     h    nTop nBot  tuft  tuftW  lean   sink   open  wide   bow   tilt
    sleep:    { w: 1.22, h: 0.70, nTop: 2.6, nBot: 4.4, tuft: 0.09, tuftW: 0.52, lean: -0.26, sink: 0.15, open: 0.06, wide: 1.10, bow: 0.50, tilt: 2 },
    idle:     { w: 1.00, h: 1.00, nTop: 2.0, nBot: 3.0, tuft: 0.26, tuftW: 0.38, lean: 0.05, sink: 0.02, open: 1.00, wide: 1.00, bow: 0.00, tilt: 10 },
    watch:    { w: 0.94, h: 1.08, nTop: 1.9, nBot: 3.3, tuft: 0.30, tuftW: 0.28, lean: 0.16, sink: -0.02, open: 1.16, wide: 1.02, bow: 0.00, tilt: 8 },
    // eyes narrowed to a considering squint, and three dots over its head
    think:    { w: 1.06, h: 0.95, nTop: 2.3, nBot: 3.5, tuft: 0.17, tuftW: 0.42, lean: -0.15, sink: 0.03, open: 0.40, wide: 1.08, bow: -0.16, tilt: 13 },
    ask:      { w: 0.92, h: 1.12, nTop: 1.8, nBot: 2.8, tuft: 0.36, tuftW: 0.24, lean: 0.03, sink: -0.04, open: 1.26, wide: 1.06, bow: 0.00, tilt: 4 },
    // bright yellow, and the eyes are two arches — see the colour in styles.css
    happy:    { w: 1.14, h: 0.91, nTop: 1.9, nBot: 3.8, tuft: 0.32, tuftW: 0.26, lean: 0.09, sink: -0.03, open: 0.24, wide: 1.10, bow: 0.98, tilt: 0 },
    worry:    { w: 0.89, h: 1.06, nTop: 2.5, nBot: 2.5, tuft: 0.13, tuftW: 0.46, lean: -0.19, sink: 0.04, open: 0.92, wide: 0.98, bow: -0.28, tilt: -12 },
    // dangling from your pointer: narrow, stretched, and wide awake about it
    held:     { w: 0.86, h: 1.16, nTop: 1.8, nBot: 2.3, tuft: 0.34, tuftW: 0.25, lean: 0.00, sink: -0.02, open: 1.30, wide: 1.04, bow: 0.00, tilt: 2 },
    sit:      { w: 1.16, h: 0.84, nTop: 2.2, nBot: 4.0, tuft: 0.16, tuftW: 0.42, lean: -0.08, sink: 0.09, open: 0.80, wide: 1.00, bow: 0.12, tilt: 10 },
    dance:    { w: 1.06, h: 0.99, nTop: 1.9, nBot: 3.1, tuft: 0.32, tuftW: 0.27, lean: 0.11, sink: -0.03, open: 0.32, wide: 1.08, bow: 0.88, tilt: 0 },
    // the scowl is the bow inverted; the tilt only finishes what it started
    angry:    { w: 1.10, h: 0.93, nTop: 2.9, nBot: 3.1, tuft: 0.42, tuftW: 0.17, lean: 0.24, sink: 0.02, open: 0.44, wide: 1.00, bow: -0.62, tilt: -24 },
    /* Dark blue, hunched, and the eyes of a cat that has been left outside:
       big, round and wider apart than any other pose. It looks at the floor,
       and every few seconds it looks up at you — see the gaze in draw(). */
    sad:      { w: 0.93, h: 1.03, nTop: 2.2, nBot: 3.2, tuft: 0.11, tuftW: 0.50, lean: -0.22, sink: 0.06, open: 1.34, wide: 1.16, bow: 0.05, tilt: 5 },
    confused: { w: 1.00, h: 1.02, nTop: 2.1, nBot: 3.0, tuft: 0.30, tuftW: 0.30, lean: -0.09, sink: 0.01, open: 1.08, wide: 1.00, bow: -0.08, tilt: 15 },
    /* Falling. Narrow and drawn out, with the crest streaming and the eyes
       as round and open as they ever get — this is the only pose that is
       not a mood, and the shape carries only half of it: the rest is the
       stretch that scales with how fast it is going, in draw(). Nothing
       here is squashed, because the squash belongs to the landing and
       lasts a third of a second. */
    fall:     { w: 0.86, h: 1.12, nTop: 1.8, nBot: 2.2, tuft: 0.30, tuftW: 0.30, lean: 0.00, sink: -0.04, open: 1.34, wide: 1.02, bow: 0.00, tilt: 0 },
    /* A turn in Claude Code has just finished, and this is how you are
       told. Upright, crest raised, eyes wide and a slight arch to them —
       pleased rather than alarmed, because the news is usually good. The
       colour is in the stylesheet and the hop is in readRun(): three
       channels for one fact, because the whole job of this pose is to be
       noticed on a taskbar you are not looking at. */
    alert:    { w: 0.95, h: 1.06, nTop: 1.9, nBot: 3.0, tuft: 0.38, tuftW: 0.24, lean: 0.02, sink: -0.04, open: 1.22, wide: 1.06, bow: 0.30, tilt: 3 }
  }

  function outline (p) {
    const pt = new Float32Array(N * 2)
    const base = p.h * R                         // where it meets the ground
    for (let i = 0; i < N; i++) {
      const th = (i / N) * TAU                   // 0 at the crown, going clockwise
      const a = th - Math.PI / 2
      const c = Math.cos(a), s = Math.sin(a)     // screen y is down, so +s is the base
      // one superellipse per half: round above, squared off below, so it sits
      const k = 2 / (s < 0 ? p.nTop : p.nBot)
      const x = Math.sign(c) * Math.pow(Math.abs(c), k) * p.w * R
      let y = Math.sign(s) * Math.pow(Math.abs(s), k) * base
      // the crest — a narrow rise at the crown and nowhere else on the outline
      const off = Math.min(th, TAU - th)
      y -= p.tuft * R * Math.exp(-(off * off) / (2 * p.tuftW * p.tuftW))
      // sheared about the base rather than the centre, so leaning keeps its feet
      pt[i * 2] = x - (y - base) * p.lean * 0.5
      pt[i * 2 + 1] = y + p.sink * R
    }
    return pt
  }

  /* One closed loop per eye, sampled at fixed angles like the body, so any two
     expressions interpolate into each other without anybody drawing a second
     eye.

     The bow is the whole trick and it is one line: lift every point by
     `bow * rx * sin²`, which is zero at the left and right corners and full at
     the top and bottom edges. The corners stay pinned and the middle rises, so
     the lens *bends* instead of moving — lift it by a constant and you have
     just slid the eye up its own socket. */
  const EYE_N = 22
  const EYE_X = 13.8, EYE_Y = -3.2, EYE_R = 7.0

  function eyePath (cx, cy, rx, ry, bow, tilt) {
    const rad = tilt * Math.PI / 180
    const cr = Math.cos(rad), sr = Math.sin(rad)
    const p = new Float32Array(EYE_N * 2)
    for (let i = 0; i < EYE_N; i++) {
      const a = (i / EYE_N) * TAU
      const c = Math.cos(a), s = Math.sin(a)
      const x = c * rx
      const y = s * ry - bow * rx * s * s
      p[i * 2] = cx + x * cr - y * sr
      p[i * 2 + 1] = cy + x * sr + y * cr
    }
    let d = 'M' + p[0].toFixed(2) + ' ' + p[1].toFixed(2)
    for (let i = 0; i < EYE_N; i++) {
      const a = ((i - 1) + EYE_N) % EYE_N, b = i, n = (i + 1) % EYE_N, e = (i + 2) % EYE_N
      d += 'C' + (p[b * 2] + (p[n * 2] - p[a * 2]) / 6).toFixed(2) + ' ' + (p[b * 2 + 1] + (p[n * 2 + 1] - p[a * 2 + 1]) / 6).toFixed(2) +
           ' ' + (p[n * 2] - (p[e * 2] - p[b * 2]) / 6).toFixed(2) + ' ' + (p[n * 2 + 1] - (p[e * 2 + 1] - p[b * 2 + 1]) / 6).toFixed(2) +
           ' ' + p[n * 2].toFixed(2) + ' ' + p[n * 2 + 1].toFixed(2)
    }
    return d + 'Z'
  }

  const SHAPE = {}
  for (const k in POSE) SHAPE[k] = outline(POSE[k])

  /* Catmull-Rom through every sample, written out as cubics. A polyline
     facets visibly on a silhouette this size, and a spline costs one subtract
     per control point — which is cheaper than the argument about whether you
     can see it. */
  function pathOf (pt) {
    let d = 'M' + (CX + pt[0]).toFixed(2) + ' ' + (CY + pt[1]).toFixed(2)
    for (let i = 0; i < N; i++) {
      const a = ((i - 1) + N) % N, b = i, c = (i + 1) % N, e = (i + 2) % N
      const x0 = pt[a * 2], y0 = pt[a * 2 + 1]
      const x1 = pt[b * 2], y1 = pt[b * 2 + 1]
      const x2 = pt[c * 2], y2 = pt[c * 2 + 1]
      const x3 = pt[e * 2], y3 = pt[e * 2 + 1]
      d += 'C' + (CX + x1 + (x2 - x0) / 6).toFixed(2) + ' ' + (CY + y1 + (y2 - y0) / 6).toFixed(2) +
           ' ' + (CX + x2 - (x3 - x1) / 6).toFixed(2) + ' ' + (CY + y2 - (y3 - y1) / 6).toFixed(2) +
           ' ' + (CX + x2).toFixed(2) + ' ' + (CY + y2).toFixed(2)
    }
    return d + 'Z'
  }

  /* ── what is on screen ──
     `cur` is the composite actually drawn, kept because lesson 4 needs it:
     when the state changes mid-fade we blend from here and not from `to`. */
  const cur = new Float32Array(SHAPE.idle)
  let from = Float32Array.from(SHAPE.idle)
  let to = SHAPE.idle
  let fromP = POSE.idle, toP = POSE.idle
  let mix = 1, poseName = 'idle', drawn = ''

  const lerp = (a, b, u) => a + (b - a) * u
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v
  const easeOut = u => 1 - Math.pow(1 - u, 4)

  /* ── the clock the creature keeps ──
     Reduced motion is two switches and the app means both: the OS asking for
     less, and the setting in Appearance. Neither is authoritative on its own,
     so the predicate reads both — the same shape as the foot of breath.js. */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  const still = () => reduce.matches || root.dataset.motion === 'off'

  const MORPH = 0.42                        // seconds for one pose to become another
  const BLINK_P = 4.4                       // average seconds between blinks
  const BLINK_D = 0.15                      // and how long one takes
  const DROWSE = 30, SLEEP = 150            // heavy-lidded from here, gone by there

  let raf = 0, t0 = 0, clock = 0, poke = 0
  let yaw = 0, pitch = 0, asleep = false, wakeStretch = 0
  // the four eye numbers as they are right now, blended like the outline is
  const eyeNow = { open: POSE.idle.open, wide: POSE.idle.wide, bow: POSE.idle.bow, tilt: POSE.idle.tilt }

  function wake () { if (!raf && !document.hidden) raf = requestAnimationFrame(draw) }

  function setPose (name) {
    if (name === poseName || !SHAPE[name]) return
    from = Float32Array.from(cur)
    fromP = { open: eyeNow.open, wide: eyeNow.wide, bow: eyeNow.bow, tilt: eyeNow.tilt }
    to = SHAPE[name]
    toP = POSE[name]
    mix = still() ? 1 : 0
    poseName = name
    if (mix === 1) {
      cur.set(to)
      eyeNow.open = toP.open; eyeNow.wide = toP.wide
      eyeNow.bow = toP.bow; eyeNow.tilt = toP.tilt
      const d = pathOf(cur)
      if (d !== drawn) shape(drawn = d)
    }
  }

  const frac = x => x - Math.floor(x)
  const jitter = k => frac(Math.sin(k * 127.1) * 43758.5453)
  const blinkAt = k => k * BLINK_P + (jitter(k) - 0.5) * BLINK_P * 0.72

  /* Lesson 5. Ask the schedule about now rather than remembering where it got
     to: the three blinks either side of `t / BLINK_P` are the only ones that
     can be open, so the answer is three subtractions and no state at all. */
  function lidAt (t) {
    const k = Math.round(t / BLINK_P)
    let lid = 1
    for (let i = k - 1; i <= k + 1; i++) {
      const d = t - blinkAt(i)
      if (d < 0 || d > BLINK_D) continue
      lid = Math.min(lid, Math.abs((d / BLINK_D) * 2 - 1))
    }
    return lid
  }

  /* A wink is one eye, and unlike the blink it is an *act* — it happens because
     it was asked for, so it has a start rather than a schedule. Down fast, a
     beat held shut, back up slower. */
  const WINK = 0.46
  let winkAt = -1e3
  function winkNow () {
    const d = clock - winkAt
    if (d < 0 || d > WINK) return 1
    const u = d / WINK
    return u < 0.24 ? 1 - u / 0.24 : u < 0.58 ? 0 : (u - 0.58) / 0.42
  }

  /* ── what floats over its head ──
     Three dots while it is thinking, rising and fading in turn, and a question
     mark when it has been asked for something it has no idea about. Both are
     geometry — circles and one stroked curve — and neither is a character: a
     glyph would be the app's type stack having an opinion about the creature's
     face, and would change under it the day somebody swapped the font. */
  const DOT_GAP = 8.6, DOT_Y = 8
  const HUH = 3.0                                // seconds the question mark lives
  let huhAt = -1e3

  function overhead (quiet) {
    const thinking = poseName === 'think'
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i]
      if (!thinking) { d.setAttribute('opacity', '0'); continue }
      // one wave through three dots, each a fifth of a cycle behind the last
      const u = quiet ? 0.45 : (((clock / 1.45) + i * 0.2) % 1)
      const lift = Math.sin(Math.min(1, u * 1.7) * Math.PI)
      d.setAttribute('cx', (CX + (i - 1) * DOT_GAP).toFixed(1))
      d.setAttribute('cy', (DOT_Y - lift * 3.6).toFixed(1))
      d.setAttribute('opacity', (0.22 + lift * 0.78).toFixed(2))
    }
    if (!huh) return
    const d = clock - huhAt
    if (d < 0 || d > HUH) { huh.setAttribute('opacity', '0'); return }
    /* In quickly, then up and away — the fade is squared so it thins out at
       the end rather than switching off, which is the difference between
       evaporating and being deleted. */
    const u = d / HUH
    const a = u < 0.16 ? u / 0.16 : 1 - Math.pow((u - 0.16) / 0.84, 2)
    const s = 0.62 + 0.5 * Math.min(1, u * 5) + u * 0.3
    huh.setAttribute('opacity', Math.max(0, a).toFixed(3))
    huh.setAttribute('transform',
      'translate(' + (CX + 16) + ' ' + (19 - u * 13).toFixed(1) + ') scale(' + s.toFixed(3) + ')')
  }

  /* ── CHANGE 2 OF 5: where it is looking ──
     There were two targets here and both were the host's: the caret, read
     out of the composer's own text mirror with a Range, and the last row the
     agent had written, so that the creature watched the answer arrive.

     Neither exists on a taskbar and neither gets a stand-in. A desktop
     overlay cannot see inside another application's window, and guessing at
     where Claude Code might have put its caret would be the creature
     performing an attention it does not have — which is the same promise
     MASCOT.md makes in words and this keeps in code.

     So it looks at two things it can honestly see. The pointer, which it
     could always see. And, while a turn is running, up — at the screen the
     work is happening on, which is a real direction from something standing
     on the bar at the bottom of it. The slow drift is what makes that read as
     watching rather than as staring at a fixed point. */
  function workPoint () {
    if (!place) return null
    const u = 0.5 + 0.32 * Math.sin(clock * 0.21)
    return {
      x: place.left + (place.right - place.left) * u,
      y: place.ceiling + (place.floor - place.ceiling) * 0.3
    }
  }

  // close enough that the mouse is plainly coming for it, rather than passing
  const NEAR = 240

  let ptr = null, ptrAt = -1e3
  // where the creature was actually painted this frame, for the hit test
  let drawX = -1e3, drawY = -1e3

  /* ── the state of the world, read off the body ──
     Nothing here imports anything. The app declares what it is doing in
     attributes on <body> and this watches them, which means the creature has
     no edge into the module graph and cannot be part of a cycle. */
  const runNow = () => document.body.dataset.run || ''

  let flash = '', flashUntil = -1, wasRun = ''
  function readRun () {
    const now = runNow()
    if (now === wasRun) return
    if (wasRun === 'working' || wasRun === 'waiting') {
      /* Blue, and a hop. Blue because it is the one hue the creature never
         wears for a feeling of its own — red is anger, yellow is delight,
         dark blue is disappointment — so a bright blue arriving down there
         can only mean the app. It used to go yellow, which is the same
         colour it goes when it is simply pleased, and a notification you
         cannot tell apart from a mood is not a notification.

         Long enough to be caught on a return to the desk: three and a half
         seconds against the two and a bit a mood gets. */
      if (now === 'done' || now === 'seen') {
        flash = 'alert'
        flashUntil = clock + 3.6
        if (grounded && !drag) { vy = -430; grounded = false; flight = 'walk' }
      } else if (now === 'stopped') { flash = 'worry'; flashUntil = clock + 2.6 }
    }
    wasRun = now
    poke = clock
  }

  function want () {
    if (drag) return 'held'
    /* Falling outranks every mood, and it has to: what the creature is
       doing is a fact and what it feels about it is not. Only a free fall
       counts — a walking hop leaves the ground too, and a creature that
       pulled a falling face every time it took a step would be exhausting. */
    if (flight === 'free' && !grounded) return 'fall'

    /* ── whose thinking this is ──
       `think` is the squint and the three dots over its head, and it now
       means one thing only: the creature is working out what to say to
       you. It used to mean a turn was running in Claude Code, which was
       the wrong owner for it — three dots are the universal sign for *I*
       am thinking, and lending them to somebody else's work says one
       thing while meaning another.

       It outranks the app's own states on purpose. Ask it something while
       a turn is running and the question you asked is the one addressed
       to it. */
    if (asking) return 'think'

    const run = runNow()
    /* A turn outranks a mood you asked for, and that is the right way round:
       what the app is doing is a fact, and being told to sit is a preference.
       It goes back to sitting when the turn ends, because `forced` is not
       cleared by the interruption. */
    if (run === 'waiting') return 'ask'
    /* Watching, not thinking. The turn is somebody else's work and the
       creature is keeping an eye on it — which is what this pose has always
       meant. The difference from a pointer wandering past is not carried by
       the shape at all: the halo doubles and the breath goes to three times
       the rate, and both of those read `run` for themselves. */
    if (run === 'working') return 'watch'
    if (forced) return forced
    if (flash && clock < flashUntil) return flash
    if (asleep) return 'sleep'
    /* `watch` meant "reading over your shoulder as you type in the
       composer", and there is no composer. It is the pointer now: you brought
       the mouse near it a moment ago, so it looks up and pays attention. The
       pose is the same pose and means the same thing — somebody is here.

       **Near** is doing real work in that sentence. When the layer was a
       144px strip, "the pointer is in the window" was already almost the same
       as "the pointer is next to the creature". The layer is the whole screen
       now, so without a distance this reads as watching whenever the mouse
       moves anywhere at all — and since `watch` is one of the poses that
       stays put, the creature would simply never walk again. It did not, for
       about ten minutes, which is how this was found. */
    if (clock - ptrAt < 2.2 && ptr && Math.hypot(ptr.x - px, ptr.y - py) < NEAR) return 'watch'
    return 'idle'
  }

  /* ── where it goes ──
     The creature walks the window. It does not drift over the middle of what
     you are reading: it *perches*, and every perch is a real element's rect
     asked for at the moment it is wanted — so folding the rail, opening Files
     or dragging the window narrower needs no bookkeeping whatsoever. A perch
     whose element is not on screen returns null and is skipped rather than
     repaired, and the one it is standing on is re-read every frame, so it
     rides the rail folding underneath it instead of being told about it.

     Which perch depends on what the app is doing, and that is the whole of why
     this reads as alive rather than as a screensaver: it goes where the work
     is. Typing brings it to the composer. A turn takes it up to the document.
     An idle afternoon has it wandering the frame. Asleep it stays exactly
     where it was, because a thing that moves in its sleep is awake. */

  /* ── CHANGE 3 OF 5: the perches ──
     A perch was a selector and a fraction of that element's box, asked for
     at the moment it was wanted so that folding the rail needed no
     bookkeeping. The mechanism survives exactly — a perch is still a
     function asked at the instant it is wanted, and one that cannot answer
     still returns null and is skipped — but what it measures is now the
     taskbar, which main re-measures whenever it moves, changes edge, or a
     monitor is plugged in.

     One code path for all four edges. A vertical taskbar needs no special
     case anywhere below, because the gait already hops between arbitrary
     points: "along the bar" is simply a different long axis. */
  const at = u => () => {
    if (!place) return null
    return place.left + (place.right - place.left) * u
  }

  /* The fractions keep off both ends, and that is measured rather than
     guessed: Start and the pinned icons hold the first fifth of a Windows
     taskbar and the clock and the tray hold the last tenth, so a creature
     wandering the whole width would spend a third of its life standing on
     somebody's button. It keeps to the empty middle, and visits the tray.

     These bound where it *chooses* to stand, not where it can be. Thrown
     at the clock it will happily land on the clock. */
  const PERCH = {
    // wherever it last came to rest after a throw, and right of centre until then
    home:   () => dropped === null ? at(0.62)() : dropped,
    left:   at(0.22),
    mid:    at(0.38),
    centre: at(0.52),
    right:  at(0.70),
    tray:   at(0.84)
  }

  const WANTS = {
    /* Empty, and not an oversight. You have just moved the mouse near it, so
       it looks up at you from where it is. Walking off to a nicer spot the
       moment somebody approaches is the opposite of paying attention. */
    /* Empty, and both for the same reason. `watch` is somebody standing
       over you or a turn you are keeping an eye on; `think` is you working
       out an answer to a question just asked. Wandering off in the middle
       of either is the opposite of paying attention. */
    watch: [],
    think: [],
    ask: ['centre'],
    happy: ['home'],
    /* It has just hopped where it stood and gone blue. Walking away from
       the thing you are being shown is not how you show it. */
    alert: [],
    worry: ['home'],
    idle: ['home', 'left', 'mid', 'centre', 'right', 'tray'],
    /* Three that stay where they are. Being sad, or confused, or asleep is
       not a reason to cross the screen — a creature that wanders off while
       telling you it has no idea is a creature that looks like it left. */
    sad: [],
    confused: [],
    sleep: []
  }

  const ROAM = 22                                // seconds of idling before it wanders
  const STAY = 75                                // and of standing still after you set it down

  /* ── CHANGE 6: the gait, which is now the physics ──
     There were two systems here and they disagreed about what a body is.
     A hop was a parabola tweened between two points over a fixed duration,
     and the creature could not fall, could not be thrown, and could not be
     anywhere the tween had not been told to put it.

     There is one system now. The creature has a velocity, gravity pulls on
     it, the taskbar is the floor and the top of the screen is the ceiling.
     A walk is not a drawn arc any more — it is a small impulse, and the arc
     is what gravity does with it. A throw is the same impulse, larger, from
     your hand instead of from its legs. Nothing in here knows the
     difference between the two, which is the whole reason it is one system.

     The numbers are tuned against a creature 60px tall, not against Earth.
     G is about eight times real gravity at this scale, because a body this
     small falling at 9.8m/s² reads as a feather on a screen — the thing you
     recognise as weight is the acceleration relative to the size of the
     thing, and this is the number where it starts to look heavy. */
  const G = 2600                    // px/s², and the only reason it comes down
  const BOUNCE = 0.42               // how much of an impact comes back up
  const WALL = 0.55                 // and off the sides
  const ROOF = 0.40                 // and off the ceiling, which is a duller sound
  const AIR = 0.4                   // velocity lost per second in flight
  const RUB = 7.0                   // and on the ground, where it stops quickly
  const CATCH = 620                 // an impact softer than this does not bounce
  const FLING = 3200                // the fastest you are allowed to throw it

  /* It ambles when it is wandering and hurries when something wants it. Two
     impulses rather than a stride and a duration: gravity decides how long
     it is in the air and how far it gets, so a heavier push is automatically
     a longer, higher hop and nothing has to be kept in step.

       amble  vy 380 → 0.29s up and down, 27px high, 44px along
       hurry  vy 520 → 0.40s, 52px high, 132px along

     Which is near enough the stride and arc the tween used, arrived at from
     the other end. */
  const GAIT = {
    amble: { vx: 150, vy: 380, rest: 0.26 },
    hurry: { vx: 330, vy: 520, rest: 0.05 }
  }

  let px = -1, py = 0                            // where it is, in client pixels
  let vx = 0, vy = 0                             // and how fast, in pixels a second
  let grounded = false, squash = 0, flight = ""  // "walk" it jumped, "free" it was thrown
  let destX = null, gait = GAIT.amble, restT = 0, hopDir = 0
  let perchName = "", roamAt = 0, hopN = 0, posePerched = ""
  let dropped = null, stayUntil = -1, drag = null
  let forced = "", forcedAt = -1, forcedUntil = -1  // a mood asked for, when it began, when it lapses
  let sayUntil = -1                                // when the bubble stops being worth the room
  let asking = false                               // a question of ours is in flight

  /* Its own measurements, refreshed every frame from the svg so that
     changing the scale in Settings needs no bookkeeping anywhere. `foot` is
     how far the base is below the centre: the silhouette reaches CY + R in a
     100-unit box drawn at 60px, which is 0.36 of the width — worked out
     rather than guessed, because a creature standing 2px into its own floor
     is a creature that looks like it is sinking. */
  let side = 19, foot = 22
  function measure (w) {
    side = w * 0.32
    foot = w * 0.36
  }

  const groundY = () => (place ? place.floor : innerHeight) - foot
  const roofY = () => (place ? place.ceiling : 0) + foot

  const holdIn = () => {
    px = clamp(px, side, innerWidth - side)
    py = clamp(py, roofY(), groundY())
  }

  /* Where it wants to be, which is now an x and nothing else: the floor
     decides the y and it is not negotiable. */
  function goTo (name, now, hurry) {
    const x = PERCH[name] && PERCH[name]()
    if (x === null || x === undefined) return false
    perchName = name
    roamAt = now
    gait = hurry ? GAIT.hurry : GAIT.amble
    if (px < 0) {
      /* The first placement of its life. It could be put on the floor, and
         instead it is dropped from the ceiling — because the first thing you
         should see it do is fall, and a creature that simply appears standing
         there has not told you it has weight.

         From the ceiling and not from somewhere above the screen, which is
         what this said before: py was set to -80 and the ceiling check caught
         it on the very first step, so the drop always began at the ceiling
         anyway. A number that is quietly corrected one line later is a number
         that describes an intention rather than the behaviour. */
      px = x; py = roofY(); vx = 0; vy = 0
      grounded = false; flight = "free"
      return true
    }
    destX = Math.abs(x - px) < 8 ? null : x
    return true
  }

  function choose (pose, now) {
    // asked to hold still, it holds still at home rather than wandering about
    if (still()) { goTo("home", now, true); return }
    /* Just set down. Idling has to mean staying where you put it, or letting
       go is what sends it away: releasing changes the pose, a pose change is a
       reason to move, and it would pick a perch at random the instant your
       finger came off it. */
    if (pose === "idle" && now < stayUntil) { goTo("home", now, true); return }
    const all = WANTS[pose] || WANTS.idle
    if (!all.length) return
    const hurry = pose !== "idle"                // only the wandering ambles
    const list = all.length > 1 ? all.filter(n => n !== perchName) : all
    const start = Math.floor(jitter(hopN * 7.31) * list.length)
    hopN++
    for (let i = 0; i < list.length; i++) {
      if (goTo(list[(start + i) % list.length], now, hurry)) return
    }
  }

  /* ── one step of the world ──
     Gravity, then the walls, then the floor, and the floor last because it
     is the one that can end the fall. Reduced motion gets none of it: the
     creature is simply on the ground, because somebody who asked the system
     for no animation did not mean "except for the bouncing".

     No substepping. At 60fps the fastest legal throw covers 53px a frame
     and the floor is a half-space rather than a thin collider, so there is
     nothing to tunnel through — the clamp catches it wherever it lands. */
  function step (dt, quiet) {
    /* Nowhere yet. This guard is the whole of a bug that took a while to see:
       without it the integrator ran on px = -1, the left wall caught it and
       set px = 19, and from that moment `px < 0` was false — so the creature
       was never placed, never chose a perch, and stood in the corner for ever
       looking perfectly healthy. A sentinel that another piece of code can
       quietly repair is a sentinel that stops being one. */
    if (px < 0) return

    const ground = groundY()
    const roof = roofY()

    if (quiet) {
      py = ground; vx = 0; vy = 0; squash = 0
      grounded = true
      if (destX !== null) { px = destX; destX = null }
      return
    }

    if (drag) { vx = 0; vy = 0; grounded = false; return }

    vy += G * dt
    vx *= Math.exp(-(grounded ? RUB : AIR) * dt)
    px += vx * dt
    py += vy * dt

    if (px < side) { px = side; vx = Math.abs(vx) * WALL }
    else if (px > innerWidth - side) { px = innerWidth - side; vx = -Math.abs(vx) * WALL }

    if (py < roof) { py = roof; vy = Math.abs(vy) * ROOF }

    if (py < ground) { grounded = false; return }

    /* Landing. The impact is what it was travelling at, and it does two
       things: it flattens the creature by an amount proportional to the
       blow, and above a threshold it throws it back up. The threshold is
       what keeps a walk from being a bounce — a hop lands at about 380 and a
       fall from the ceiling at about 1800. */
    const blow = vy
    py = ground
    const landing = !grounded

    if (blow > CATCH) {
      vy = -blow * BOUNCE
      squash = Math.max(squash, clamp(blow / 2200, 0.3, 1))
      grounded = false
    } else {
      if (landing) {
        squash = Math.max(squash, clamp(blow / 1400, 0.14, 0.9))
        restT = Math.max(restT, gait.rest)
      }
      vy = 0
      grounded = true
    }

    /* Come to rest after a throw and this is where you left it — which is
       what makes throwing it somewhere a way of *putting* it somewhere, and
       not just a thing that happens and is then undone. */
    if (grounded && flight === "free") {
      flight = ""
      dropped = px
      perchName = "home"
      destX = null
      stayUntil = clock + STAY
    }
  }

  // one hop of the walk: an impulse, and gravity does the rest
  function stride () {
    const dx = destX - px
    if (Math.abs(dx) < 8) { destX = null; return }
    const dir = Math.sign(dx)
    hopDir = dir
    vx = dir * Math.min(gait.vx, Math.abs(dx) * 2.2)
    vy = -gait.vy
    grounded = false
    flight = "walk"
  }

  /* ── picking it up ──
     The layer takes no pointer events and the ink does, which is the whole of
     how this stays out of the way: only the drawn shape catches the pointer,
     not its box, so the corners of a 60px square over your button are still
     your button. The earlier rule here was "untouchable rather than careful",
     and being movable is the better answer to the same worry — if it is in
     your way you can put it somewhere else.

     Where you drop it becomes home, and it stays put for a while before it
     starts wandering again. Pinning it forever would cost the walking; letting
     it wander off immediately would make setting it down pointless. */
  /* Throwing it, and the little of it that is not free.

     A release needs a velocity, and the velocity has to come from the hand
     rather than from the last two pointer events — those are 8ms apart and
     the noise in them is bigger than the signal. Five samples is about
     80ms of history, which is long enough to be a gesture and short enough
     that the flick at the end is still the thing being measured.

     Stamped with performance.now() and not with the animation clock. `clock`
     only moves once a frame, so several pointer events inside one frame all
     carry the same time and the division at the end is by zero. */
  const TRAIL = 5
  const trail = []
  const nowS = () => performance.now() / 1000

  function fling () {
    if (trail.length < 2) return { x: 0, y: 0 }
    const a = trail[0], b = trail[trail.length - 1]
    const dt = b.t - a.t
    if (dt <= 0.004) return { x: 0, y: 0 }
    return {
      x: clamp((b.x - a.x) / dt, -FLING, FLING),
      y: clamp((b.y - a.y) / dt, -FLING, FLING)
    }
  }

  function grab (e) {
    drag = { dx: px - e.clientX, dy: py - e.clientY, moved: false }
    try { body.setPointerCapture(e.pointerId) } catch (_) {}
    destX = null; restT = 0; vx = 0; vy = 0; squash = 0
    trail.length = 0
    trail.push({ x: px, y: py, t: nowS() })
    svg.dataset.held = "on"
    /* Told at once rather than at the next frame. Main stops hit-testing
       while this is true, and a hand can leave the ink inside one frame. */
    tellInk(true)
    poke = clock
    wake()
    e.preventDefault()
  }

  function haul (e) {
    if (!drag) return
    px = e.clientX + drag.dx
    py = e.clientY + drag.dy
    holdIn()
    drag.moved = true
    trail.push({ x: px, y: py, t: nowS() })
    while (trail.length > TRAIL) trail.shift()
    tellInk(true)
    poke = clock
    wake()
  }

  function letGo () {
    if (!drag) return
    if (drag.moved) {
      /* Let go of it and it goes where you sent it. Dropped from a standstill
         that is straight down, and thrown at forty-five degrees it leaves at
         forty-five degrees — not because there is a case for that anywhere,
         but because there are no cases at all: it keeps the velocity your
         hand gave it and gravity takes it from there. */
      const v = fling()
      vx = v.x; vy = v.y
      grounded = false
      flight = "free"
      dropped = null
    } else {
      /* A press that went nowhere is a poke, and a poke is how a mood lets go.
         This matters more than it looks: the menu used to carry "Let it be"
         and no longer does, so without this a creature told to sleep would
         stay asleep until somebody talked it awake. */
      release()
    }
    drag = null
    delete svg.dataset.held
    tellInk(false)
    poke = clock
    wake()
  }

  body.addEventListener('pointerdown', grab)
  body.addEventListener('pointermove', haul)
  body.addEventListener('pointerup', letGo)
  body.addEventListener('pointercancel', letGo)

  /* ── the loop ──
     One frame is booked at a time and only from `wake()`, so there is exactly
     one in flight however many things asked for it. */
  function draw (now) {
    raf = 0
    const box = svg.getBoundingClientRect()
    if (box.width < 1 || box.height < 1) return   // nowhere to draw: stop, and stay stopped

    measure(box.width || 60)

    if (!t0) { t0 = now; poke = 0 }
    const prev = clock
    clock = ((now - t0) / 1000) * RATE
    const dt = clamp(clock - prev, 0, 0.06)
    const quiet = still()

    readRun()

    // a turn in flight is the app being alive on your behalf; it does not doze
    const run = runNow()
    if (run === 'working' || run === 'waiting') poke = clock

    const idleFor = clock - poke
    const wasAsleep = asleep
    asleep = !quiet && idleFor > SLEEP
    if (wasAsleep && !asleep) wakeStretch = 1
    const drowsy = quiet ? 0 : clamp((idleFor - (SLEEP - DROWSE)) / DROWSE, 0, 1)

    // a mood with a clock on it: dance is a turn, not a state of being
    if (forced && forcedUntil > 0 && clock > forcedUntil) { forced = ''; forcedUntil = -1 }

    setPose(want())

    /* ── standing somewhere ──
       A change of mood is a reason to move, and idling long enough is the
       other one. Sleep is neither: it stays where it fell asleep. */
    if (px < 0) { goTo('home', clock, true); posePerched = poseName }
    else if (drag) { posePerched = poseName }    // held: you decide, nothing else does
    else if (poseName !== posePerched) {
      posePerched = poseName
      if (poseName !== 'sleep') choose(poseName, clock)
    } else if (poseName === 'idle' && !quiet && clock > stayUntil && clock - roamAt > ROAM) {
      choose('idle', clock)
    }

    /* ── the world takes a step ──
       Everything that decides where it is happens in here, and the order is
       the load-bearing part: it walks only from the ground and only when it
       has stood still for a beat, and gravity is integrated whether or not
       anybody asked it to move. A creature that only falls when the code
       remembers to make it fall is a creature that hangs in the air the day
       somebody adds a branch. */
    if (grounded && !drag) {
      if (restT > 0) restT = Math.max(0, restT - dt)
      else if (destX !== null) stride()
    }

    step(dt, quiet)
    squash = Math.max(0, squash - dt * 3.4)

    /* The lean into a hop, which used to be the tween's own progress and is
       now read off the velocity: full at the top of the arc, nothing at the
       moment it leaves and the moment it lands. Same curve, arrived at from
       the other end. */
    let bob = 0
    const leap = grounded || drag ? 0 : clamp(1 - Math.abs(vy) / 520, 0, 1)

    // the shape, rebuilt only while one pose is becoming another
    if (mix < 1) {
      mix = clamp(mix + dt / MORPH, 0, 1)
      const u = easeOut(mix)
      for (let i = 0; i < N * 2; i++) cur[i] = lerp(from[i], to[i], u)
      const d = pathOf(cur)
      if (d !== drawn) shape(drawn = d)
      eyeNow.open = lerp(fromP.open, toP.open, u)
      eyeNow.wide = lerp(fromP.wide, toP.wide, u)
      eyeNow.bow = lerp(fromP.bow, toP.bow, u)
      eyeNow.tilt = lerp(fromP.tilt, toP.tilt, u)
    }

    /* ── gaze ──
       Lesson 2: both axes are replaced, never nudged. Lesson 3: the wander
       goes on afterwards, so a creature told where to look stays looking. */
    let target = null
    if (!asleep) {
      /* The pointer wins when it has just moved. It used to lose to the caret
         whenever the composer had focus, so typing once and then waving the
         mouse about got you a creature staring fixedly at a caret nobody was
         looking at. Recency is the better tiebreak: you moved the mouse a
         moment ago, so that is where the attention is. */
      if (clock - ptrAt < 2.6) target = ptr
      if (!target && (run === 'working' || run === 'waiting')) target = workPoint()
    }

    /* Where in the line, not where in the room. The creature stands in the
       far corner of the window and the composer is a long way off and level
       with it, so every caret position in a line is at the same extreme angle
       from here: mapped optically, the eyes saturate hard right the moment you
       start typing and never move again. Which is correct, and unreadable.

       So anything that arrives with a box of its own is read as a fraction of
       that box, and the optics are kept only for the pointer, which is the one
       target that really can be anywhere. A lean toward the sheet is added
       back as a constant, because the creature is in fact looking that way. */
    let ty = 0, tp = 0
    if (poseName === 'sad') {
      /* At the floor, and every few seconds up at you. A creature that only
         ever looks down reads as switched off; the glance up is the whole of
         what makes it read as hoping you will say something. */
      const up = (clock % 5.4) > 4.1
      ty = 0
      tp = up ? -0.14 : 0.84
    } else if (drag) {
      // dangling: it looks down at the drop rather than at whatever it passes
      ty = clamp(hopDir * 0.18, -1, 1)
      tp = 0.55
    } else if (target && target.box) {
      const b = target.box
      ty = clamp(0.34 + ((target.x - b.left) / b.width - 0.5) * 1.3, -1, 1)
      tp = clamp(0.12 + ((target.y - b.top) / Math.max(1, b.height) - 0.5) * 0.9, -1, 1)
    } else if (target) {
      /* Measured against the room it actually has, not against half a window.
         The creature usually stands at the left edge, so a fixed divisor let it
         turn hard right and never hard left — there is simply not 960px of
         window on that side to be far away in. Dividing by the distance to the
         edge it is looking toward makes the two directions feel alike even
         though they are nothing like the same number of pixels. */
      const ox = box.left + box.width / 2, oy = box.top + box.height / 2
      const dx = target.x - ox, dy = target.y - oy
      ty = clamp(dx / Math.max(150, dx < 0 ? ox : innerWidth - ox), -1, 1)
      tp = clamp(dy / Math.max(130, dy < 0 ? oy : innerHeight - oy), -1, 1)
    }
    const glide = quiet ? 1 : 1 - Math.pow(0.0016, dt)
    yaw = lerp(yaw, ty, glide)
    pitch = lerp(pitch, tp, glide)

    const w1 = quiet ? 0 : Math.sin(clock * 0.31) * 0.5 + Math.sin(clock * 0.17) * 0.5
    const w2 = quiet ? 0 : Math.sin(clock * 0.23 + 1.7) * 0.6
    const gx = clamp(yaw + w1 * (target ? 0.05 : 0.34), -1, 1)
    const gy = clamp(pitch + w2 * (target ? 0.04 : 0.22), -1, 1)

    // breath, the stretch it gives on waking, and the one it gives in the air
    wakeStretch = Math.max(0, wakeStretch - dt * 1.6)
    const rate = run === 'working' ? 2.5 : 0.85
    const depth = run === 'working' ? 0.05 : 0.022
    const br = quiet ? 0 : Math.sin(clock * rate) * depth
    const st = wakeStretch * (1 - wakeStretch) * 0.36
    /* ── slime ──
       Two deformations on top of everything the pose already does, and they
       are the whole of why a falling shape reads as a body rather than as a
       picture being moved. Drawn out by the speed of the fall, flattened by
       the blow that ends it.

       Both preserve area, roughly — narrow as it lengthens, wide as it
       flattens. A thing that only stretched would look like it was being
       scaled, which is exactly what it is and exactly what it must not look
       like.

       The squash is smoothstepped rather than linear because the eye reads
       the *start* of the recovery, not the end: linear decay pops off the
       floor and eases into nothing, which is the wrong way round. */
    const sq = squash * squash * (3 - 2 * squash)

    /* The stretch is held back while the squash is recovering, and that is a
       fix rather than a refinement. The two act on the same axis in opposite
       directions, and a landing hard enough to bounce hands the creature its
       upward velocity on the very frame the squash is set — so the stretch
       came straight back and cancelled it. Measured: the widest frame of a
       bounce was 36px against a resting 35, which is to say there was no
       visible squash at all despite the number being right.

       Suppressing one by the other is also the better physical account. A
       slime hitting the ground is compressed, recovers, and only then draws
       out again; it does not do both at once. */
    const stretch = grounded || drag
      ? 0
      : clamp(Math.abs(vy) / 1500, 0, 0.42) * (1 - sq)
    const sx = (1 + br * 0.7 + st * 0.5 - leap * 0.13) * (1 - stretch * 0.62 + sq * 0.55)
    const sy = (1 - br + st + leap * 0.17) * (1 + stretch - sq * 0.48)

    /* It leans into a hop and comes upright on landing, pivoting near its base
       rather than its middle. A creature that rotates about its waist reads as
       a sprite being tweened — which is exactly what this is, and exactly what
       it must not look like. */
    /* Dancing is not a pose, it is a pose plus a beat — the shape carries the
       look and this carries the tempo, so nothing had to learn about timelines.
       Bounce off the floor on the absolute sine (it never goes *into* the
       ground) and swing about the heel on the halved one, so the sway takes two
       bounces to come round and it reads as a step rather than a wobble. */
    let sway = 0
    if (poseName === 'dance' && !quiet && !drag) {
      bob -= Math.abs(Math.sin(clock * 6.6)) * 11
      sway = Math.sin(clock * 3.3) * 10
    }

    /* Anger shakes, and the shake decays to a simmer over the first couple of
       seconds rather than buzzing at full strength until something stops it.
       A thing that vibrates at one amplitude indefinitely stops reading as
       angry and starts reading as broken. The colour is CSS — see .mas-body. */
    if (poseName === 'happy' && !quiet && !drag) {
      // quicker and smaller than the dance, which is the difference between
      // delight and choreography
      bob -= Math.abs(Math.sin(clock * 8.4)) * 8
      sway += Math.sin(clock * 4.2) * 4.5
    }

    let shakeX = 0, shakeY = 0
    if (poseName === 'angry' && !quiet && !drag) {
      const heat = 0.25 + 0.75 * Math.exp(-Math.max(0, clock - forcedAt) / 2.4)
      shakeX = Math.sin(clock * 43) * 2.3 * heat
      shakeY = Math.sin(clock * 37 + 1.7) * 1.5 * heat
      sway += Math.sin(clock * 31) * 2.6 * heat
    }

    /* ── turning to look ──
       It has no neck, so a turn has to be three things at once and none of them
       is enough alone: the body leans from its base toward whatever it is
       watching, it narrows as a head does when it is no longer facing you, and
       the eyes travel furthest of all. The lean on its own reads as falling
       over; the narrowing on its own reads as a rendering bug. Together they
       read as somebody turning round to look at you. */
    /* Everything scales about the heel and not the middle, and that is the
       difference between a creature that squashes on the floor and one that
       sinks into it. It matters for the breath too — a body resting on the
       ground should not rise and fall through it — but it was survivable
       there and is not survivable for a landing half its own height deep. */
    const heel = CY + R * 0.9
    const narrow = 1 - Math.abs(gx) * 0.11

    gBody.setAttribute('transform',
      'translate(' + (gx * 4.6).toFixed(2) + ' ' + (gy * 3.0).toFixed(2) + ') ' +
      'rotate(' + (hopDir * leap * 7 + sway + gx * 6.5).toFixed(2) + ' ' + CX + ' ' + heel.toFixed(1) + ') ' +
      'translate(' + CX + ' ' + heel.toFixed(1) + ') scale(' + (sx * narrow).toFixed(4) + ' ' + sy.toFixed(4) + ') ' +
      'translate(' + (-CX) + ' ' + (-heel).toFixed(1) + ')')

    /* ── the eyes ──
       A blink and a wink are the same act done to a different number of them:
       `lid` shuts both, `winkNow` shuts one. Both *scale* `open` rather than
       replacing it, which is what lets the creature blink in the middle of a
       grin and still be grinning when it opens.

       They are called lx/rxE and not px/rx: `px` is where the creature is
       standing, and a const of that name in here would put the whole of draw()
       inside its temporal dead zone. */
    const lid = quiet ? 1 : lidAt(clock)
    const shut = asleep ? 0.06 : (1 - drowsy * 0.55) * lid
    const wink = quiet ? 1 : winkNow()

    const ex = EYE_X * eyeNow.wide
    const rxE = EYE_R * eyeNow.wide
    const gdx = gx * 8.8, gdy = gy * 5.4
    const lx = CX - ex + gdx, rex = CX + ex + gdx, ecy = CY + EYE_Y + gdy
    const ryOf = k => Math.max(0.35, EYE_R * eyeNow.open * shut * k)

    eyeL.setAttribute('d', eyePath(lx, ecy, rxE, ryOf(1), eyeNow.bow, -eyeNow.tilt))
    // the closing eye picks up an arch on the way down, which is what makes a
    // wink read as cheerful rather than as one eye having stopped working
    eyeR.setAttribute('d', eyePath(rex, ecy, rxE, ryOf(wink), eyeNow.bow + (1 - wink) * 0.9, eyeNow.tilt))

    if (halo) halo.setAttribute('opacity', (run === 'working' ? 0.64 + br * 4 : asleep ? 0.12 : 0.32).toFixed(3))

    // and last, where the whole creature is standing
    drawX = px + shakeX
    drawY = py + bob + shakeY
    svg.style.transform = 'translate(' + (drawX - box.width / 2).toFixed(1) + 'px,' +
      (drawY - box.height / 2).toFixed(1) + 'px)'

    // the bubble and the box ride over its head, and follow it if it moves
    if (sayEl && !sayEl.hidden && clock > sayUntil) bubble('')
    if ((sayEl && !sayEl.hidden) || (askEl && !askEl.hidden)) speak(box.width || 60)

    if (svg.dataset.pose !== poseName) svg.dataset.pose = poseName

    // keep going while anything moves, and while anything is still settling
    overhead(quiet)
    tellInk()

    if (!quiet || mix < 1 || wakeStretch > 0 || !grounded || squash > 0 || restT > 0 || destX !== null || drag ||
        clock - winkAt < WINK || clock - huhAt < HUH) wake()
  }

  /* ── what asks for a frame ──
     An attribute lands a frame before the layout it causes, so everything
     here only ever books a frame; nothing here decides anything. */
  /* Two ways in, and they are not redundant. Once the ink has the pointer the
     window stops ignoring the mouse and the page gets ordinary events, which
     is what makes dragging work; until then the page gets nothing at all and
     main's poll is the only thing that knows. Both write the same two
     variables, so nothing downstream has to know which one it heard from. */
  function sawPointer (x, y) {
    ptr = { x: x, y: y }
    ptrAt = clock
    poke = clock
    wake()
  }

  addEventListener('pointermove', e => sawPointer(e.clientX, e.clientY), { passive: true })

  if (api.onCursor) {
    api.onCursor(p => {
      if (p) return sawPointer(p.x, p.y)
      /* Gone. Dropping ptr is what lets the gaze go back to wandering, and
         the hit test has to be told or the window stays solid over the
         taskbar after the pointer that made it solid has left. */
      ptr = null
      wake()
    })
  }

  new MutationObserver(() => { poke = clock; wake() })
    .observe(document.body, { attributes: true, attributeFilter: ['data-run'] })
  new MutationObserver(wake)
    .observe(root, { attributes: true, attributeFilter: ['data-motion'] })
  new ResizeObserver(wake).observe(svg)

  addEventListener('resize', wake)
  addEventListener('visibilitychange', () => { if (!document.hidden) wake() })
  addEventListener('focus', () => { poke = clock; wake() })
  addEventListener('keydown', () => { poke = clock; wake() }, true)
  document.addEventListener('input', () => { poke = clock; wake() }, true)
  document.addEventListener('focusin', () => { poke = clock; wake() })
  document.addEventListener('focusout', wake)
  document.addEventListener('selectionchange', wake)
  reduce.addEventListener('change', wake)

  /* ── the voice ──
     Right-click the ink and a box opens over its head. There was a menu in
     between, with three items, and two of them had moved to the tray while the
     third was something you can simply say to it — so what was left was a door
     to the thing you actually wanted, charged at one click.

     Right-click does nothing at all when there is no way to reach a model,
     rather than opening a box that then admits it can do nothing.

     The whole of what it may do is here. Read it as the permission list. */
  /* ── CHANGE 4 OF 5: the acts ──
     Every act used to press one of the host's own controls, found by the
     attribute the app itself keyed on, and that was the whole permission
     surface: the creature could do nothing the page could not already do.
     There is no page, so the guarantee cannot be inherited and has to be
     restated — which is what `api.act` is.

     Main holds a closed object of no-argument functions. There is no shell,
     no path, and no name that reaches a filesystem, and a name that is not
     in that object does nothing at all. Read the ACT table in main.js as the
     permission list, and keep it that way: the moment one of them takes an
     argument from here, the guarantee is gone.

     Half the table never left the renderer, and that half is unchanged. The
     creature being able to change its own face is what makes a mood
     answerable — told to wake up it can decide to wake up, or decide not to
     and say so, and either way what it decided is what you then see. */
  const ask = name => { if (api.act) api.act(name) }

  function hold (mood, secs) {
    forced = mood
    forcedAt = clock
    forcedUntil = secs ? clock + secs : -1
    poke = clock
    wake()
  }

  /* Out of whatever it was holding, and awake with it. `poke` is the half that
     is easy to miss: sleep has two sources — a mood it was asked for and the
     idle timer — and a creature told to wake up has to come out of both, or it
     says it is awake while visibly not being, which is lying in two channels
     at once. */
  function release () {
    forced = ''
    forcedAt = -1
    forcedUntil = -1
    poke = clock
    wake()
  }

  const ACT = {
    none: () => {},
    /* The three that leave the page, and the whole of them. Settings and a
       usage pane will join these when there is a window to open; there is
       no point naming an act that opens nothing. */
    hide: () => ask('hide'),
    bigger: () => ask('bigger'),
    smaller: () => ask('smaller'),
    /* The one act the physics made possible, and it is entirely its own:
       an impulse straight up, a little sideways so it is a jump and not a
       pogo. Nothing outside this file has to know it happened. */
    jump: () => {
      if (drag) return
      vy = -900
      vx += (jitter(clock * 3.1) - 0.5) * 220
      grounded = false
      flight = 'free'
      poke = clock
      wake()
    },
    /* The half of the table that is the creature itself, unchanged. Anger
       lapses on its own after three quarters of a minute: a mascot still
       sulking because you forgot about it is a mascot you start ignoring. */
    sleep: () => hold('sleep'),
    sad: () => hold('sad', 40),
    happy: () => hold('happy', 6),
    wink: () => { winkAt = clock; wake() },
    confused: () => { huhAt = clock; hold('confused', 3.4) },
    sit: () => hold('sit'),
    dance: () => hold('dance', 7),
    angry: () => hold('angry', 45),
    wake: () => release(),
    calm: () => { release(); flash = 'happy'; flashUntil = clock + 2.2 }
  }

  /* Long enough to read twice, never long enough to become furniture. The
     length is the creature's own doing: MASCOT.md holds it to a sentence. */
  function bubble (text, waiting) {
    if (!sayEl) return
    const t = String(text || '').trim()
    sayEl.textContent = t
    sayEl.hidden = !t
    if (waiting) sayEl.dataset.wait = 'on'
    else delete sayEl.dataset.wait
    sayUntil = !t ? -1 : waiting ? Infinity : clock + clamp(3 + t.length / 14, 4, 13)
    wake()
  }

  // above its head, or under it when there is no room above
  function speak (w) {
    for (const el of [sayEl, askEl]) {
      if (!el || el.hidden) continue
      const r = el.getBoundingClientRect()
      const ew = r.width || 240, eh = r.height || 38
      let y = py - w / 2 - eh - 10
      if (y < 8) y = py + w / 2 + 10
      const x = clamp(px - ew / 2, 8, innerWidth - ew - 8)
      el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'
    }
  }

  /* ── the ask box, and the one thing it needs that nothing else does ──
     The window is `focusable: false`, which is what stops clicking the
     creature from taking the caret out of whatever you were typing in. A
     text field in a window that cannot be focused is a text field you cannot
     type into, so the box lifts that for exactly as long as it is open and
     puts it back after.

     Told to main both times rather than left to lapse: a window left
     focusable is a window that will steal your caret the next time the
     creature is clicked, which is the behaviour this whole property exists
     to prevent. */
  function hideAsk () {
    if (!askEl) return
    askEl.hidden = true
    if (askIn) askIn.value = ''
    if (api.focus) api.focus(false)
    tellInk()
  }

  function askSomething () {
    if (!askEl || !askIn) return
    // switched off in Settings: there is nobody there to talk to
    if (svg.getBoundingClientRect().width < 1) return
    bubble('')
    askEl.hidden = false
    tellInk()
    if (api.focus) api.focus(true)
    wake()
    // placed before it takes the caret, or it opens at the top-left corner
    requestAnimationFrame(() => { speak(60); askIn.focus() })
  }

  /* ── CHANGE 5 OF 5: the voice ──
     Everything below this line is the machinery for speaking: the bubble, the
     ask box, and the one call that gets a sentence back.

     It was written here and left switched off for a version, because a mascot
     that offers advice is a mascot that interrupts and the expression had to
     be worth trusting first. It is on now, and switching it on was the one
     line `canTalk` is set from.

     It still never speaks unprompted, and that is not a setting. There is no
     path in this file that opens the bubble without somebody having asked. */
  let canTalk = false
  async function readAuth () {
    if (!api.talk || !api.ready) { canTalk = false; return }
    /* Asked of main rather than assumed from the bridge existing. There are
       two ways for the voice to be unavailable on a machine where this file
       is running perfectly well — no Claude Code binary to run it through,
       and no MASCOT.md to be somebody out of — and neither is visible from
       here. A right button that opens a box which then admits it can do
       nothing costs you a click to learn what an inert button says for free. */
    try { canTalk = !!(await api.ready()) } catch (_) { canTalk = false }
  }
  readAuth()

  body.addEventListener('contextmenu', e => {
    e.preventDefault()                   // and with it the window's own menu
    e.stopPropagation()
    if (canTalk) askSomething()
  })

  if (askEl) askEl.addEventListener('submit', async e => {
    e.preventDefault()
    const said = askIn ? askIn.value.trim() : ''
    hideAsk()
    if (!said) return
    poke = clock
    bubble('…', true)

    /* This is what `think` now means, and the whole of what sets it: a
       question of ours is in flight. It is cleared in a finally, because a
       creature left visibly thinking about an answer that failed to arrive is
       a creature that has hung — and the two ways this can end badly, a throw
       from the bridge and a reply that is not ok, are both easy to return
       from and forget.

       The mood sent over is read before the flag, so it describes the moment
       you asked rather than the fact that you asked. */
    const mood = poseName
    asking = true
    wake()

    let r = null
    try {
      /* What it is told about the moment, and the whole of it: the mood, what
         Claude Code is doing, which folders are open, and where it is
         standing. No transcript, no files, no code — MASCOT.md promises it
         cannot see those, and the promise is kept by not sending them rather
         than by asking it nicely. */
      r = await api.talk({
        text: said,
        mood: mood,
        run: runNow(),
        sessions: sessions,
        where: perchName || 'middle'
      })
    } catch (_) {
      r = null
    } finally {
      asking = false
      wake()
    }

    if (!r || !r.ok) {
      bubble(r && r.why === 'no-character' ? 'MASCOT.md went missing.' : 'Nothing came to mind.')
      return
    }
    bubble(r.say)
    const act = ACT[r.act]
    if (act) act()
  })

  /* Ctrl+T, for the times the creature is somewhere your mouse is not.
     Captured rather than bubbled, so it works from inside the ask box too.

     It only reaches this window while the window has focus, which is almost
     never — that is what the tray and the right button are for. It is kept
     because it costs a line and it works while the box is already open. */
  addEventListener('keydown', e => {
    if (!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey) return
    if (e.key.toLowerCase() !== 't') return
    e.preventDefault()
    if (canTalk) askSomething()
  }, true)

  document.addEventListener('pointerdown', e => {
    if (askEl && !askEl.hidden && !askEl.contains(e.target)) hideAsk()
  })
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return
    if (askEl && !askEl.hidden) { hideAsk(); wake() }
  })

  /* ── the other half of the click-through ──
     This is the one thing this file has that Origin's never needed.

     Inside a window, `pointer-events: none` on the layer and `auto` on the
     ink was the whole story: only the drawn shape caught the pointer, never
     its 60px box. On the desktop the window itself is in the way — a strip
     lying across your taskbar would eat every click meant for Start. So the
     window is transparent to the mouse at the Win32 level and forwards only
     movement, and this tells main when to let go of that.

     Distance to a point rather than to the box, so a creature standing in
     the corner of a 60px square does not make the other three corners of it
     unclickable.

     0.60 of the box and not 0.34. The tighter number was the silhouette's
     own radius — R is 32 in a 100-unit viewBox — which is correct and is
     not the same question. What you want is a *target*, and a target the
     exact size of the thing is a target you miss: the creature is 38px wide
     and moving, and the pointer has to land on it while it walks. This is
     36px of radius around a 19px body, so there is about a finger's width
     of margin all round. It costs nothing — the margin is invisible and
     click-through is restored the moment you leave it.

     Called from the pointer handler AND from the end of every frame, because
     the creature walks: standing still with your hand on the mouse, it can
     arrive under a pointer that has not moved, and a hit test that only ran
     on movement would hand you a creature you cannot grab until you jiggle. */
  /* ── telling main where the ink is ──
     This used to be the hit test itself, and it moved out of the page when
     the window went from a 144px strip to the whole screen — the note in
     overlay.js has the reasoning. What is left is the half only the renderer
     can know: where the creature actually got painted this frame, and how
     big it is after the scale.

     0.34 of the box is the silhouette's own radius with a little over for a
     grab margin: R is 32 in a 100-unit viewBox. Distance to the shape and
     not to its box, so the corners of a 60px square sitting over your Start
     button are still your Start button.

     Sent only when something changed by enough to matter. A creature
     standing still sends nothing at all; one crossing the screen sends about
     thirty a second for as long as that takes. */
  let told = { x: -1e4, y: -1e4, r: 0, hold: false }
  /* `hold` means main must keep the mouse for us whatever the distance says.
     Two things want that and they want it for the same reason: a hand can
     leave the ink inside one frame while dragging, and the ask box is a text
     field a long way from the creature that still has to be clickable. */
  const holding = () => !!drag || !!(askEl && !askEl.hidden)

  function tellInk (hold) {
    if (!api.ink) return
    const r = (svg.getBoundingClientRect().width || 60) * 0.60
    const h = hold === undefined ? holding() : !!hold
    if (h === told.hold && r === told.r &&
        Math.abs(drawX - told.x) < 2 && Math.abs(drawY - told.y) < 2) return
    told = { x: drawX, y: drawY, r: r, hold: h }
    api.ink(drawX, drawY, r, h)
  }

  shape(drawn = pathOf(cur))
  wake()
})()
