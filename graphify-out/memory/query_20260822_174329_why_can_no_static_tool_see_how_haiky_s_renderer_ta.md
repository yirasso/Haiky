---
type: "query"
date: "2026-08-22T17:43:29.270958+00:00"
question: "Why can no static tool see how Haiky's renderer talks to main, and what fixes it?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["The Seam — eleven named channels in preload.js", "preload.js", "Facts Go Up, Conclusions Come Down", "Adding a Twelfth Channel (four edits, in order)", "writeRun()", "tellInk()", "Only Four Channels Are Awaited (what the renderer cannot answer about itself)"]
---

# Q: Why can no static tool see how Haiky's renderer talks to main, and what fixes it?

## Answer

Because the wire is a string. src/main/preload.js is the only boundary - eleven named channels behind contextBridge, no require on the far side - so main.js, overlay.js and renderer/mascot.js have no import edge between them and every import-following tool, graphify included, read them as three unrelated programs. Before IPC.md the graph had zero edges crossing the preload; preload.js sat in its own three-node community and writeRun() could not reach main.js at any distance. IPC.md documents each channel with the line that sends it and the line that receives it, verified individually, and its extraction adds 18 nodes and 66 edges. Effects: 'The Seam - eleven named channels in preload.js' becomes the third-largest hub at 16 edges, tellInk() rises to 10, writeRun() reaches main.js in two hops via haiky:run, and the isolated preload community dissolves into the contract community. The rule the table encodes is at src/main/overlay.js:169 - the renderer publishes a fact, main draws the conclusion - which is why five channels push downward (run, place, sessions, cursor, settings), two fire upward without an answer (ink, focus), and only four are awaited (act, talk, ready, settings-get): those four are the questions the page cannot answer about itself. Maintenance rule: a twelfth channel needs preload.js, a handler in main.js or overlay.js, a guarded consumer in renderer/mascot.js, and a row in IPC.md - a channel missing from IPC.md is a channel nothing can find later.

## Outcome

- Signal: useful

## Source Nodes

- The Seam — eleven named channels in preload.js
- preload.js
- Facts Go Up, Conclusions Come Down
- Adding a Twelfth Channel (four edits, in order)
- writeRun()
- tellInk()
- Only Four Channels Are Awaited (what the renderer cannot answer about itself)