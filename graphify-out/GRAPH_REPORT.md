# Graph Report - Haiky  (2026-08-22)

## Corpus Check
- 34 files · ~52,032 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 396 nodes · 679 edges · 18 communities
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.85)
- Token cost: 237,991 input · 0 output

## Community Hubs (Navigation)
- Channel Contract and Preload Seam
- Voice Runtime, Ledger and Store
- Claude Code Hook Installer
- Origin Mascot Agent Runtime
- Session File Watcher
- Loopback Hook Bridge Server
- Tray Icon Generator
- Renderer Glue and Spend Display
- Intent Router
- Click-Through Seam and the Port
- Haiky Renderer Creature
- Origin Renderer Creature
- Main Process Orchestration
- Overlay Window Geometry
- Package Manifest and Dependencies
- Electron Build Config
- Eye Clipping and Gaze
- Creature Identity and Voice

## God Nodes (most connected - your core abstractions)
1. `Q: Which exported symbols in src/main are dead, and is any of it a real defect?` - 20 edges
2. `draw()` - 19 edges
3. `draw()` - 17 edges
4. `The Seam — eleven named channels in preload.js` - 17 edges
5. `Q: Which creature physics crossed into main, which stayed in the DOM, and what decided the split` - 13 edges
6. `tellInk()` - 11 edges
7. `build` - 11 edges
8. `Q: Why can no static tool see how Haiky's renderer talks to main, and what fixes it?` - 11 edges
9. `wake()` - 10 edges
10. `paintTray()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `list()` --cites--> `Q: Which exported symbols in src/main are dead, and is any of it a real defect?`  [EXTRACTED]
  src/main/sessions.js → graphify-out/memory/query_20260822_174328_which_exported_symbols_in_src_main_are_dead__and_i.md
- `outline()` --cites--> `Q: Which exported symbols in src/main are dead, and is any of it a real defect?`  [EXTRACTED]
  src/renderer/mascot.js → graphify-out/memory/query_20260822_174328_which_exported_symbols_in_src_main_are_dead__and_i.md
- `tellInk()` --conceptually_related_to--> `The Renderer Never require()s Anything`  [INFERRED]
  src/renderer/mascot.js → CLAUDE.md
- `get()` --cites--> `Q: Which exported symbols in src/main are dead, and is any of it a real defect?`  [EXTRACTED]
  src/main/overlay.js → graphify-out/memory/query_20260822_174328_which_exported_symbols_in_src_main_are_dead__and_i.md
- `isShown()` --cites--> `Q: Which exported symbols in src/main are dead, and is any of it a real defect?`  [EXTRACTED]
  src/main/overlay.js → graphify-out/memory/query_20260822_174328_which_exported_symbols_in_src_main_are_dead__and_i.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **The four deliberately independent parts of Haiky** — readme_sessions_watcher, readme_bridge, readme_hooks, readme_overlay [EXTRACTED 1.00]
- **The hit-test loop: ink up, decision in main, window flag out** — src_renderer_mascot_tellink, ipc_haiky_ink, src_main_overlay_at, src_main_overlay_pollcursor, src_main_overlay_setignore [EXTRACTED 1.00]
- **Awaited upward: the four questions the page cannot answer** — ipc_haiky_act, ipc_haiky_talk, ipc_haiky_ready, ipc_haiky_settings_get [EXTRACTED 1.00]
- **Pushed downward: the five facts main owns** — ipc_haiky_run, ipc_haiky_place, ipc_haiky_sessions, ipc_haiky_cursor, ipc_haiky_settings [EXTRACTED 1.00]
- **What a port must re-point: PERCH, ACT, WANTS, the run signal and the CSS tokens** — vendor_origin_snapshot_readme_perch, vendor_origin_snapshot_readme_act, vendor_origin_snapshot_readme_wants, vendor_origin_snapshot_readme_body_data_run, vendor_origin_snapshot_readme_css_tokens [EXTRACTED 1.00]
- **The voice pipeline: ask box, free router, model, reply shape** — src_renderer_overlay_mas_ask, readme_intents, readme_main_mascot, mascot_reply_shape, readme_act_permission_list [INFERRED 0.85]

## Communities (18 total, 0 thin omitted)

### Community 0 - "Channel Contract and Preload Seam"
Cohesion: 0.07
Nodes (44): writeRun(), readAuth(), { contextBridge, ipcRenderer }, .mas-fx — dots and question mark, .mas-say speech bubble, Claude Code Signal Pipeline (sessions.js, bridge.js, hooks.js), haiky:act — an act by name, against the allowlist, haiky:ready — is there a voice on this machine (+36 more)

### Community 1 - "Voice Runtime, Ledger and Store"
Cohesion: 0.09
Nodes (36): bill(), character(), executable(), forget(), keep(), ready(), rollWeek(), situation() (+28 more)

### Community 10 - "Claude Code Hook Installer"
Cohesion: 0.22
Nodes (18): backup(), exists(), handler(), install(), mine(), preview(), read(), readable() (+10 more)

### Community 11 - "Origin Mascot Agent Runtime"
Cohesion: 0.18
Nodes (18): character(), executable(), forget(), keep(), load(), rollWeek(), situation(), state() (+10 more)

### Community 12 - "Session File Watcher"
Cohesion: 0.18
Nodes (17): alive(), drop(), key(), later(), list(), read(), rescan(), soon() (+9 more)

### Community 13 - "Loopback Hook Bridge Server"
Cohesion: 0.17
Nodes (14): handle(), listen(), loopback(), publish(), set(), start(), state(), worst() (+6 more)

### Community 14 - "Tray Icon Generator"
Cohesion: 0.22
Nodes (9): chunk(), crc(), png(), app, crcTable, fs, out, path (+1 more)

### Community 15 - "Renderer Glue and Spend Display"
Cohesion: 0.43
Nodes (6): money(), paintSpend(), put(), short(), tokens(), pfMascot

### Community 16 - "Intent Router"
Cohesion: 0.38
Nodes (6): match(), pick(), wrap(), READY, TABLE, turn

### Community 2 - "Click-Through Seam and the Port"
Cohesion: 0.10
Nodes (32): pollCursor(), setIgnore(), Q: Why the Origin packing list bridges Creature Identity to Click-Through Overlay Physics, Q: Which creature physics crossed into main, which stayed in the DOM, and what decided the split, Graphify Query-First Convention, Tray Icons Drawn From the Creature's Superellipse, overlay.js — transparent click-through window, One Physics System (gravity, velocity, floor, ceiling, walls) (+24 more)

### Community 3 - "Haiky Renderer Creature"
Cohesion: 0.15
Nodes (30): askSomething(), bubble(), choose(), draw(), eyePath(), fling(), goTo(), grab() (+22 more)

### Community 5 - "Origin Renderer Creature"
Cohesion: 0.15
Nodes (23): askSomething(), bubble(), caretPoint(), choose(), draw(), eyePath(), goTo(), grab() (+15 more)

### Community 6 - "Main Process Orchestration"
Cohesion: 0.14
Nodes (24): applyAutostart(), askToInstall(), autostartOn(), backupDir(), buildTray(), paintTray(), prefs(), refreshShown() (+16 more)

### Community 9 - "Overlay Window Geometry"
Cohesion: 0.15
Nodes (16): barRect(), layout(), strip(), create(), get(), isShown(), layout(), place_() (+8 more)

### Community 7 - "Package Manifest and Dependencies"
Cohesion: 0.09
Nodes (21): author, dependencies, @anthropic-ai/claude-agent-sdk, description, devDependencies, electron, electron-builder, license (+13 more)

### Community 8 - "Electron Build Config"
Cohesion: 0.10
Nodes (21): build, appId, asar, asarUnpack, directories, extraResources, files, npmRebuild (+13 more)

### Community 17 - "Eye Clipping and Gaze"
Cohesion: 0.50
Nodes (4): #mas-cut clipPath (eye trimming), #mas-cut clipPath (snapshot; was a mask until Aug 2026), The Gaze Is Expressive, Not Optical, Eyes Were Holes, Now Filled and Clipped

### Community 4 - "Creature Identity and Voice"
Cohesion: 0.07
Nodes (31): .mas-ask input form, Companion Switch (#pf-mascot), Talk to the Creature shortcut row (⌘T), #chat-spend — the agent's spend ledger, #mas-spend — the creature's spend ledger, #masmenu — right-button menu with one Talk item, Deferred mascot.js script tag, intents.js — free regex router for body imperatives (+23 more)

## Knowledge Gaps
- **100 isolated node(s):** `{ contextBridge, ipcRenderer }`, `{ app }`, `fs`, `path`, `{ query, SYSTEM_PROMPT_DYNAMIC_BOUNDARY }` (+95 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `haiky:act — an act by name, against the allowlist` connect `Channel Contract and Preload Seam` to `Haiky Renderer Creature`, `Main Process Orchestration`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `Q: Which exported symbols in src/main are dead, and is any of it a real defect?` connect `Voice Runtime, Ledger and Store` to `Haiky Renderer Creature`, `Main Process Orchestration`, `Overlay Window Geometry`, `Claude Code Hook Installer`, `Session File Watcher`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `Act Table (one act per reply)` connect `Channel Contract and Preload Seam` to `Creature Identity and Voice`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Q: Which creature physics crossed into main, which stayed in the DOM, and what decided the split` (e.g. with `haiky:ink — where the ink is, renderer to main` and `Click-Through Window (WS_EX_TRANSPARENT)`) actually correct?**
  _`Q: Which creature physics crossed into main, which stayed in the DOM, and what decided the split` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `{ contextBridge, ipcRenderer }`, `{ app }`, `fs` to the rest of the system?**
  _100 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Channel Contract and Preload Seam` be split into smaller, more focused modules?**
  _Cohesion score 0.0696969696969697 - nodes in this community are weakly interconnected._
- **Should `Voice Runtime, Ledger and Store` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._