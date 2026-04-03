# Architecture Decision Records

## ADR-001: Electron + Next.js Static Export as the Application Shell

**Context:** The IDE needs to run as a desktop application with full filesystem access, process spawning (git, terminal), and secure API key storage — none of which are available in a browser-only deployment. At the same time, the UI is a rich React application that benefits from component-driven development and hot reload during development.

**Decision:** Use Electron as the desktop container and Next.js as the UI framework, with Next.js configured for static export (`next build` → `out/`). In production, a local HTTP server in the main process serves the static files on a random port, avoiding the `file://` protocol which breaks absolute asset paths (`/_next/...`). In development, the renderer loads directly from `localhost:3001`.

**Trade-offs:**
- *Gained:* Full native capabilities (file I/O, process spawning, system tray) alongside a modern React development experience. Static export eliminates the need for a Node.js server at runtime.
- *Given up:* Electron's ~150MB binary size. No server-side rendering — but an IDE doesn't need SEO. The local HTTP server adds a process, but ensures dev/prod parity.
- *Risk accepted:* macOS code-signing and DMG packaging is fragile (evidenced by 7 build-fix commits). Electron version updates require careful testing.

**Status:** Accepted

---

## ADR-002: IPC as the Security Boundary for Privileged Operations

**Context:** The IDE handles sensitive data — API keys for LLM providers, filesystem access, and shell command execution. In Electron, the renderer process is essentially a Chromium tab. Any data accessible to the renderer is visible in DevTools.

**Decision:** All privileged operations route through the Electron main process via `ipcMain.handle()` / `ipcRenderer.invoke()`. The preload script exposes a controlled `window.electronAPI` surface (37 methods). LLM API calls go through `llm:chat` in the main process — API keys never appear in the renderer. Git commands use `execFile` (not `execSync` with shell interpolation) to prevent command injection. The static file server validates paths against traversal attacks.

**Trade-offs:**
- *Gained:* API keys cannot be extracted from DevTools. Shell injection is mitigated. File operations are sandboxed to user-initiated paths.
- *Given up:* Every operation is asynchronous (IPC hop adds ~1-2ms). Cannot use synchronous filesystem APIs in the renderer. Browser-mode fallback for LLM calls does expose keys in DevTools, but this only applies during `next dev` for developer testing.
- *Risk accepted:* The preload bridge is a wide surface (37 methods). Each new feature requires adding IPC handlers in three places (main, preload, renderer).

**Status:** Accepted

---

## ADR-003: Zustand with Domain Slices over Redux or Context API

**Context:** The IDE manages state across 6 distinct domains: file management, git status, LLM providers, learning progress, UI state, and editor settings. Cross-component state sharing is frequent — the footer reads git state, the header reads learning progress, the editor reads file state and provider config simultaneously.

**Decision:** Use Zustand (5.6KB) with a slice composition pattern. Six slice creators (`createFileSlice`, `createGitSlice`, etc.) are composed into a single store via type intersection. The store uses `persist` middleware with explicit `partialize` to save only durable state (settings, progress, providers) while excluding ephemeral state (files, git, toasts). Schema migrations handle version upgrades.

**Trade-offs:**
- *Gained:* Minimal boilerplate — actions are plain methods, no reducers or dispatch. Each slice can be tested independently. The composed store provides a single import for consumers (`useIDEStore`), so no component needs to know about the slice architecture.
- *Given up:* No built-in devtools (Redux DevTools is more mature). Slice creators must use the full `IDEStoreState` type parameter to access cross-domain state, which leaks the composition abstraction slightly.
- *Risk accepted:* localStorage persistence has a migration chain (currently at version 3). Breaking changes in the persisted shape require careful migration logic.

**Status:** Accepted

---

## ADR-004: Multi-Provider LLM Routing with Priority-Based Fallback

**Context:** Users may want to use local AI (Ollama), cloud APIs (OpenAI-compatible, Anthropic), or a combination. Provider availability is unpredictable — local services may not be running, cloud APIs may rate-limit, and API keys may expire. The IDE should not be locked to any single vendor.

**Decision:** Users configure an ordered list of providers. The `routeChat` function tries each enabled provider in priority order. If one fails (network error, auth failure, timeout), it falls back to the next. Three protocol handlers cover the LLM ecosystem: Ollama's `/api/chat`, OpenAI's `/chat/completions` (used by Groq, Together AI, OpenRouter, and others), and Anthropic's `/messages`. Provider presets are neutral — listed by API type, not brand name.

**Trade-offs:**
- *Gained:* Zero vendor lock-in. Users can mix free local providers with cloud fallbacks. The routing is transparent — a log callback reports which provider was tried and why it failed.
- *Given up:* No intelligent routing (e.g., choosing the cheapest provider for simple queries, the most capable for complex ones). No streaming support — responses are returned as complete blocks.
- *Risk accepted:* Token estimation uses a rough heuristic (`text.length / 4`) when providers don't return usage data. This affects cost tracking accuracy.

**Status:** Accepted

---

## ADR-005: Learning Content Hardcoded as TypeScript Data

**Context:** The IDE targets beginners who may have never seen a code editor. It needs structured educational content — lessons with code examples, a glossary of 60+ terms, interactive tutorials, and a demo project. This content must be versioned with the IDE to stay in sync with UI changes (e.g., when a button moves, the tutorial referencing it must update).

**Decision:** All learning content is stored as TypeScript constants in `src/data/` — lessons, glossary entries, tutorials, and demo project files. Lessons reference specific files and line ranges in the demo project. The content is imported directly by components, with no external CMS, API, or database.

