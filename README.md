# Haiky

A small creature that lives over the Windows taskbar and keeps company while
Claude Code works.

The taskbar is its floor and the top of the screen is its ceiling. It has
weight: it falls, it lands with a slap, and if you pick it up and throw it at
forty-five degrees it leaves at forty-five degrees and gravity takes it from
there. It walks along the bar, watches the pointer, falls asleep when you go
away, and changes what it is doing when Claude Code changes what *it* is doing
— thinking while a turn runs, looking up when the agent stops to ask you
something, pleased when one finishes.

**It never speaks unprompted.** Right-click it and a box opens over its head;
say nothing to it and it says nothing, forever. No tips, no nudges, no "did you
know". That is the whole reason it is company rather than Clippy.

**It is not a coding assistant and must never become one.** There is a very
good one already on the screen.

```bash
npm install && npm start
```

There is no window. Everything is the tray icon.

## Building it

```bash
npm run dist
```

Two files in `dist/`: an installer and a portable exe that needs no install.
Both are ~178MB, and almost all of that is one file — `resources/claude/`,
the whole Claude Code binary at 337MB before compression. It is copied out of
`node_modules` by `extraResources` and the platform package is excluded from
the asar, because a binary inside an asar is a binary nothing can spawn. That
path is exactly what `executable()` in `src/main/mascot.js` looks for when
`app.isPackaged`.

`build/make-icon.js` draws every icon from the same superellipse the engine
uses, so there is no exported asset to drift. It emits the app icon and two
tray icons — a pale creature for a dark taskbar and a dark one for a light
taskbar, picked at runtime from `nativeTheme` and followed live. Windows does
not invert a tray icon for you, and the first build shipped a black creature
on a black taskbar.

---

## The creature came from somewhere

