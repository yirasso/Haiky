# Graph Report - Haiky  (2026-08-22)

## Corpus Check
- 32 files · ~50,405 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 394 nodes · 648 edges · 19 communities
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 79 edges (avg confidence: 0.84)
- Token cost: 177,132 input · 0 output

## Community Hubs (Navigation)
- Channel, Act and Reply Contract
- Click-Through Seam and the Port
- Creature Identity and Voice
- Haiky Renderer Creature
- Haiky Mascot Agent Runtime
- Origin Renderer Creature
- Main Process Orchestration
- Package Manifest and Dependencies
- Electron Build Config
- Overlay Window Geometry
- Claude Code Hook Installer
- Origin Mascot Agent Runtime
- Session File Watcher
- Loopback Hook Bridge Server
- Preferences Store
- Tray Icon Generator
- Renderer Glue and Spend Display
- Intent Router
- Eye Clipping and Gaze

## God Nodes (most connected - your core abstractions)
1. `draw()` - 19 edges
2. `draw()` - 17 edges
3. `The Seam — eleven named channels in preload.js` - 16 edges
4. `Q: Which creature physics crossed into main, which stayed in the DOM, and what decided the split` - 13 edges
5. `build` - 11 edges
6. `tellInk()` - 10 edges
7. `wake()` - 10 edges
8. `paintTray()` - 10 edges
9. `wake()` - 9 edges
10. `haiky:talk — a question and the moment around it` - 9 edges

## Surprising Connections (you probably didn't know these)
- `The Renderer Never require()s Anything` --conceptually_related_to--> `tellInk()`  [INFERRED]
  CLAUDE.md → src/renderer/mascot.js
- `tellInk()` --shares_data_with--> `haiky:ink — where the ink is, renderer to main`  [INFERRED]
  src/renderer/mascot.js → IPC.md
- `Haiky - Electron Creature on a Click-Through Taskbar Overlay` --references--> `pollCursor()`  [INFERRED]
  CLAUDE.md → src/main/overlay.js
- `haiky:ink — where the ink is, renderer to main` --shares_data_with--> `at`  [EXTRACTED]
  IPC.md → src/main/overlay.js
- `Act Table (one act per reply)` --semantically_similar_to--> `Origin Act Table (settings, usage, skills, new-session, files, terminal, theme)`  [INFERRED] [semantically similar]
  MASCOT.md → vendor/removed-snapshot/MASCOT.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **The four deliberately independent parts of Haiky** — readme_sessions_watcher, readme_bridge, readme_hooks, readme_overlay [EXTRACTED 1.00]
- **The hit-test loop: ink up, decision in main, window flag out** — src_renderer_mascot_tellink, ipc_haiky_ink, src_main_overlay_at, src_main_overlay_pollcursor, src_main_overlay_setignore [EXTRACTED 1.00]
- **Awaited upward: the four questions the page cannot answer** — ipc_haiky_act, ipc_haiky_talk, ipc_haiky_ready, ipc_haiky_settings_get [EXTRACTED 1.00]
- **Pushed downward: the five facts main owns** — ipc_haiky_run, ipc_haiky_place, ipc_haiky_sessions, ipc_haiky_cursor, ipc_haiky_settings [EXTRACTED 1.00]
- **What a port must re-point: PERCH, ACT, WANTS, the run signal and the CSS tokens** — vendor_origin_snapshot_readme_perch, vendor_origin_snapshot_readme_act, vendor_origin_snapshot_readme_wants, vendor_origin_snapshot_readme_body_data_run, vendor_origin_snapshot_readme_css_tokens [EXTRACTED 1.00]
- **The voice pipeline: ask box, free router, model, reply shape** — src_renderer_overlay_mas_ask, readme_intents, readme_main_mascot, mascot_reply_shape, readme_act_permission_list [INFERRED 0.85]

## Communities (19 total, 0 thin omitted)

### Community 0 - "Channel, Act and Reply Contract"
Cohesion: 0.07
Nodes (41): Comments Explain Why, Not What, Claude Code Signal Pipeline (sessions.js, bridge.js, hooks.js), The MASCOT.md Promise Is Kept By Not Sending, Read IPC.md Before Crossing the Preload, The Renderer Never require()s Anything, Adding a Twelfth Channel (four edits, in order), haiky:act — an act by name, against the allowlist, haiky:cursor — pointer position from the 30Hz poll (+33 more)

### Community 1 - "Click-Through Seam and the Port"
Cohesion: 0.09
Nodes (32): build/ Is Not Scanned by graphify (make-icon.js indexed by hand), CSS Is Not a graphify File Type (mascot.css is invisible to the graph), Graphify Query-First Convention, Haiky - Electron Creature on a Click-Through Taskbar Overlay, Tray Icons Drawn From the Creature's Superellipse, Vendor Snapshot Is Read Only, Q: Why the Origin packing list bridges Creature Identity to Click-Through Overlay Physics, Q: Which creature physics crossed into main, which stayed in the DOM, and what decided the split (+24 more)

