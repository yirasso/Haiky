# Graph Report - Haiky  (2026-08-26)

## Corpus Check
- 20 files · ~46,924 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 317 nodes · 508 edges · 18 communities (15 shown, 3 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 52 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a190b787`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- The Creature (Haiky system prompt)
- main/mascot.js
- overlay.js
- renderer/mascot.js
- The Double </svg> Fix
- preload.js
- main.js
- package.json
- Electron Build Config
- shoot.js
- hooks.js
- store.js
- sessions.js
- Loopback Hook Bridge Server
- Tray Icon Generator
- intents.js
- #mas-cut clipPath (eye trimming)
- shoot-preload.js

## God Nodes (most connected - your core abstractions)
1. `draw()` - 19 edges
2. `The Seam — eleven named channels in preload.js` - 16 edges
3. `build` - 11 edges
4. `Q: Why can no static tool see how Haiky's renderer talks to main, and what fixes it?` - 11 edges
5. `paintTray()` - 10 edges
6. `wake()` - 10 edges
7. `tellInk()` - 10 edges
8. `haiky:talk — a question and the moment around it` - 9 edges
9. `Haiky - Electron Creature on a Click-Through Taskbar Overlay` - 8 edges
10. `scripts` - 7 edges

## Surprising Connections (you probably didn't know these)
- `haiky:ink — where the ink is, renderer to main` --shares_data_with--> `at`  [EXTRACTED]
  IPC.md → src/main/overlay.js
- `readAuth()` --shares_data_with--> `haiky:ready — is there a voice on this machine`  [EXTRACTED]
  src/renderer/mascot.js → IPC.md
- `The Renderer Never require()s Anything` --conceptually_related_to--> `tellInk()`  [INFERRED]
  CLAUDE.md → src/renderer/mascot.js
- `Haiky - Electron Creature on a Click-Through Taskbar Overlay` --references--> `pollCursor()`  [INFERRED]
  CLAUDE.md → src/main/overlay.js
- `pollCursor()` --shares_data_with--> `haiky:cursor — pointer position from the 30Hz poll`  [EXTRACTED]
  src/main/overlay.js → IPC.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **The four deliberately independent parts of Haiky** — readme_sessions_watcher, readme_bridge, readme_hooks, readme_overlay [EXTRACTED 1.00]
- **The hit-test loop: ink up, decision in main, window flag out** — src_renderer_mascot_tellink, ipc_haiky_ink, src_main_overlay_at, src_main_overlay_pollcursor, src_main_overlay_setignore [EXTRACTED 1.00]
- **Awaited upward: the four questions the page cannot answer** — ipc_haiky_act, ipc_haiky_talk, ipc_haiky_ready, ipc_haiky_settings_get [EXTRACTED 1.00]
- **Pushed downward: the five facts main owns** — ipc_haiky_run, ipc_haiky_place, ipc_haiky_sessions, ipc_haiky_cursor, ipc_haiky_settings [EXTRACTED 1.00]
- **The voice pipeline: ask box, free router, model, reply shape** — src_renderer_overlay_mas_ask, readme_intents, readme_main_mascot, mascot_reply_shape, readme_act_permission_list [INFERRED 0.85]

## Communities (18 total, 3 thin omitted)

### Community 0 - "The Creature (Haiky system prompt)"
Cohesion: 0.12
Nodes (16): Cannot Read Code, Files or Transcript, Company, Not a Colleague, European Portuguese Mirroring, Moods (idle, watch, think, ask, happy, worry, fall, sleep, held), The Creature (Haiky system prompt), extraResources / asar exclusion for the Claude Code binary, Haiky, Three Router Guards (length, question mark, anchored patterns) (+8 more)

### Community 1 - "main/mascot.js"
Cohesion: 0.15
Nodes (22): Never Bump a DOCS version Casually, The Weekly Ledger Never Rolls Over, ACTS, { app }, bill(), character(), executable(), forget() (+14 more)

### Community 2 - "overlay.js"
Cohesion: 0.10
Nodes (25): build/ Is Not Scanned — Source Belongs in tools/, CSS Is Not a graphify File Type (mascot.css is invisible to the graph), Graphify Query-First Convention, Haiky - Electron Creature on a Click-Through Taskbar Overlay, Tray Icons Drawn From the Creature's Superellipse, Facts Go Up, Conclusions Come Down, haiky:place — strip and bar geometry, main to renderer, Pushed, Never Asked For (no renderer polling) (+17 more)

### Community 3 - "renderer/mascot.js"
Cohesion: 0.14
Nodes (29): askSomething(), bubble(), choose(), draw(), eyePath(), fling(), goTo(), grab() (+21 more)

### Community 5 - "preload.js"
Cohesion: 0.08
Nodes (42): Comments Explain Why, Not What, Claude Code Signal Pipeline (sessions.js, bridge.js, hooks.js), The MASCOT.md Promise Is Kept By Not Sending, Read IPC.md Before Crossing the Preload, The Renderer Never require()s Anything, Q: Why can no static tool see how Haiky's renderer talks to main, and what fixes it?, Adding a Twelfth Channel (four edits, in order), haiky:act — an act by name, against the allowlist (+34 more)

### Community 6 - "main.js"
Cohesion: 0.14
Nodes (24): ACT, { app, Tray, Menu, dialog, nativeImage, nativeTheme, globalShortcut, ipcMain, shell }, applyAutostart(), askToInstall(), autostartOn(), backupDir(), bridge, buildTray() (+16 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (21): @anthropic-ai/claude-agent-sdk, electron, electron-builder, author, dependencies, @anthropic-ai/claude-agent-sdk, description, devDependencies (+13 more)

### Community 8 - "Electron Build Config"
Cohesion: 0.10
Nodes (21): build, appId, asar, asarUnpack, directories, extraResources, files, npmRebuild (+13 more)

### Community 9 - "shoot.js"
Cohesion: 0.18
Nodes (8): { app, BrowserWindow }, fs, OUT, PAGE, path, place, ROOT, SHOTS

### Community 10 - "hooks.js"
Cohesion: 0.22
Nodes (18): backup(), EVENTS, exists(), FILE, fs, handler(), install(), mine() (+10 more)

### Community 11 - "store.js"
Cohesion: 0.24
Nodes (11): { app }, fallback(), file(), flush(), fs, held, load(), path (+3 more)

### Community 12 - "sessions.js"
Cohesion: 0.18
Nodes (16): alive(), current, DIR, drop(), fs, key(), later(), listeners (+8 more)

### Community 13 - "Loopback Hook Bridge Server"
Cohesion: 0.17
Nodes (14): crypto, handle(), http, lapses, listen(), loopback(), publish(), RANK (+6 more)

### Community 14 - "Tray Icon Generator"
Cohesion: 0.22
Nodes (9): app, chunk(), crc(), crcTable, fs, out, path, png() (+1 more)

### Community 16 - "intents.js"
Cohesion: 0.38
Nodes (6): match(), pick(), READY, TABLE, turn, wrap()

## Knowledge Gaps
- **100 isolated node(s):** `name`, `version`, `description`, `main`, `author` (+95 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `preload.js` (2× useful, score=1.816480016) _(code changed — re-verify)_
- `tellInk()` (2× useful, score=1.816480016) _(code changed — re-verify)_
- `Hit Test Lives in Main (30Hz cursor poll)` (2× useful, score=1.815904503) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `haiky:act — an act by name, against the allowlist` connect `preload.js` to `renderer/mascot.js`, `main.js`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `Q: Why can no static tool see how Haiky's renderer talks to main, and what fixes it?` connect `preload.js` to `overlay.js`, `renderer/mascot.js`, `main.js`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `Act Table (one act per reply)` connect `preload.js` to `The Creature (Haiky system prompt)`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _100 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `The Creature (Haiky system prompt)` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `overlay.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09655172413793103 - nodes in this community are weakly interconnected._
- **Should `renderer/mascot.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14408602150537633 - nodes in this community are weakly interconnected._