**Trade-offs:**
- *Gained:* Content is version-controlled alongside the code it teaches. Works fully offline. No authentication, hosting, or synchronization complexity. TypeScript types enforce content structure (every lesson must have `steps`, every glossary entry must have `relatedTerms`).
- *Given up:* Content updates require a code change and rebuild. No A/B testing, no contributor-friendly editing workflow (non-developers can't easily edit TypeScript files). Content size adds to the bundle (~77KB).
- *Risk accepted:* If the IDE grows to support many languages or curricula, the hardcoded approach may not scale. A migration to JSON config files or a headless CMS would be needed.

**Status:** Accepted

---

## ADR-006: Git Integration via Process Spawning, Not Library Binding

**Context:** The IDE needs full git functionality — status, stage, commit, push, pull, branch management, stash, and log. Two approaches exist: (1) spawn `git` as a child process and parse output, or (2) use a JavaScript git library like `isomorphic-git` or `nodegit`.

**Decision:** Spawn the system `git` binary via `execFile` (for simple commands) and `spawn` (for streaming output and stdin). A helper function `gitExec(args, dirPath, timeout)` wraps `execFile` with consistent error handling. Git commands run in the Electron main process and return structured data via IPC.

**Trade-offs:**
- *Gained:* Full compatibility with any git version the user has installed. Supports SSH and HTTPS authentication configured at the OS level (SSH agent, credential manager). No native C++ bindings to compile (nodegit is notoriously fragile). Works with any git extension or hook.
- *Given up:* Requires git to be installed on the user's machine. Command output must be parsed (e.g., `git status --porcelain`). No programmatic access to git internals (packfiles, refs database).
- *Risk accepted:* Shell execution has inherent risks. Mitigated by using `execFile` (no shell interpolation) and passing arguments as arrays, not concatenated strings.

**Status:** Accepted

---

## ADR-007: Polling for Git State Instead of File Watchers

**Context:** Git state (branch, changed files, ahead/behind counts) can change at any time — the user may run git commands in an external terminal, another tool may modify files, or a background process may create new files. The IDE needs to reflect current git state without requiring the user to manually refresh.

**Decision:** A custom React hook (`useGitPolling`) queries the full git state every 5 seconds via IPC. It fetches branch, file status, branch list, remote status, log, and stash count in a single `Promise.all` call. Polling only occurs when the window is focused, reducing resource usage when the IDE is in the background. Imperative `refresh()` calls are triggered after mutations (commit, push, pull).

**Trade-offs:**
- *Gained:* Simple, cross-platform, and reliable. No native file watcher dependencies (chokidar, fsevents). Catches changes made outside the IDE. Focus-gating reduces unnecessary IPC calls.
- *Given up:* Up to 5 seconds of latency for external changes. 6 IPC calls every 5 seconds adds CPU overhead on large repositories.
- *Risk accepted:* On very large repos (100K+ files), `git status --porcelain` may take >1 second, creating noticeable UI delay. Future optimization: debounce or increase interval for large repos.

**Status:** Accepted

---

## ADR-008: Pure Function Extraction for Graph Generation

**Context:** The blueprint view converts a flat list of files into a visual node graph. The logic involves directory grouping, overflow merging, category fallbacks, icon mapping, and import-based edge detection via regex scanning. Originally, all of this logic (~230 lines) lived inside `BlueprintCanvas.tsx`, making the component 557 lines and difficult to test.

**Decision:** Extract all graph generation logic into `src/lib/blueprint/graphBuilder.ts` as pure functions. These functions take `FileEntry[]` as input and return `Node[]` and `Edge[]` — no React state, no side effects, no store access. The component calls them via `useMemo` and handles only rendering and user interaction.

**Trade-offs:**
- *Gained:* Graph logic is independently testable with mock file arrays. Component reduced from 557 to ~270 lines. Logic can be reused if other views need graph data. Pure functions are easier to profile for performance.
- *Given up:* Additional file and import path. Functions must be kept in sync with ReactFlow's `Node` and `Edge` types.
- *Risk accepted:* The regex-based import scanner (`/from\s+['"]([^'"]+)['"]/g`) is a heuristic — it doesn't handle dynamic imports, re-exports, or non-JS/TS files. For the blueprint's purpose (showing architectural relationships), this is sufficient.

**Status:** Accepted

---

## Design Philosophy

The Neon Protocol IDE is designed around the belief that software should be understood architecturally before it's understood syntactically. Most development tools start with a file tree and expect users to build a mental model of how pieces connect. This IDE inverts that: it starts with a visual map of the system, then lets users drill into code with that context already established. For beginners, this reduces the cognitive leap from "I see files" to "I understand how my app works."

The technical architecture reflects a deliberate set of constraints. There is no backend server — the IDE runs entirely as a desktop application with a static frontend. This means every feature (AI, git, terminal, file management) must work through Electron's IPC bridge, which doubles as the security boundary. API keys never leave the main process. Git commands run via the system binary, not a JavaScript reimplementation. The terminal spawns real OS shells. These choices trade convenience for trust: users can connect their own AI providers, edit their own files, and push to their own repositories without routing through any third-party service.

The product is also designed to grow with its user. A beginner sees longer labels, guided tutorials, inline glossary terms, and a structured lesson path. An experienced developer sees abbreviated controls, no scaffolding, and direct access to every feature. The learning content is versioned alongside the IDE itself — when a button moves, the tutorial that references it updates in the same commit. This tight coupling is intentional: the IDE doesn't just teach coding concepts, it teaches itself.