### Community 2 - "Creature Identity and Voice"
Cohesion: 0.07
Nodes (32): Cannot Read Code, Files or Transcript, Company, Not a Colleague, European Portuguese Mirroring, Moods (idle, watch, think, ask, happy, worry, fall, sleep, held), The Creature (Haiky system prompt), extraResources / asar exclusion for the Claude Code binary, Haiky, Three Router Guards (length, question mark, anchored patterns) (+24 more)

### Community 3 - "Haiky Renderer Creature"
Cohesion: 0.15
Nodes (28): askSomething(), bubble(), choose(), draw(), eyePath(), fling(), goTo(), grab() (+20 more)

### Community 4 - "Haiky Mascot Agent Runtime"
Cohesion: 0.12
Nodes (24): Never Bump a DOCS version Casually, The Weekly Ledger Never Rolls Over, ACTS, { app }, bill(), character(), executable(), forget() (+16 more)

### Community 5 - "Origin Renderer Creature"
Cohesion: 0.15
Nodes (23): askSomething(), bubble(), caretPoint(), choose(), draw(), eyePath(), goTo(), grab() (+15 more)

### Community 6 - "Main Process Orchestration"
Cohesion: 0.14
Nodes (24): ACT, { app, Tray, Menu, dialog, nativeImage, nativeTheme, globalShortcut, ipcMain, shell }, applyAutostart(), askToInstall(), autostartOn(), backupDir(), bridge, buildTray() (+16 more)

### Community 7 - "Package Manifest and Dependencies"
Cohesion: 0.09
Nodes (21): @anthropic-ai/claude-agent-sdk, electron, electron-builder, author, dependencies, @anthropic-ai/claude-agent-sdk, description, devDependencies (+13 more)

### Community 8 - "Electron Build Config"
Cohesion: 0.10
Nodes (21): build, appId, asar, asarUnpack, directories, extraResources, files, npmRebuild (+13 more)

### Community 9 - "Overlay Window Geometry"
Cohesion: 0.14
Nodes (16): haiky:place — strip and bar geometry, main to renderer, Pushed, Never Asked For (no renderer polling), barRect(), layout(), { screen }, strip(), at, { BrowserWindow, screen, ipcMain } (+8 more)

### Community 10 - "Claude Code Hook Installer"
Cohesion: 0.22
Nodes (18): backup(), EVENTS, exists(), FILE, fs, handler(), install(), mine() (+10 more)

### Community 11 - "Origin Mascot Agent Runtime"
Cohesion: 0.18
Nodes (18): ACTS, { app }, character(), executable(), forget(), fs, keep(), load() (+10 more)

### Community 12 - "Session File Watcher"
Cohesion: 0.18
Nodes (16): alive(), current, DIR, drop(), fs, key(), later(), listeners (+8 more)

### Community 13 - "Loopback Hook Bridge Server"
Cohesion: 0.17
Nodes (14): crypto, handle(), http, lapses, listen(), loopback(), publish(), RANK (+6 more)

### Community 14 - "Preferences Store"
Cohesion: 0.24
Nodes (11): { app }, fallback(), file(), flush(), fs, held, load(), path (+3 more)

### Community 15 - "Tray Icon Generator"
Cohesion: 0.22
Nodes (9): app, chunk(), crc(), crcTable, fs, out, path, png() (+1 more)

### Community 16 - "Renderer Glue and Spend Display"
Cohesion: 0.43
Nodes (6): money(), paintSpend(), pfMascot, put(), short(), tokens()

### Community 17 - "Intent Router"
Cohesion: 0.38
Nodes (6): match(), pick(), READY, TABLE, turn, wrap()

### Community 18 - "Eye Clipping and Gaze"
Cohesion: 0.50
Nodes (4): #mas-cut clipPath (eye trimming), The Gaze Is Expressive, Not Optical, Eyes Were Holes, Now Filled and Clipped, #mas-cut clipPath (snapshot; was a mask until Aug 2026)

## Knowledge Gaps
- **103 isolated node(s):** `{ contextBridge, ipcRenderer }`, `EVENTS`, `FILE`, `fs`, `os` (+98 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `haiky:act — an act by name, against the allowlist` connect `Channel, Act and Reply Contract` to `Haiky Renderer Creature`, `Main Process Orchestration`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `Act Table (one act per reply)` connect `Channel, Act and Reply Contract` to `Creature Identity and Voice`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `The Creature (Haiky system prompt)` connect `Creature Identity and Voice` to `Channel, Act and Reply Contract`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Q: Which creature physics crossed into main, which stayed in the DOM, and what decided the split` (e.g. with `Q: Why the Origin packing list bridges Creature Identity to Click-Through Overlay Physics` and `haiky:ink — where the ink is, renderer to main`) actually correct?**
  _`Q: Which creature physics crossed into main, which stayed in the DOM, and what decided the split` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `{ contextBridge, ipcRenderer }`, `EVENTS`, `FILE` to the rest of the system?**
  _103 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Channel, Act and Reply Contract` be split into smaller, more focused modules?**
  _Cohesion score 0.0743321718931475 - nodes in this community are weakly interconnected._
- **Should `Click-Through Seam and the Port` be split into smaller, more focused modules?**
  _Cohesion score 0.09274193548387097 - nodes in this community are weakly interconnected._