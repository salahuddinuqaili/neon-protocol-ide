# Handoff — v1.4 polish

**Branch:** `feat/v1.4-polish` (3 commits, **not pushed**)
**Baseline:** `npx tsc --noEmit` clean, `npx vitest run` 102 passing, `npx next build` succeeds.

The work started from a multi-agent audit of the **packaged** app (42 agents, 28 confirmed
bugs after adversarial verification). Almost every serious defect was invisible in
`npm run dev` and only appeared in the shipped build — that is why the app looked fine
locally while being broken for users.

---

## Verify this first

The `app://` protocol change (below) is the one edit that has **not** been confirmed at
runtime. A probe script exists but was never run to completion:

```
npx electron <scratchpad>/protocol-probe.js
```

It loads `out/` through the real production path twice and prints origin, whether the UI
rendered, whether the icon font loaded, bridge key count, and whether `localStorage`
survived. Recreate it if needed — it boots a `BrowserWindow` against
`src/electron/appProtocol.js` and `APP_INDEX`. **Run `npx next build` first.**

If `app://` misbehaves, the fallback is a deterministic port (e.g. 47821) persisted in
`app.getPath('userData')`. The requirement is only that the origin never changes.

---

## Fixed and verified

| Bug | Effect before |
|---|---|
| `require('os')` in preload | Sandboxed preload threw, `window.electronAPI` **undefined** — terminal, git, saving and cloud AI all silently dead in the packaged app. Verified fixed: bridge now exposes 44 keys. |
| Ephemeral server port | New origin each launch wiped `localStorage`; onboarding replayed and AI providers vanished on every restart. Replaced with `app://` (no port). |
| Google Fonts from CDN | All 162 icons rendered as literal words ("settings", "cloud_off") offline. Now self-hosted; icon font subset 3,867 KB → 106 KB. |
| No Electron `Menu` | On macOS Cmd+C/V/X/Q did not work at all (those come from menu roles). |
| Ctrl-only shortcuts | Every shortcut including Save was dead on macOS. |
| Delete / Rename | Only mutated the store — the file stayed on disk and reappeared. Now uses fs IPC, deletes to OS trash. |
| Focus trap | Re-ran on every render; git polling every 10s yanked focus out of whatever you were typing, including the API key field. |
| Monaco Ctrl+S | Registered once with a stale closure — saved the **wrong file** with **stale content**. |
| Blueprint map | `split('/')[0]` on absolute paths = `"C:"`, so the map collapsed to 4 generic boxes with no edges. Also rebuilt on every keystroke and never rebuilt on project change. |
| Window close | Unsaved changes vetoed close with no prompt — Task Manager was the only exit. |
| Terminal | `spawn` had no `error` listener; an unspawnable shell crashed the whole main process. Children were never reaped on quit. |

Guard tests added: `preload-sandbox`, `icon-manifest`, `useFocusTrap`, `useFileActions`,
`graphBuilder`. Icon names are now typed as `IconName`, so an unbundled glyph fails `tsc`.

---

## Remaining confirmed bugs

All were verified by an adversarial pass. File:line refer to pre-fix positions.

### Git (a core flow, all still broken)
1. **C5 — stale files after git operations.** `BranchSwitcher.tsx:28`. Checkout, pull,
   stash and discard never re-read files from disk, so the editor keeps the old branch's
   content and the next save writes it back over the new branch. Add a `reloadProject()`
   that re-runs `scanProject` and merges content back, resetting `isDirty`.
2. **H6 — remote branch checkout detaches HEAD.** `BranchSwitcher.tsx:123`. Clicking a
   remote-only branch runs `git checkout origin/<name>`, silently detaching HEAD while
   showing a green success toast. Should create a tracking branch.
3. **H7 — non-ASCII filenames break Source Control.** `ipc/git.js:50`. Names come back
   mangled and stage/unstage/discard/diff all fail. Use `-z` and handle git's quoting.
4. **H8 — staged+modified files lose the newest edit.** `ipc/git.js:56`. A file that is
   both staged and modified shows only under "Ready to Commit", so the user's latest edit
   is silently left out of the commit.
5. **M2 — discard on an untracked file** fails with a raw git pathspec error, after an
   irreversible-sounding confirmation. `ipc/git.js:188`.

### AI / LLM
6. **H11 + H14 — real provider errors are swallowed.** `lib/llm/provider.ts:108`.
   `routeChat` discards each provider's actual error, so the copilot only ever says
   "All providers failed" and the error-translation cards never fire. This makes every AI
   misconfiguration undiagnosable.
7. **H9 — Ollama pull reports success on failure.** `ipc/ollama.js:147`. Shows 100% and
   "pulled successfully" even when the pull failed.
8. **H10 — "Get Demo Model" never assigns the model** it just pulled to the provider it
   just created (stale closure). `OrchestrationHub.tsx:308`.
9. **M3 — Anthropic capped at 1024 output tokens** with no truncation handling, so
   explanations cut off mid-sentence. `ipc/llm.js:41`.

### Onboarding / UX
10. **H12 — the recommended beginner path cannot save.** `WelcomeScreen.tsx:12`. The demo
    project has a synthetic path, so every Ctrl+S on it reports "Failed to save". This is
    the first thing a new user is steered into.
11. **H15 — terminal error cards never appear.** `TerminalPanel.tsx:72`. stderr is routed
    to the plain output stream and never translated, so `errorTranslator` and `ErrorCard`
    are effectively dead code.
12. **M1 — toggling the copilot panel wipes the conversation** and silently re-sends the
    last "Explain This" request. `CopilotPanel.tsx:40`.

### Not from the audit
13. **Whole-store subscriptions.** All 25 components call `useIDEStore()` with no selector,
    so every store change re-renders the entire UI — including Monaco, ReactFlow and the
    terminal. Git polling fires one every 10s. Convert at least the heavy components to
    selectors; this was the root cause that made the focus-trap bug so damaging.
14. **README version badge** says 1.3.7 while `package.json` is 1.3.8.

---

## Product direction (decided this session)

- **Keep the architecture map**, but make it earn its place as a real navigation tool —
  click a node to open the file, real import edges, filter by layer. Fixing the path bug
  above was the precondition; the map genuinely did not work before.
- **Fix bugs + rebuild the UI shell** (layout, navigation, onboarding, visual design)
  while keeping the working internals (IPC, store, git, LLM routing).

## Release checklist (not started)

1. Work through the remaining bugs above.
2. `git status` → commit everything, then `npx tsc --noEmit`, `npx vitest run`, `npx next build`.
3. Bump `package.json` version (electron-builder names installers from it) and the README badge.
4. `git push -u origin feat/v1.4-polish`, open a PR to `master`, merge.
5. `gh workflow run build-installers.yml --ref master` to smoke-test both installers.
6. Tag `vX.Y.Z` and push the tag — releases only trigger on `v*`.
