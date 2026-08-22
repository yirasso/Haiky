# Graph Report - Haiky  (2026-08-22)

## Corpus Check
- 32 files · ~51,330 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 394 nodes · 648 edges · 18 communities
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.84)
- Token cost: 177,132 input · 0 output

## Community Hubs (Navigation)
- Contract, Conventions and Hook Wiring
- Overlay Seam, Geometry and the Port
- Origin Mascot Agent Runtime
- Session File Watcher
- Loopback Hook Bridge Server
- Preferences Store
- Tray Icon Generator
- Renderer Glue and Spend Display
- Intent Router
- Haiky Renderer Creature
- Haiky Mascot Agent Runtime
- Origin Renderer Creature
- Main Process Orchestration
- Claude Code Hook Installer
- Package Manifest and Dependencies
- Electron Build Config
- Eye Clipping and Gaze
- Creature Identity and Voice

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
- `tellInk()` --conceptually_related_to--> `The Renderer Never require()s Anything`  [INFERRED]
  src/renderer/mascot.js → CLAUDE.md
- `Act Table (one act per reply)` --semantically_similar_to--> `Origin Act Table (settings, usage, skills, new-session, files, terminal, theme)`  [INFERRED] [semantically similar]
  MASCOT.md → vendor/removed-snapshot/MASCOT.md
- `Reply Shape (say / act / name / remember / drop)` --semantically_similar_to--> `Origin Reply Shape (say / act / name / remember / drop)`  [INFERRED] [semantically similar]
  MASCOT.md → vendor/removed-snapshot/MASCOT.md
- `The Creature (Haiky system prompt)` --semantically_similar_to--> `The Creature (Origin system prompt)`  [INFERRED] [semantically similar]
  MASCOT.md → vendor/removed-snapshot/MASCOT.md
- `writeRun()` --shares_data_with--> `haiky:run — run state, main to renderer`  [EXTRACTED]
  src/main/preload.js → IPC.md

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

### Community 0 - "Contract, Conventions and Hook Wiring"
Cohesion: 0.05
Nodes (54): writeRun(), readAuth(), { contextBridge, ipcRenderer }, .mas-fx — dots and question mark, .mas-say speech bubble, Graphify Query-First Convention, Claude Code Signal Pipeline (sessions.js, bridge.js, hooks.js), Tray Icons Drawn From the Creature's Superellipse (+46 more)

### Community 1 - "Overlay Seam, Geometry and the Port"
Cohesion: 0.08
Nodes (36): barRect(), layout(), strip(), create(), layout(), place_(), pollCursor(), send() (+28 more)

### Community 10 - "Origin Mascot Agent Runtime"
Cohesion: 0.18
Nodes (18): character(), executable(), forget(), keep(), load(), rollWeek(), situation(), state() (+10 more)

### Community 11 - "Session File Watcher"
Cohesion: 0.18
Nodes (16): alive(), drop(), key(), later(), read(), rescan(), soon(), start() (+8 more)

### Community 12 - "Loopback Hook Bridge Server"
Cohesion: 0.17
Nodes (14): handle(), listen(), loopback(), publish(), set(), start(), state(), worst() (+6 more)

### Community 13 - "Preferences Store"
Cohesion: 0.24
Nodes (11): fallback(), file(), flush(), load(), save(), write(), { app }, fs (+3 more)

### Community 14 - "Tray Icon Generator"
Cohesion: 0.22
Nodes (9): chunk(), crc(), png(), app, crcTable, fs, out, path (+1 more)

### Community 15 - "Renderer Glue and Spend Display"
Cohesion: 0.43
Nodes (6): money(), paintSpend(), put(), short(), tokens(), pfMascot

### Community 16 - "Intent Router"
Cohesion: 0.38
Nodes (6): match(), pick(), wrap(), READY, TABLE, turn

### Community 3 - "Haiky Renderer Creature"
Cohesion: 0.15
Nodes (28): askSomething(), bubble(), choose(), draw(), eyePath(), fling(), goTo(), grab() (+20 more)

### Community 4 - "Haiky Mascot Agent Runtime"
Cohesion: 0.12
Nodes (24): bill(), character(), executable(), forget(), keep(), ready(), rollWeek(), situation() (+16 more)

### Community 5 - "Origin Renderer Creature"
Cohesion: 0.15
Nodes (23): askSomething(), bubble(), caretPoint(), choose(), draw(), eyePath(), goTo(), grab() (+15 more)

### Community 6 - "Main Process Orchestration"
Cohesion: 0.14
Nodes (24): applyAutostart(), askToInstall(), autostartOn(), backupDir(), buildTray(), paintTray(), prefs(), refreshShown() (+16 more)

### Community 9 - "Claude Code Hook Installer"
Cohesion: 0.22
Nodes (18): backup(), exists(), handler(), install(), mine(), preview(), read(), readable() (+10 more)

### Community 7 - "Package Manifest and Dependencies"
Cohesion: 0.09
Nodes (21): author, dependencies, @anthropic-ai/claude-agent-sdk, description, devDependencies, electron, electron-builder, license (+13 more)

### Community 8 - "Electron Build Config"
Cohesion: 0.10
Nodes (21): build, appId, asar, asarUnpack, directories, extraResources, files, npmRebuild (+13 more)

### Community 17 - "Eye Clipping and Gaze"
Cohesion: 0.50
Nodes (4): #mas-cut clipPath (eye trimming), #mas-cut clipPath (snapshot; was a mask until Aug 2026), The Gaze Is Expressive, Not Optical, Eyes Were Holes, Now Filled and Clipped

### Community 2 - "Creature Identity and Voice"
Cohesion: 0.07
Nodes (31): .mas-ask input form, Companion Switch (#pf-mascot), Talk to the Creature shortcut row (⌘T), #chat-spend — the agent's spend ledger, #mas-spend — the creature's spend ledger, #masmenu — right-button menu with one Talk item, Deferred mascot.js script tag, intents.js — free regex router for body imperatives (+23 more)

## Knowledge Gaps
- **103 isolated node(s):** `{ contextBridge, ipcRenderer }`, `{ screen }`, `{ BrowserWindow, screen, ipcMain }`, `geometry`, `path` (+98 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `haiky:act — an act by name, against the allowlist` connect `Contract, Conventions and Hook Wiring` to `Haiky Renderer Creature`, `Main Process Orchestration`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `Act Table (one act per reply)` connect `Contract, Conventions and Hook Wiring` to `Creature Identity and Voice`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `The Creature (Haiky system prompt)` connect `Creature Identity and Voice` to `Contract, Conventions and Hook Wiring`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Q: Which creature physics crossed into main, which stayed in the DOM, and what decided the split` (e.g. with `haiky:ink — where the ink is, renderer to main` and `Click-Through Window (WS_EX_TRANSPARENT)`) actually correct?**
  _`Q: Which creature physics crossed into main, which stayed in the DOM, and what decided the split` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `{ contextBridge, ipcRenderer }`, `{ screen }`, `{ BrowserWindow, screen, ipcMain }` to the rest of the system?**
  _103 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Contract, Conventions and Hook Wiring` be split into smaller, more focused modules?**
  _Cohesion score 0.05185185185185185 - nodes in this community are weakly interconnected._
- **Should `Overlay Seam, Geometry and the Port` be split into smaller, more focused modules?**
  _Cohesion score 0.08048780487804878 - nodes in this community are weakly interconnected._