`vendor/removed-snapshot/` is thirteen files lifted verbatim out of
[Origin](https://github.com/) — the engine, its personality file, and the
instructions for porting it. **Nothing in there is loaded by this app.** It is
kept as it arrived, including its own README, which is worth reading: it names
which of its decisions were arrived at by doing the other thing first, and
those are the ones not to undo.

`src/renderer/mascot.js` is that engine, re-pointed and then given a body. The
five changes that took it out of Origin are commented where they happen and
numbered `CHANGE n OF 5`; the sixth replaced the gait with physics. The
silhouette, the poses, the gaze, the eyes, the blink and the sleep are
byte-identical to the snapshot — only where it goes has changed.

One thing was fixed rather than carried across: the snapshot's `mascot.html`
closes its `<svg>` twice, and its README left it that way on purpose so that
the fix would be a decision somebody made. This is that decision.

---

## How it knows anything

Four parts, deliberately independent of each other.

| | |
|---|---|
| `src/main/sessions.js` | **Is Claude Code open, and where.** Watches `~/.claude/sessions/`, which holds one JSON file per live session. Files outlive their processes — this machine had sixty-two files and five live sessions — so every pid is checked before it counts. |
| `src/main/bridge.js` | **What Claude Code is doing.** A loopback HTTP server. Five hooks post to it and it turns them into the five words the engine already understood: `working` · `waiting` · `done` · `stopped` · nothing. |
| `src/main/hooks.js` | **The one thing that writes a file Haiky does not own.** Merges a block into `~/.claude/settings.json`, never without being asked, never without showing the exact JSON first. |
| `src/main/overlay.js` | **Where it lives.** A transparent, click-through window over the whole display. The taskbar's rectangle is `display.bounds − display.workArea`, which is exact, live and free — and its top edge is the floor. |

### The signal, unchanged

The preload writes the run state onto `body.dataset.run`, which is where the
engine has always looked for it. So the MutationObserver and every pose hanging
off it are untouched code. The creature cannot tell that the fact now arrives
over IPC from a hook rather than from a composer next door.

### Whose thinking is whose

The squint and the three dots over its head are `think`, and they mean one
thing only: **the creature** is working out what to say to you. They used to
mean a turn was running in Claude Code, which was the wrong owner — three dots
are the universal sign for *I* am thinking, and lending them to somebody
else's work says one thing while meaning another.

| what is happening | what you see |
|---|---|
| a Claude Code turn is running | attentive, halo at double, breath at three times the rate — **no dots** |
| it has stopped to ask you something | eyes wide, hops to the middle |
| **a turn has finished** | **bright blue, and a hop** |
| a turn failed | the worried face |
| you asked *it* something | the squint, and the three dots |

Blue because it is the one hue the creature never wears for a feeling of its
own — red is anger, yellow is delight, dark blue is disappointment. A bright
blue arriving down there can only mean the app. It used to go yellow, which is
also what it goes when it is simply pleased, and a notification you cannot tell
apart from a mood is not a notification.

Three channels for one fact — colour, pose and a jump — because the whole job
of that state is to be noticed on a taskbar you are not looking at.

### Nothing launches with Claude Code

Haiky starts at login, sits invisible, and *appears* when a session file
appears. Watching for a file is a fact; watching for a process to be spawned is
a race.

---

## Writing into somebody else's settings

`~/.claude/settings.json` belongs to Claude Code and to the person using it.
Four rules, each here because the alternative is somebody losing work:

1. **Merge, never replace.** One key changes; everything else is written back
   as found.
2. **Back up first**, into Haiky's own folder — a backup written into
   `~/.claude/backups` would be litter in a directory another program prunes.
3. **Write atomically.** A half-written `settings.json` does not parse, and
   Claude Code would open tomorrow having forgotten everything.
4. **Remove exactly what was added.** Ours are recognisable by their URL. An
   event left empty loses its key; a `hooks` left empty loses its key too.

Verified against a copy of a real 4KB hand-edited settings file: install then
remove returns it identical, another program's hooks in the same events
survive both, reinstalling on a different port leaves no duplicates, and a
`settings.json` that will not parse is refused rather than replaced.

**`async: true` on every hook is not a detail.** A hook Claude Code waits for
is a hook that makes Claude Code slower, and nothing about a mascot is worth a
millisecond of somebody's turn.

**Five events and no more.** `PreToolUse`/`PostToolUse` would mean a hundred
requests for a turn with fifty tool calls, to say something already known.
They are where "it is running tests" would come from later — a reason to add
them when there is something to do with them.

### That they arrive is evidence, not inference

A bare listener was put on the port in Haiky's place and a fresh headless
session run against the real settings file:

```
  8019ms  POST /haiky/working  token=sim  event=UserPromptSubmit  session=d43c119f  cwd=Haiky
 11159ms  POST /haiky/done     token=sim  event=Stop             session=d43c119f  cwd=Haiky
 11182ms  POST /haiky/end      token=sim  event=SessionEnd       session=d43c119f  cwd=Haiky
```

Header present, one session id across all three, right working directory.
`Notification` and `StopFailure` are conditional and did not fire in a trivial
run, which is correct.

**Hooks load when a session starts.** Installing them does nothing for the
sessions already open — a fact worth knowing before concluding they are
broken.

---

## It has weight

There were two systems for moving the creature and they disagreed about what a
body is. A hop was a parabola tweened between two points over a fixed duration:
it could not fall, could not be thrown, and could not be anywhere the tween had
not been told to put it.

There is one system now. The creature has a velocity, gravity pulls on it, and
the room is `floor` · `ceiling` · two walls. **A walk is not a drawn arc — it
is a small impulse, and the arc is what gravity does with it.** A throw is the
same impulse, larger, from your hand instead of from its legs. Nothing in the
engine knows the difference between the two, which is the whole reason it is
one system.

`G` is about eight times real gravity at this scale, because a 60px body
falling at 9.8m/s² reads as a feather: what you recognise as weight is
acceleration relative to size.

**Slime.** Drawn out and narrowed by the speed of a fall, flattened and spread
by the blow that ends it, both roughly preserving area — a thing that only
stretched would look like it was being scaled, which is exactly what it is and
exactly what it must not look like. Everything scales about the **heel** rather
than the middle, which is the difference between squashing on the floor and
sinking into it.

Measured, dropping from three heights:

| drop | peak squash | width |
|---|---|---|
| 90px | 0.33 | 38 → 41px |
| 430px | 0.73 | 38 → 52px |
| ceiling | 0.99 | 38 → 60px |

The stretch is held back while the squash recovers (`× (1 - sq)`), and that is
a fix rather than a refinement: a landing hard enough to bounce hands the
creature its upward velocity on the very frame the squash is set, so the two
cancelled. Before the fix the widest frame of a bounce measured 36px against a
resting 35 — the number was right and nothing was visible.

A throw at forty-five degrees, logged: released at `vx -1340, vy -1203` (42°),
apex 641px up, bounced off the left wall (`vx` −1027 → +539), two floor bounces,
then rolled to a stop.

---

## Click-through, and why the test moved

Inside a window, `pointer-events: none` on the layer and `auto` on the ink was
the whole story: only the drawn shape catches the pointer, never its 60px box.
On the desktop the window itself is in the way — a sheet across your screen
would eat every click meant for anything.

So the window is transparent to the mouse at the Win32 level
(`WS_EX_TRANSPARENT`) and only becomes solid while the pointer is on the ink.

**Electron's mouse forwarding does not reach this window.** Measured, not
assumed: a sweep of six hundred cursor positions produced not one
`pointermove` in the page. The cause is `focusable: false` — the window never
becomes foreground, and forwarding never fires for a window that is never
active. So main polls `getCursorScreenPoint` at 30Hz.

**The hit test lives in main**, not in the renderer. It started in the page,
which was right when the window was a 144px strip: the worst a mistake could do
was make a slice of taskbar unclickable. The window is the whole screen now, so
a test that says yes and never says no again would leave every click landing on
an invisible sheet of glass. The renderer publishes where the ink is; main
draws the conclusion, in the same loop that reads the cursor, with no round trip
that can be dropped or answered by a page that has stopped painting.

---

## The voice, and the half of it that costs nothing

Right-click the ink. There was a menu in between with three items, two of which
had moved to the tray while the third was something you can simply say to it —
a door to the thing you actually wanted, charged at one click. Left button
picks it up, right button talks to it.

**Two answerers behind one channel, and the order is the point.**

`src/main/intents.js` is asked first. It takes the short imperatives about the
creature's own body — *dorme*, *salta*, *fica maior*, *vai-te embora* — in well
under a millisecond and for nothing at all. Measured end to end: typed, Enter,
and **166ms later it was already in the air**.

Three guards stop it eating the conversation, because a router that is too
eager turns a creature with a personality into a vending machine: nothing over
60 characters, nothing containing a question mark, and every pattern anchored
at both ends. *"não durmas"* and *"dorme"* are one character apart in a
substring search and opposite in meaning.

Everything else goes to `src/main/mascot.js` — Haiku, no preset, no tools, one
turn, a structured reply. **The preset goes**: a plain string in `systemPrompt`
replaces `claude_code` outright, which is what makes this an ordinary chat that
happens to be a small creature rather than a coding assistant in a costume. It
is also why `MASCOT.md` has to say everything.

`MASCOT.md` is not documentation about the prompt. It **is** the prompt. Editing
that file changes the creature and touches no code.

### What it actually costs, which is more than hoped

| | latency | in | out | cost |
|---|---|---|---|---|
| script | ~0ms | — | — | $0 |
| first model reply | ~10s | 6392 | 268 | $0.0254 |
| second | 5.7s | 6450 | 188 | $0.0115 |

Caching roughly halves it after the first — the character file sits before
`SYSTEM_PROMPT_DYNAMIC_BOUNDARY` and the name and memories after it, so the
long unchanging half is cacheable and the short changing half is not.
(Measured in Origin: replacing the whole character file with one line dropped
the token count to 3,617 and put the cost **up**. The file is cheap for being
long and unchanging; what costs money is a system prompt that varies.)

**A cent a sentence and six seconds is not what FILE.md asked for.** The
latency is a `claude.exe` spawned per message. Keeping one warm across messages
is the fix and it is not written yet. Until it is, the script table is what
makes the creature feel alive, and the model is for the half a table of regexes
is no good at — which is everything with a person in it.

### The keyboard, in a window that refuses it

`focusable: false` is what stops a click on the creature from pulling the caret
out of whatever you were writing — and it is exactly why the ask box could not
be typed into, because a window that cannot be activated cannot be sent a
keystroke. So the box lifts it on the way in and puts it back on the way out,
and on blur as well as on request: the two ways out of that box are Escape and
clicking elsewhere, and only one of them tells us.

---

## The permission list

`ACT` in `src/main/main.js` is the whole of what the creature may do to the
machine. In Origin the guarantee was that it could do nothing the page could
not already do, because every act pressed one of the app's own buttons. There
is no page here, so the guarantee is restated rather than inherited: every act
is one narrow function taking **no argument**, there is no shell, no path, no
name that reaches a filesystem, and a name that is not in that object does
nothing.

Read it as the permission list and keep it that way. The moment one of them
takes an argument from the renderer, the guarantee is gone.

---

## What is deliberately not here

- **Skins, sounds, and a settings window.** Next. The tray carries the
  switches that exist.
- **A warm subprocess.** Every model reply spawns a `claude.exe` and waits for
  it, which is most of the six seconds. Keeping one alive across messages is
  the next thing worth doing to the voice.
- **Speaking first.** It never will. You ask it or it says nothing.
- **Anything that reads your code, your files or your transcript.** The
  creature is told what Claude Code is doing and nothing else, and that promise
  is kept by not sending it rather than by asking nicely.
- **Changing the Claude Desktop theme.** Its theme lives in a leveldb store
  and is not safely writable from outside. `~/.claude/settings.json` is; the
  desktop app's appearance is not, and the creature should say so rather than
  pretend.

## Known limits

- A genuinely full-screen app covers the overlay. That is correct. `Ctrl+Shift+H`
  and the tray both hide it.
- An auto-hidden taskbar reports no rectangle to subtract, so the creature
  stands where the bar will be when it slides back up.
- The primary display only, for now.
- Where you put it down does not survive a restart.
