# The seam

Everything the creature knows about the machine, and everything the machine
knows about the creature, crosses one boundary: `src/main/preload.js`. There is
no `require` on the far side of it, no `ipcRenderer`, and no way for the page to
ask for a channel by name. Eleven names are exposed and the list is the whole of
it.

This file is that list, written down in one place, because it is the one part of
Haiky no static reader can follow. A tool that reads imports sees `main.js`,
`overlay.js` and `mascot.js` as three unrelated programs — the wire between them
is a string, and a string is invisible to every import graph there is.

## The eleven

Direction is from the side that *knows the fact* to the side that needs it.

| channel | direction | sent by | received by |
|---|---|---|---|
| `haiky:run` | main → renderer | `src/main/main.js:260` | `writeRun()` — `src/main/preload.js:24` |
| `haiky:place` | main → renderer | `place_()` `src/main/overlay.js:62`, `create()` `:114` | `src/renderer/mascot.js:100` |
| `haiky:sessions` | main → renderer | `src/main/main.js:268` | `src/renderer/mascot.js:108` |
| `haiky:cursor` | main → renderer | `pollCursor()` `src/main/overlay.js:201`, and `null` at `:188` | `sawPointer()` — `src/renderer/mascot.js:1192` |
| `haiky:settings` | main → renderer | `src/main/main.js:328` | `src/renderer/mascot.js:123` |
| `haiky:ink` | renderer → main | `tellInk()` `src/renderer/mascot.js:1519` | `src/main/overlay.js:170`, into `at` |
| `haiky:focus` | renderer → main | `hideAsk()` `:1344`, `askSomething()` `:1355` | `src/main/overlay.js:223` |
| `haiky:act` | renderer → main, awaited | `src/renderer/mascot.js:1245` | `src/main/main.js:324` |
| `haiky:talk` | renderer → main, awaited | `src/renderer/mascot.js:1419` | `src/main/main.js:345` |
| `haiky:ready` | renderer → main, awaited | `readAuth()` `src/renderer/mascot.js:1381` | `src/main/main.js:356` |
| `haiky:settings-get` | renderer → main, awaited | `src/renderer/mascot.js:122` | `src/main/main.js:358` |

## Why the traffic runs the way it does

**Facts go up, conclusions come down.** The rule is written at
`src/main/overlay.js:169` and it decides every entry in the table above: the
renderer publishes a fact, main draws the conclusion. `haiky:ink` is the clearest
case — the page says where its ink is and how big, and says nothing about whether
the pointer is on it. Main owns that answer because main owns the window flag
that acts on it, and because a page that has stopped painting can still be asked
a question it will never answer. A hit test that says *yes* and never says *no*
again leaves every click landing on an invisible sheet of glass.

**Pushed, never asked for.** Nothing in the renderer polls. `haiky:place` and
`haiky:sessions` arrive when they change, because every source of a change to
either is in main, and a page that asks is a page that can ask at the wrong
moment.

**`haiky:cursor` exists because the window refuses the mouse.** A window that is
never activated is never forwarded pointer movement, however the ignore flag is
set — so the page cannot learn where the pointer is by listening for it. The same
30Hz loop that decides the hit test also reports the position, and both come out
of one reading of the cursor.

**Only four are awaited**, and all four are questions the renderer cannot answer
about itself: may I do this (`haiky:act`), what do you say (`haiky:talk`), is
there a voice at all on this machine (`haiky:ready`), what are the preferences
(`haiky:settings-get`).

## The two that carry the weight

`haiky:run` is the one required signal. The preload does not hand it to the
renderer as a message — it writes it onto `body.dataset.run`, which is where the
engine has always looked. The MutationObserver, the flash on `done`, the worry on
`stopped` and every pose hanging off them are untouched code. The creature cannot
tell that the fact now arrives over IPC from a hook instead of from a composer
next door, and that is most of why porting the engine was small.

`haiky:act` is the whole permission surface. Main holds the allowlist; a name
that is not on it does nothing at all. The renderer cannot widen it, cannot
enumerate it, and cannot reach a capability by describing one — an act is a name
on a list, not a tool with arguments.

## What never crosses

`haiky:talk` carries what was said and the little the creature knows about the
moment: its mood, what Claude Code is doing, which folders are open, where it is
standing. No path, no transcript, no line of code. What the creature can see is
decided on the far side rather than asked for politely on this one — the promise
in `MASCOT.md` is kept by not sending the things, not by requesting that they be
ignored.

## If you add a twelfth

Four edits, in this order, or it will fail silently rather than loudly:

1. Name it in `src/main/preload.js` — nothing outside that file can open a
   channel.
2. Handle it in `src/main/main.js` (app-level) or `src/main/overlay.js` (window
   or pointer-level).
3. Consume it in `src/renderer/mascot.js`, guarded on the method existing — the
   renderer must still run when the preload is older than it is.
4. Add the row above, then `graphify update .` — this file is the only reason
   the knowledge graph can see the seam at all.
