# CLAUDE.md — Project Instructions for Claude Code

## Pre-Push Checklist

**Run these before every push. All must pass or the CI pipeline will fail.**

```bash
# 0. Verify ALL modified files are staged — local checks pass against your working tree,
#    but CI only sees committed files. Unstaged changes = green locally, red in CI.
git status

# 1. TypeScript — catches type errors
npx tsc --noEmit

# 2. Tests — catches store regressions, LLM routing bugs, SSR safety violations
npx vitest run

# 3. Build — catches SSR errors (window is not defined, missing exports)
npx next build
```

**Commit before you check, not after.** The local pre-push checks (`tsc`, `vitest`, `next build`) run against your working tree, which includes uncommitted files. CI only builds what's been committed and pushed. Always `git status` first — if files are unstaged, commit them before running the checks and pushing. This prevents the "passes locally, fails in CI" trap.

The CI runs `next build` + `electron-builder` on both macOS and Windows. If `next build` fails locally, the release will fail. Releases only trigger on `v*` tags. For test builds from any branch, use `gh workflow run build-installers.yml --ref <branch>` — artifacts are downloadable from the Actions tab without creating a release.

### The SSR Rule

**Never access `window` at component body scope.** Next.js pre-renders pages on the server where `window` doesn't exist. This broke v1.3.1.

```typescript
// BAD — breaks SSR
const MyComponent = () => {
  const api = (window as any).electronAPI;  // ReferenceError during next build
};

// GOOD — guarded
const MyComponent = () => {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : undefined;
};

// ALSO GOOD — inside a hook (only runs client-side)
const MyComponent = () => {
  useEffect(() => {
    const api = (window as any).electronAPI;
  }, []);
};
```

The `src/test/__tests__/ssr-safety.test.ts` test scans for unguarded `electronAPI` access and will fail if any are found.

## Project Architecture

- **Electron** main process (`index.js`) wires up modular IPC handlers from `src/electron/ipc/` (fs, git, terminal, llm, ollama, system)
- **Preload bridge** (`src/electron/preload.js`) exposes ~44 IPC methods as `window.electronAPI`
- **Next.js** renders the UI as a static export (`out/`), served via local HTTP server in production
- **Zustand** store is split into 6 slices in `src/store/slices/` — composed in `useIDEStore.ts`
- **Config maps** live in `src/config/` — language mappings, git colors, icons, provider presets, education text

## Key Patterns

### IPC Security
All LLM API calls go through `llm:chat` in the main process. API keys never appear in the renderer. Git commands use `execFile` (not shell strings) to prevent injection. Browser-mode fallback exists for `npm run dev`.

### State Persistence
Only durable state is persisted to localStorage (settings, providers, learning progress). Files, git state, toasts are ephemeral. Schema version is 3 — migrations in `useIDEStore.ts`.

### Provider Neutrality
No specific cloud providers are recommended. Presets are by API type: Local (Ollama), OpenAI-compatible, Anthropic-compatible. No brand names in UI copy.

### Learning Content
Lessons, glossary, tutorials are TypeScript constants in `src/data/`. Content references demo project files in `src/data/demoProject.ts`. Changes to lesson files must match `codeHighlight` line ranges.

## File Structure

```
src/
  components/     13 directories (blueprint, editor, git, terminal, layout, learning, etc.)
  config/         5 config files (languages, git, icons, providers, education)
  data/           4 content files (lessons, glossary, tutorials, demoProject)
  hooks/          useGitPolling, useFocusTrap
  lib/            llm/provider.ts (IPC-first routing), blueprint/graphBuilder.ts (pure functions)
  store/          useIDEStore.ts + 6 slices (file, git, llm, learning, ui, editorChat)
  types/          index.ts (all interfaces)
  test/           setup.ts, helpers.ts, __tests__/ssr-safety.test.ts
```

## Common Tasks

### Cross-cutting changes — commit atomically

Features that span layers (IPC handler + preload + types + store + UI) must be committed together. Local checks run against the working tree and will pass with uncommitted files, but CI only sees what's pushed. Run `git status` before pushing to verify nothing is left unstaged.

### Adding a new IPC handler
1. Create or extend a handler file in `src/electron/ipc/` (e.g. `ollama.js`, `system.js`)
2. Register in `index.js`: `const { registerXHandlers } = require('./src/electron/ipc/x'); registerXHandlers();`
3. Expose in `src/electron/preload.js`: `methodName: (...) => ipcRenderer.invoke(...)`
4. Add types in `src/types/electron.d.ts`
5. Call in renderer: `(window as any).electronAPI.methodName(...)` — always guard with `typeof window`

### Adding a new store slice
1. Create `src/store/slices/newSlice.ts` with interface + creator
2. Add to composition in `useIDEStore.ts`
3. Add types to `src/types/index.ts` (IDEState interface)
4. If persisted, add fields to `partialize` and bump version + migration

### Adding learning content
1. Lessons go in `src/data/lessons.ts` — must have `category` matching a `LessonCategory`
2. Track info lives in `src/config/education.ts` (`TRACK_INFO`)
3. Glossary terms go in `src/data/glossary.ts`
4. Tutorials go in `src/data/tutorials.ts`

## Don't

- Don't access `window` at module or component body scope without `typeof window` guard
- Don't hardcode provider brand names in UI copy (keep neutral)
- Don't add config maps inside components — put them in `src/config/`
- Don't use `execSync` with string concatenation for shell commands — use `execFile` with argument arrays
- Don't persist ephemeral state (files, git, toasts) to localStorage
- Don't skip `next build` verification before pushing releases
- Don't assume `window.electronAPI` methods exist — browser mode (`npm run dev`) has no preload bridge; guard with `if (!api?.methodName) return`
