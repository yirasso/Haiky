# Graph Report - Haiky  (2026-08-22)

## Corpus Check
- Corpus is ~47,628 words - fits in a single context window. You may not need a graph.

## Summary
- 349 nodes · 518 edges · 20 communities (18 shown, 2 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.86)
- Token cost: 98,503 input · 0 output

## Community Hubs (Navigation)
- Creature Identity and Voice
- Haiky Renderer Creature
- Origin Renderer Creature
- Main Process Orchestration
- Reply Protocol and Hook Contract
- Electron Build Config
- Package Manifest and Dependencies
- Overlay Window Geometry
- Haiky Mascot Agent Runtime
- Claude Code Hook Installer
- Origin Mascot Agent Runtime
- Session File Watcher
- Click-Through Overlay Physics
- Loopback Hook Bridge Server
- Preferences Store
- Renderer Glue and Spend Display
- Intent Router
- Eye Clipping and Gaze
- Host Main Glue
- Preload IPC Bridge

## God Nodes (most connected - your core abstractions)
1. `draw()` - 19 edges
2. `draw()` - 17 edges
3. `build` - 11 edges
4. `paintTray()` - 10 edges
5. `wake()` - 10 edges
6. `wake()` - 9 edges
7. `Haiky — the Origin creature packed for porting` - 8 edges
8. `install()` - 7 edges
9. `remove()` - 7 edges
10. `tellInk()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `The Creature (Haiky system prompt)` --semantically_similar_to--> `The Creature (Origin system prompt)`  [INFERRED] [semantically similar]
  MASCOT.md → vendor/removed-snapshot/MASCOT.md
- `Act Table (one act per reply)` --semantically_similar_to--> `Origin Act Table (settings, usage, skills, new-session, files, terminal, theme)`  [INFERRED] [semantically similar]
  MASCOT.md → vendor/removed-snapshot/MASCOT.md
- `Company, Not a Colleague` --semantically_similar_to--> `Company, Not a Colleague (Origin)`  [INFERRED] [semantically similar]
  MASCOT.md → vendor/removed-snapshot/MASCOT.md
- `Reply Shape (say / act / name / remember / drop)` --semantically_similar_to--> `Origin Reply Shape (say / act / name / remember / drop)`  [INFERRED] [semantically similar]
  MASCOT.md → vendor/removed-snapshot/MASCOT.md
- `Precise Forgetting (numbered drop, or all)` --semantically_similar_to--> `Forgetting Names What to Forget`  [INFERRED] [semantically similar]
  MASCOT.md → vendor/removed-snapshot/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **The four deliberately independent parts of Haiky** — readme_sessions_watcher, readme_bridge, readme_hooks, readme_overlay [EXTRACTED 1.00]
- **The voice pipeline: ask box, free router, model, reply shape** — src_renderer_overlay_mas_ask, readme_intents, readme_main_mascot, mascot_reply_shape, readme_act_permission_list [INFERRED 0.85]
- **What a port must re-point: PERCH, ACT, WANTS, the run signal and the CSS tokens** — vendor_origin_snapshot_readme_perch, vendor_origin_snapshot_readme_act, vendor_origin_snapshot_readme_wants, vendor_origin_snapshot_readme_body_data_run, vendor_origin_snapshot_readme_css_tokens [EXTRACTED 1.00]

## Communities (20 total, 2 thin omitted)

### Community 0 - "Creature Identity and Voice"
Cohesion: 0.07
Nodes (32): Cannot Read Code, Files or Transcript, Company, Not a Colleague, European Portuguese Mirroring, The Creature (Haiky system prompt), extraResources / asar exclusion for the Claude Code binary, Haiky, Three Router Guards (length, question mark, anchored patterns), intents.js — free regex router for body imperatives (+24 more)

### Community 1 - "Haiky Renderer Creature"
Cohesion: 0.14
Nodes (28): askSomething(), bubble(), choose(), draw(), eyePath(), fling(), goTo(), grab() (+20 more)

### Community 2 - "Origin Renderer Creature"
Cohesion: 0.15
Nodes (23): askSomething(), bubble(), caretPoint(), choose(), draw(), eyePath(), goTo(), grab() (+15 more)

### Community 3 - "Main Process Orchestration"
Cohesion: 0.14
Nodes (24): ACT, { app, Tray, Menu, dialog, nativeImage, nativeTheme, globalShortcut, ipcMain, shell }, applyAutostart(), askToInstall(), autostartOn(), backupDir(), bridge, buildTray() (+16 more)

### Community 4 - "Reply Protocol and Hook Contract"
Cohesion: 0.09
Nodes (24): Act Table (one act per reply), confused — the honest act, Creature Memory (remember / drop), Moods (idle, watch, think, ask, happy, worry, fall, sleep, held), Precise Forgetting (numbered drop, or all), Reply Shape (say / act / name / remember / drop), ACT — the permission list in src/main/main.js, async: true on every hook (+16 more)

### Community 5 - "Electron Build Config"
Cohesion: 0.10
Nodes (21): build, appId, asar, asarUnpack, directories, extraResources, files, npmRebuild (+13 more)

### Community 6 - "Package Manifest and Dependencies"
Cohesion: 0.10
Nodes (20): @anthropic-ai/claude-agent-sdk, electron, electron-builder, author, dependencies, @anthropic-ai/claude-agent-sdk, description, devDependencies (+12 more)

### Community 7 - "Overlay Window Geometry"
Cohesion: 0.15
Nodes (15): barRect(), layout(), { screen }, strip(), at, { BrowserWindow, screen, ipcMain }, create(), geometry (+7 more)

### Community 8 - "Haiky Mascot Agent Runtime"
Cohesion: 0.17
Nodes (19): ACTS, { app }, bill(), character(), executable(), forget(), fs, keep() (+11 more)

### Community 9 - "Claude Code Hook Installer"
Cohesion: 0.22
Nodes (18): backup(), EVENTS, exists(), FILE, fs, handler(), install(), mine() (+10 more)

### Community 10 - "Origin Mascot Agent Runtime"
Cohesion: 0.18
Nodes (18): ACTS, { app }, character(), executable(), forget(), fs, keep(), load() (+10 more)

### Community 11 - "Session File Watcher"
Cohesion: 0.18
Nodes (16): alive(), current, DIR, drop(), fs, key(), later(), listeners (+8 more)

### Community 12 - "Click-Through Overlay Physics"
Cohesion: 0.13
Nodes (16): Click-Through Window (WS_EX_TRANSPARENT), The Double </svg> Fix, Hit Test Lives in Main (30Hz cursor poll), overlay.js — transparent click-through window, One Physics System (gravity, velocity, floor, ceiling, walls), sessions.js — session file watcher, Slime — squash and stretch about the heel, .mas-w layer (+8 more)

### Community 13 - "Loopback Hook Bridge Server"
Cohesion: 0.17
Nodes (14): crypto, handle(), http, lapses, listen(), loopback(), publish(), RANK (+6 more)

### Community 14 - "Preferences Store"
Cohesion: 0.22
Nodes (12): { app }, DOCS, fallback(), file(), flush(), fs, held, load() (+4 more)

### Community 15 - "Renderer Glue and Spend Display"
Cohesion: 0.43
Nodes (6): money(), paintSpend(), pfMascot, put(), short(), tokens()

### Community 16 - "Intent Router"
Cohesion: 0.38
Nodes (6): match(), pick(), READY, TABLE, turn, wrap()

### Community 17 - "Eye Clipping and Gaze"
Cohesion: 0.50
Nodes (4): #mas-cut clipPath (eye trimming), The Gaze Is Expressive, Not Optical, Eyes Were Holes, Now Filled and Clipped, #mas-cut clipPath (snapshot; was a mask until Aug 2026)

## Knowledge Gaps
- **100 isolated node(s):** `name`, `version`, `description`, `main`, `author` (+95 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `The Creature (Haiky system prompt)` connect `Creature Identity and Voice` to `Reply Protocol and Hook Contract`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Haiky — the Origin creature packed for porting` connect `Creature Identity and Voice` to `Click-Through Overlay Physics`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `.mas-w layer (snapshot)` connect `Click-Through Overlay Physics` to `Creature Identity and Voice`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _100 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Creature Identity and Voice` be split into smaller, more focused modules?**
  _Cohesion score 0.07258064516129033 - nodes in this community are weakly interconnected._
- **Should `Haiky Renderer Creature` be split into smaller, more focused modules?**
  _Cohesion score 0.14408602150537633 - nodes in this community are weakly interconnected._
- **Should `Main Process Orchestration` be split into smaller, more focused modules?**
  _Cohesion score 0.14333333333333334 - nodes in this community are weakly interconnected._