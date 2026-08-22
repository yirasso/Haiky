# Graph Report - Haiky  (2026-08-22)

## Corpus Check
- 29 files · ~64,492 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 416 nodes · 697 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `049060b1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- haiky:talk — a question and the moment around it
- src/main/mascot.js
- overlay.js
- src/renderer/mascot.js
- Creature Identity and Voice
- Origin Renderer Creature
- Main Process Orchestration
- package.json
- Electron Build Config
- shoot.js
- hooks.js
- Origin Mascot Agent Runtime
- sessions.js
- Loopback Hook Bridge Server
- Tray Icon Generator
- Renderer Glue and Spend Display
- Intent Router
- Eye Clipping and Gaze
- .mas-w layer (snapshot)
- shoot-preload.js

## God Nodes (most connected - your core abstractions)
1. `Q: Which exported symbols in src/main are dead, and is any of it a real defect?` - 20 edges
2. `draw()` - 19 edges
3. `draw()` - 17 edges
4. `The Seam — eleven named channels in preload.js` - 17 edges
5. `Q: Which creature physics crossed into main, which stayed in the DOM, and what decided the split` - 13 edges
6. `build` - 11 edges
7. `tellInk()` - 11 edges
8. `Q: Why can no static tool see how Haiky's renderer talks to main, and what fixes it?` - 11 edges
9. `wake()` - 10 edges
10. `paintTray()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `The Renderer Never require()s Anything` --conceptually_related_to--> `tellInk()`  [INFERRED]
  CLAUDE.md → src/renderer/mascot.js
- `Q: Which exported symbols in src/main are dead, and is any of it a real defect?` --cites--> `get()`  [EXTRACTED]
  graphify-out/memory/query_20260822_174328_which_exported_symbols_in_src_main_are_dead__and_i.md → src/main/overlay.js
- `Act Table (one act per reply)` --semantically_similar_to--> `Origin Act Table (settings, usage, skills, new-session, files, terminal, theme)`  [INFERRED] [semantically similar]
  MASCOT.md → vendor/removed-snapshot/MASCOT.md
- `Reply Shape (say / act / name / remember / drop)` --semantically_similar_to--> `Origin Reply Shape (say / act / name / remember / drop)`  [INFERRED] [semantically similar]
  MASCOT.md → vendor/removed-snapshot/MASCOT.md
- `pointer-events none on the layer, auto on the ink` --semantically_similar_to--> `Click-Through Window (WS_EX_TRANSPARENT)`  [INFERRED] [semantically similar]
  vendor/removed-snapshot/README.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **The four deliberately independent parts of Haiky** — readme_sessions_watcher, readme_bridge, readme_hooks, readme_overlay [EXTRACTED 1.00]
- **The hit-test loop: ink up, decision in main, window flag out** — src_renderer_mascot_tellink, ipc_haiky_ink, src_main_overlay_at, src_main_overlay_pollcursor, src_main_overlay_setignore [EXTRACTED 1.00]
- **Awaited upward: the four questions the page cannot answer** — ipc_haiky_act, ipc_haiky_talk, ipc_haiky_ready, ipc_haiky_settings_get [EXTRACTED 1.00]
- **Pushed downward: the five facts main owns** — ipc_haiky_run, ipc_haiky_place, ipc_haiky_sessions, ipc_haiky_cursor, ipc_haiky_settings [EXTRACTED 1.00]
- **What a port must re-point: PERCH, ACT, WANTS, the run signal and the CSS tokens** — vendor_origin_snapshot_readme_perch, vendor_origin_snapshot_readme_act, vendor_origin_snapshot_readme_wants, vendor_origin_snapshot_readme_body_data_run, vendor_origin_snapshot_readme_css_tokens [EXTRACTED 1.00]
- **The voice pipeline: ask box, free router, model, reply shape** — src_renderer_overlay_mas_ask, readme_intents, readme_main_mascot, mascot_reply_shape, readme_act_permission_list [INFERRED 0.85]

## Communities (20 total, 1 thin omitted)

### Community 0 - "haiky:talk — a question and the moment around it"
Cohesion: 0.08
Nodes (29): CSS Is Not a graphify File Type (mascot.css is invisible to the graph), Claude Code Signal Pipeline (sessions.js, bridge.js, hooks.js), The MASCOT.md Promise Is Kept By Not Sending, haiky:talk — a question and the moment around it, What Never Crosses (no path, no transcript, no code), Act Table (one act per reply), confused — the honest act, Creature Memory (remember / drop) (+21 more)

### Community 1 - "src/main/mascot.js"
Cohesion: 0.08
Nodes (40): Never Bump a DOCS version Casually, Q: Which exported symbols in src/main are dead, and is any of it a real defect?, The Weekly Ledger Never Rolls Over, EVENTS, ACTS, { app }, bill(), character() (+32 more)

### Community 2 - "overlay.js"
Cohesion: 0.07
Nodes (55): build/ Is Not Scanned — Source Belongs in tools/, Comments Explain Why, Not What, Graphify Query-First Convention, Haiky - Electron Creature on a Click-Through Taskbar Overlay, Read IPC.md Before Crossing the Preload, The Renderer Never require()s Anything, Tray Icons Drawn From the Creature's Superellipse, Vendor Snapshot Is Read Only (+47 more)

### Community 3 - "src/renderer/mascot.js"
Cohesion: 0.16
Nodes (28): askSomething(), bubble(), choose(), draw(), eyePath(), fling(), goTo(), grab() (+20 more)

### Community 4 - "Creature Identity and Voice"
Cohesion: 0.07
Nodes (31): Cannot Read Code, Files or Transcript, Company, Not a Colleague, European Portuguese Mirroring, The Creature (Haiky system prompt), extraResources / asar exclusion for the Claude Code binary, Haiky, Three Router Guards (length, question mark, anchored patterns), intents.js — free regex router for body imperatives (+23 more)

### Community 5 - "Origin Renderer Creature"
Cohesion: 0.15
Nodes (23): askSomething(), bubble(), caretPoint(), choose(), draw(), eyePath(), goTo(), grab() (+15 more)

### Community 6 - "Main Process Orchestration"
Cohesion: 0.14
Nodes (24): ACT, { app, Tray, Menu, dialog, nativeImage, nativeTheme, globalShortcut, ipcMain, shell }, applyAutostart(), askToInstall(), autostartOn(), backupDir(), bridge, buildTray() (+16 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (22): @anthropic-ai/claude-agent-sdk, electron, electron-builder, author, dependencies, @anthropic-ai/claude-agent-sdk, description, devDependencies (+14 more)

### Community 8 - "Electron Build Config"
Cohesion: 0.10
Nodes (21): build, appId, asar, asarUnpack, directories, extraResources, files, npmRebuild (+13 more)

### Community 9 - "shoot.js"
Cohesion: 0.18
Nodes (8): { app, BrowserWindow }, fs, OUT, PAGE, path, place, ROOT, SHOTS

### Community 10 - "hooks.js"
Cohesion: 0.24
Nodes (17): backup(), exists(), FILE, fs, handler(), install(), mine(), os (+9 more)

### Community 11 - "Origin Mascot Agent Runtime"
Cohesion: 0.18
Nodes (18): ACTS, { app }, character(), executable(), forget(), fs, keep(), load() (+10 more)

### Community 12 - "sessions.js"
Cohesion: 0.20
Nodes (16): alive(), current, DIR, drop(), fs, key(), later(), listeners (+8 more)

### Community 13 - "Loopback Hook Bridge Server"
Cohesion: 0.17
Nodes (14): crypto, handle(), http, lapses, listen(), loopback(), publish(), RANK (+6 more)

### Community 14 - "Tray Icon Generator"
Cohesion: 0.22
Nodes (9): app, chunk(), crc(), crcTable, fs, out, path, png() (+1 more)

### Community 15 - "Renderer Glue and Spend Display"
Cohesion: 0.43
Nodes (6): money(), paintSpend(), pfMascot, put(), short(), tokens()

### Community 16 - "Intent Router"
Cohesion: 0.38
Nodes (6): match(), pick(), READY, TABLE, turn, wrap()

### Community 17 - "Eye Clipping and Gaze"
Cohesion: 0.50
Nodes (4): #mas-cut clipPath (eye trimming), The Gaze Is Expressive, Not Optical, Eyes Were Holes, Now Filled and Clipped, #mas-cut clipPath (snapshot; was a mask until Aug 2026)

### Community 18 - ".mas-w layer (snapshot)"
Cohesion: 0.29
Nodes (8): The Double </svg> Fix, .mas-w layer, One Defect Carried Across On Purpose, pointer-events none on the layer, auto on the ink, Every Pose Samples at the Same 64 Angles, The Duplicated </svg> Close Tag, .mas-fx — dots and question mark (snapshot), .mas-w layer (snapshot)

## Knowledge Gaps
- **110 isolated node(s):** `name`, `version`, `description`, `main`, `author` (+105 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `preload.js` (2× useful, score=1.996993672)
- `tellInk()` (2× useful, score=1.996993672)
- `Hit Test Lives in Main (30Hz cursor poll)` (2× useful, score=1.996360967) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `haiky:act — an act by name, against the allowlist` connect `overlay.js` to `haiky:talk — a question and the moment around it`, `src/renderer/mascot.js`, `Main Process Orchestration`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `Q: Which exported symbols in src/main are dead, and is any of it a real defect?` connect `src/main/mascot.js` to `overlay.js`, `src/renderer/mascot.js`, `Main Process Orchestration`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `Act Table (one act per reply)` connect `haiky:talk — a question and the moment around it` to `overlay.js`, `Creature Identity and Voice`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Q: Which creature physics crossed into main, which stayed in the DOM, and what decided the split` (e.g. with `Q: Why the Origin packing list bridges Creature Identity to Click-Through Overlay Physics` and `haiky:ink — where the ink is, renderer to main`) actually correct?**
  _`Q: Which creature physics crossed into main, which stayed in the DOM, and what decided the split` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _110 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `haiky:talk — a question and the moment around it` be split into smaller, more focused modules?**
  _Cohesion score 0.07881773399014778 - nodes in this community are weakly interconnected._
- **Should `src/main/mascot.js` be split into smaller, more focused modules?**
  _Cohesion score 0.080338266384778 - nodes in this community are weakly interconnected._