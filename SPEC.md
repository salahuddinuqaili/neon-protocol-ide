# SPEC: Fix Ollama Model Detection & Browser-Mode Model Pull

**Branch:** `fix/ollama-model-detection`
**Status:** Draft
**Created:** 2026-04-06

---

## Problem

### Bug 1: False "no models" message when models exist

**Symptom:** User sees "Ollama is running but has no models" even though Ollama is running with a model active.

**Root cause:** The model list fetch in `MainLayout.tsx:137-151` depends on `window.electronAPI.ollamaListModels` (IPC). In browser mode (`npm run dev`), `electronAPI` is undefined, so the `if (!api?.ollamaListModels) return` guard silently exits. The model list stays at its initial value (`[]`), and `OrchestrationHub.tsx:287` sees `availableOllamaModels.length === 0` and shows the false message.

Meanwhile, the Ollama *status* check at `MainLayout.tsx:154-173` uses a direct `fetch()` to `localhost:11434/api/version` — this works in both Electron and browser mode. So the app correctly detects Ollama is running, but never fetches its model list in browser mode.

**Location of display logic:** `OrchestrationHub.tsx:287`
```typescript
const showDemoOffer = ollamaStatus === 'active' && availableOllamaModels.length === 0 && ...
```

### Bug 2: "Model pull not available in browser mode"

**Symptom:** Clicking "Get Demo Model" or any model pull button shows an error toast.

**Root cause:** `OrchestrationHub.tsx:250` guards with `if (!api?.ollamaPullModel)` and returns early with an error toast. There is no browser-mode fallback for model pulling, even though Ollama's pull API is a local HTTP endpoint (`POST http://localhost:11434/api/pull`) that is reachable from the browser — same as the chat fallback already does for `POST /api/chat`.

---

## Solution

### Fix 1: Add browser-mode fallback for model listing

**File:** `src/components/layout/MainLayout.tsx` (lines 137-151)

When `electronAPI.ollamaListModels` is unavailable (browser mode), fall back to a direct `fetch` to `http://localhost:11434/api/tags`, parse the response, and call `setAvailableOllamaModels(models)`. This mirrors how the Ollama status check already works with a direct fetch.

```typescript
// When Ollama is active, fetch available models (and refresh every 30s)
useEffect(() => {
  if (typeof window === 'undefined') return;
  if (ollamaStatus !== 'active') return;

  const fetchModels = async () => {
    try {
      const api = window.electronAPI;
      if (api?.ollamaListModels) {
        const { models } = await api.ollamaListModels();
        setAvailableOllamaModels(models);
      } else {
        // Browser-mode fallback — direct HTTP to local Ollama
        const res = await fetch('http://localhost:11434/api/tags', {
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          const models = (data.models || []).map((m: any) => m.name || m.model);
          setAvailableOllamaModels(models);
        }
      }
    } catch {
      // Silently ignore — models stay as-is
    }
  };

  fetchModels();
  const interval = setInterval(fetchModels, 30000);
  return () => clearInterval(interval);
}, [ollamaStatus, setAvailableOllamaModels]);
```

### Fix 2: Add browser-mode fallback for model pulling

**File:** `src/components/orchestrator/OrchestrationHub.tsx` (lines 247-271)

When `electronAPI.ollamaPullModel` is unavailable, fall back to a direct `fetch` to `POST http://localhost:11434/api/pull` with streaming. Parse the streamed JSON lines to extract progress and update `setModelPullProgress`. On completion, re-fetch the model list using the same fallback from Fix 1.

```typescript
const handlePullModel = async (modelName: string) => {
  if (typeof window === 'undefined') return;
  const api = window.electronAPI;

  setModelPullProgress({ model: modelName, percent: 0, status: 'starting' });

  try {
    if (api?.ollamaPullModel) {
      // Electron path — IPC with streaming progress
      const cleanup = api.onOllamaPullProgress?.((data) => {
        setModelPullProgress(data);
      });
      try {
        await api.ollamaPullModel(modelName);
        const result = await api.ollamaListModels?.();
        if (result?.models) setAvailableOllamaModels(result.models);
      } finally {
        cleanup?.();
      }
    } else {
      // Browser-mode fallback — direct HTTP streaming
      const res = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true }),
        signal: AbortSignal.timeout(600000),
      });
      if (!res.ok) throw new Error(`Pull failed: ${res.status} ${res.statusText}`);
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              const percent = json.total ? (json.completed / json.total) * 100 : 0;
              setModelPullProgress({ model: modelName, percent, status: json.status || 'pulling' });
            } catch { /* skip malformed lines */ }
          }
        }
      }
      // Refresh model list via browser fallback
      const tagsRes = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(5000),
      });
      if (tagsRes.ok) {
        const data = await tagsRes.json();
        const models = (data.models || []).map((m: any) => m.name || m.model);
        setAvailableOllamaModels(models);
      }
    }

    addToast(`${modelName} pulled successfully`, 'success');
    // Auto-set model on existing empty Ollama provider
    const ollamaProvider = providers.find(p => p.type === 'ollama' && !p.model);
    if (ollamaProvider) updateProvider(ollamaProvider.id, { model: modelName });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    addToast(`Pull failed: ${msg}`, 'error');
  } finally {
    setModelPullProgress(null);
  }
};
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/layout/MainLayout.tsx` | Add browser fallback for model list fetch |
| `src/components/orchestrator/OrchestrationHub.tsx` | Add browser fallback for model pull with streaming |

## Testing

1. **Browser mode (`npm run dev`) with Ollama running + models pulled:**
   - Orchestrator should show existing models, NOT the "no models" prompt
2. **Browser mode with Ollama running + no models:**
   - "Get Demo Model" button should pull the model with progress bar (no error toast)
3. **Electron mode:** No change in behavior — IPC path is still preferred
4. **Ollama offline:** Both modes should show "offline" status — no regressions

## Not in Scope

- Ollama install fallback (requires OS-level operations — must stay IPC-only)
- Hardware detection fallback (requires Node.js child_process — must stay IPC-only)
