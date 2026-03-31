"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { LLMProviderConfig, ProviderType, ConnectionStatus } from '../../types';
import { routeChat, chatWithProvider } from '../../lib/llm/provider';
import ViewHint from '../onboarding/ViewHint';
import InlineDialog, { DialogConfig } from '../layout/InlineDialog';

type LogEntry = { msg: string; type: 'info' | 'primary' | 'ai' | 'error' };
type Tab = 'providers' | 'usage';

// --- Popular models by provider type ---
const POPULAR_MODELS: Record<string, { id: string; name: string; minRam?: number }[]> = {
  ollama: [
    { id: 'gemma2:2b', name: 'Gemma 2 2B (fast, small)', minRam: 4 },
    { id: 'phi3:mini', name: 'Phi-3 Mini 3.8B', minRam: 4 },
    { id: 'llama3.2:3b', name: 'Llama 3.2 3B', minRam: 4 },
    { id: 'mistral:7b', name: 'Mistral 7B', minRam: 6 },
    { id: 'llama3:8b', name: 'Llama 3 8B (recommended)', minRam: 8 },
    { id: 'codellama:7b', name: 'Code Llama 7B', minRam: 6 },
    { id: 'deepseek-coder:6.7b', name: 'DeepSeek Coder 6.7B', minRam: 6 },
    { id: 'qwen2:7b', name: 'Qwen 2 7B', minRam: 8 },
    { id: 'llama3:70b', name: 'Llama 3 70B (needs 48GB+)', minRam: 48 },
    { id: 'mixtral:8x7b', name: 'Mixtral 8x7B', minRam: 32 },
    { id: 'command-r:35b', name: 'Command R 35B', minRam: 24 },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o (latest, multimodal)' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (fast, cheap)' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (cheapest)' },
    { id: 'o1-preview', name: 'o1 Preview (reasoning)' },
    { id: 'o1-mini', name: 'o1 Mini (reasoning, cheaper)' },
  ],
  anthropic: [
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4 (most capable)' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (balanced)' },
    { id: 'claude-haiku-4-20250514', name: 'Claude Haiku 4 (fastest)' },
  ],
  'openai-compatible': [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Groq)' },
    { id: 'meta-llama/Llama-3-70b-chat-hf', name: 'Llama 3 70B (Together)' },
    { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral 7B (HuggingFace)' },
    { id: 'google/gemma-7b-it', name: 'Gemma 7B (HuggingFace)' },
    { id: 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO', name: 'Nous Hermes 2 Mixtral' },
    { id: 'deepseek-ai/deepseek-coder-33b-instruct', name: 'DeepSeek Coder 33B' },
    { id: 'codellama/CodeLlama-34b-Instruct-hf', name: 'Code Llama 34B' },
    { id: 'Qwen/Qwen2-72B-Instruct', name: 'Qwen 2 72B' },
    { id: 'microsoft/Phi-3-medium-128k-instruct', name: 'Phi-3 Medium 128K' },
  ],
};

const PROVIDER_PRESETS: { label: string; type: ProviderType; baseUrl: string; model: string }[] = [
  { label: 'Ollama (local, free)', type: 'ollama', baseUrl: 'http://localhost:11434', model: 'llama3:8b' },
  { label: 'OpenAI', type: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: 'Anthropic', type: 'anthropic', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514' },
  { label: 'Groq (fast, free tier)', type: 'openai-compatible', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { label: 'Together AI', type: 'openai-compatible', baseUrl: 'https://api.together.xyz/v1', model: 'meta-llama/Llama-3-70b-chat-hf' },
  { label: 'OpenRouter', type: 'openai-compatible', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4-turbo' },
  { label: 'HuggingFace Inference', type: 'openai-compatible', baseUrl: 'https://api-inference.huggingface.co/models', model: 'mistralai/Mistral-7B-Instruct-v0.2' },
  { label: 'Custom (any OpenAI-compatible)', type: 'openai-compatible', baseUrl: '', model: '' },
];

function formatTokens(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// --- Provider Card Component (needs its own hooks) ---
const ProviderCard: React.FC<{
  provider: LLMProviderConfig;
  index: number;
  total: number;
  systemRam: number;
  ollamaStatus: string;
  onMove: (index: number, dir: 'up' | 'down') => void;
  onVerify: (p: LLMProviderConfig) => void;
  onUpdate: (id: string, updates: Partial<LLMProviderConfig>) => void;
  onRemove: (id: string) => void;
}> = ({ provider, index, total, systemRam, ollamaStatus, onMove, onVerify, onUpdate, onRemove }) => {
  const [showModels, setShowModels] = useState(false);
  const status = provider.connectionStatus || 'untested';
  const statusDisplay = STATUS_DISPLAY[status];
  const models = POPULAR_MODELS[provider.type] || POPULAR_MODELS['openai-compatible'] || [];

  return (
    <div className={`bg-surface border transition-all ${status === 'verified' ? 'border-primary/30 shadow-neon' : 'border-muted'}`}>
      <div className="flex items-center h-11 px-2 gap-1">
        <div className="flex flex-col">
          <button onClick={() => onMove(index, 'up')} disabled={index === 0} className="text-muted hover:text-text-main disabled:opacity-20"><span className="material-symbols-outlined text-[13px]">expand_less</span></button>
          <button onClick={() => onMove(index, 'down')} disabled={index === total - 1} className="text-muted hover:text-text-main disabled:opacity-20"><span className="material-symbols-outlined text-[13px]">expand_more</span></button>
        </div>
        <div className="flex-1 flex items-center gap-2 px-1 min-w-0">
          <span className="text-xs text-text-main font-bold truncate">{provider.name}</span>
          <span className={`text-[8px] px-1.5 py-0.5 border shrink-0 ${statusDisplay.color}`}>{statusDisplay.label}</span>
        </div>
        <button onClick={() => onUpdate(provider.id, { enabled: !provider.enabled })} className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${provider.enabled ? 'bg-primary' : 'bg-muted/30'}`}>
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-background transition-all ${provider.enabled ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
        <button onClick={() => onRemove(provider.id)} className="text-muted hover:text-accent-error shrink-0"><span className="material-symbols-outlined text-[14px]">close</span></button>
      </div>
      {provider.enabled && (
        <div className="px-3 pb-3 pt-1 border-t border-muted/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 relative">
            <span className="text-[9px] text-muted font-mono uppercase shrink-0 w-12">Model:</span>
            <input value={provider.model} onChange={(e) => onUpdate(provider.id, { model: e.target.value, connectionStatus: 'untested' })}
              onFocus={() => setShowModels(true)}
              className="flex-1 bg-background border border-muted/30 text-text-main text-[11px] font-mono px-2 py-1 focus:outline-none focus:border-primary" placeholder="model name" />
            <button onClick={() => setShowModels(s => !s)} className="text-muted hover:text-primary"><span className="material-symbols-outlined text-[14px]">expand_more</span></button>
            {showModels && models.length > 0 && (<>
              <div className="fixed inset-0 z-[98]" onClick={() => setShowModels(false)} />
              <div className="absolute left-12 top-8 z-[99] w-72 bg-surface border border-muted shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                {models.filter(m => !m.minRam || m.minRam <= systemRam).map(m => (
                  <button key={m.id} onClick={() => { onUpdate(provider.id, { model: m.id, connectionStatus: 'untested' }); setShowModels(false); }}
                    className="w-full text-left px-3 py-1.5 text-[11px] font-mono text-text-main hover:bg-surface-hover">
                    {m.name}
                  </button>
                ))}
                {models.some(m => m.minRam && m.minRam > systemRam) && (
                  <div className="px-3 py-1 text-[9px] text-muted border-t border-muted/10">
                    {models.filter(m => m.minRam && m.minRam > systemRam).length} models hidden (need more RAM)
                  </div>
                )}
              </div>
            </>)}
          </div>
          {(provider.type === 'openai-compatible' || provider.type === 'ollama') && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted font-mono uppercase shrink-0 w-12">URL:</span>
              <input value={provider.baseUrl} onChange={(e) => onUpdate(provider.id, { baseUrl: e.target.value, connectionStatus: 'untested' })}
                className="flex-1 bg-background border border-muted/30 text-text-main text-[11px] font-mono px-2 py-1 focus:outline-none focus:border-primary" placeholder="https://..." />
            </div>
          )}
          {provider.type !== 'ollama' && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted font-mono uppercase shrink-0 w-12">Key:</span>
              <input type="password" value={provider.apiKey || ''} onChange={(e) => onUpdate(provider.id, { apiKey: e.target.value, connectionStatus: 'untested' })}
                placeholder="paste your API key" className="flex-1 bg-background border border-muted/30 text-text-main text-[11px] font-mono px-2 py-1 focus:outline-none focus:border-primary" />
            </div>
          )}
          {provider.type === 'ollama' && ollamaStatus !== 'active' && status !== 'verified' && (
            <div className="bg-background border border-accent-ai/20 p-2.5">
              <p className="text-[10px] text-accent-ai font-bold mb-1">Ollama not detected</p>
              <ol className="text-[10px] text-muted leading-relaxed list-decimal list-inside space-y-0.5">
                <li>Download from <span className="text-primary">ollama.com</span></li>
                <li>Install and open it</li>
                <li>Run: <span className="text-primary font-mono">ollama pull {provider.model}</span></li>
              </ol>
            </div>
          )}
          {status === 'failed' && provider.connectionError && (
            <div className="text-[10px] text-accent-error bg-accent-error/5 border border-accent-error/20 p-2">{provider.connectionError}</div>
          )}
          <div className="flex items-center justify-between mt-1">
            <button onClick={() => onVerify(provider)} disabled={status === 'testing'}
              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 border transition-all ${
                status === 'verified' ? 'text-primary border-primary/30 hover:bg-primary/10' :
                status === 'testing' ? 'text-accent-ai border-accent-ai/30 opacity-50' :
                'text-text-main border-muted hover:border-primary'}`}>
              <span className="material-symbols-outlined text-[14px]">{status === 'verified' ? 'check_circle' : status === 'testing' ? 'hourglass_top' : 'play_arrow'}</span>
              {status === 'verified' ? 'Re-verify' : status === 'testing' ? 'Testing...' : 'Verify Connection'}
            </button>
            {(provider.tokensUsed || 0) > 0 && (
              <span className="text-[9px] text-muted font-mono">{formatTokens(provider.tokensUsed || 0)} tokens</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const STATUS_DISPLAY: Record<ConnectionStatus, { label: string; color: string }> = {
  untested: { label: 'Not tested', color: 'text-muted border-muted/30' },
  testing: { label: 'Verifying...', color: 'text-accent-ai border-accent-ai/30' },
  verified: { label: 'Verified', color: 'text-primary border-primary/30' },
  failed: { label: 'Failed', color: 'text-accent-error border-accent-error/30' },
};

const OrchestrationHub: React.FC = () => {
  const { ollamaStatus, addToast, providers, updateProvider, reorderProviders, addProvider, removeProvider, trackTokenUsage, editorSettings, updateEditorSettings } = useIDEStore();
  const systemRam = editorSettings.systemRamGb;
  const [activeTab, setActiveTab] = useState<Tab>('providers');
  const [testPrompt, setTestPrompt] = useState('');
  const [testLog, setTestLog] = useState<LogEntry[]>([
    { msg: '> Ready. Type a message to test your AI connection.', type: 'info' },
  ]);
  const [isTesting, setIsTesting] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const [ramInput, setRamInput] = useState(String(systemRam));
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testLog]);

  useEffect(() => {
    setRamInput(String(systemRam));
  }, [systemRam]);

  const handleRamChange = (val: string) => {
    setRamInput(val);
    const num = parseInt(val, 10);
    if (num > 0 && num <= 1024) {
      updateEditorSettings({ systemRamGb: num });
    }
  };

  const verifyProvider = async (provider: LLMProviderConfig) => {
    updateProvider(provider.id, { connectionStatus: 'testing', connectionError: '' });
    try {
      await chatWithProvider(provider, [{ role: 'user', content: 'Hi' }]);
      updateProvider(provider.id, { connectionStatus: 'verified', connectionError: '' });
      addToast(`${provider.name} is working`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      updateProvider(provider.id, { connectionStatus: 'failed', connectionError: msg });
      addToast(`${provider.name}: ${msg}`, 'error');
    }
  };

  const moveProvider = (index: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= providers.length) return;
    const next = [...providers];
    [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
    reorderProviders(next.map((p, i) => ({ ...p, priority: i + 1 })));
  };

  const handleAddPreset = (preset: typeof PROVIDER_PRESETS[0]) => {
    const id = `provider-${Date.now()}`;
    if (preset.type === 'openai-compatible' && !preset.baseUrl) {
      setDialog({
        isOpen: true, type: 'prompt', title: 'Provider Name', placeholder: 'My AI Service',
        onConfirm: (name) => {
          addProvider({ id, name, type: 'openai-compatible', model: '', baseUrl: '', apiKey: '', enabled: true, priority: 0, tokensUsed: 0, requestCount: 0, connectionStatus: 'untested' });
          addToast(`Added ${name}`, 'success');
        },
        onClose: () => setDialog(null),
      });
    } else {
      const existing = providers.find(p => p.type === preset.type && p.baseUrl === preset.baseUrl);
      if (existing) { addToast(`${preset.label} already added`, 'info'); return; }
      addProvider({ id, name: preset.label.split(' (')[0], type: preset.type, model: preset.model, baseUrl: preset.baseUrl, apiKey: '', enabled: true, priority: 0, tokensUsed: 0, requestCount: 0, connectionStatus: 'untested' });
      addToast(`Added ${preset.label.split(' (')[0]}`, 'success');
    }
    setShowAddMenu(false);
  };

  const runTest = async () => {
    if (!testPrompt) return;
    setIsTesting(true);
    setTestLog(prev => [...prev, { msg: `> You: "${testPrompt.slice(0, 100)}"`, type: 'primary' }]);
    try {
      const result = await routeChat(providers, [{ role: 'user', content: testPrompt }],
        (msg, type) => setTestLog(prev => [...prev, { msg: `> ${msg}`, type }]));
      setTestLog(prev => [...prev, { msg: `> AI (${result.provider}): ${result.content.slice(0, 400)}`, type: 'ai' }]);
      trackTokenUsage(result.providerId, result.tokensUsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTestLog(prev => [...prev, { msg: `> Error: ${message}`, type: 'error' }]);
    } finally { setIsTesting(false); setTestPrompt(''); }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-background overflow-hidden relative">
      <ViewHint id="hint-orchestrator" icon="smart_toy" title="Connect an AI Assistant"
        description="Add an AI provider to power the copilot. Click 'Add' to get started. Each provider needs to be verified before it works." />
      <div className="flex h-full">
        {/* Left */}
        <section className="w-1/2 flex flex-col border-r border-muted/30 bg-background">
          <div className="flex border-b border-muted/30 bg-surface/50">
            {([['providers', 'smart_toy', 'Providers'], ['usage', 'bar_chart', 'Usage']] as [Tab, string, string][]).map(([tab, icon, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text-main'}`}>
                <span className="material-symbols-outlined text-[16px]">{icon}</span>{label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'providers' && (
              <div className="p-4 flex flex-col gap-3">
                {/* RAM Input */}
                <div className="flex items-center gap-3 bg-surface border border-muted p-3">
                  <span className="material-symbols-outlined text-primary text-sm">memory</span>
                  <span className="text-[10px] text-muted font-mono uppercase">Your RAM:</span>
                  <input value={ramInput} onChange={(e) => handleRamChange(e.target.value)}
                    className="w-16 bg-background border border-muted/30 text-text-main text-xs font-mono px-2 py-1 text-center focus:outline-none focus:border-primary" type="number" min="1" max="1024" />
                  <span className="text-[10px] text-muted font-mono">GB</span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted font-mono">AI models that power your copilot</p>
                  <div className="relative">
                    <button onClick={() => setShowAddMenu(s => !s)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-background text-[10px] font-bold uppercase tracking-wider hover:bg-[#0cf1f1] transition-all">
                      <span className="material-symbols-outlined text-[14px]">add</span> Add
                    </button>
                    {showAddMenu && (<>
                      <div className="fixed inset-0 z-[99]" onClick={() => setShowAddMenu(false)} />
                      <div className="absolute right-0 top-9 z-[100] w-72 bg-surface border border-muted shadow-lg py-1 max-h-80 overflow-y-auto custom-scrollbar">
                        {PROVIDER_PRESETS.map((preset, i) => (
                          <button key={i} onClick={() => handleAddPreset(preset)} className="w-full text-left px-4 py-2 text-xs font-mono text-text-main hover:bg-surface-hover flex justify-between">
                            <span>{preset.label}</span>
                            {preset.type === 'ollama' && <span className="text-[9px] text-primary">FREE</span>}
                          </button>
                        ))}
                      </div>
                    </>)}
                  </div>
                </div>

                {providers.length === 0 && (
                  <div className="flex flex-col items-center text-center gap-3 py-10">
                    <span className="material-symbols-outlined text-4xl text-muted/30">smart_toy</span>
                    <p className="text-xs text-muted">No providers yet. Click <strong className="text-primary">Add</strong> above.</p>
                  </div>
                )}

                {providers.map((provider, index) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    index={index}
                    total={providers.length}
                    systemRam={systemRam}
                    ollamaStatus={ollamaStatus}
                    onMove={moveProvider}
                    onVerify={verifyProvider}
                    onUpdate={updateProvider}
                    onRemove={(id) => {
                      setDialog({ isOpen: true, type: 'confirm', title: 'Remove Provider', danger: true, message: `Remove this provider?`, confirmLabel: 'Remove',
                        onConfirm: () => { removeProvider(id); addToast('Removed', 'info'); }, onClose: () => setDialog(null) });
                    }}
                  />
                ))}
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="p-4 flex flex-col gap-4">
                <h3 className="text-[10px] text-muted font-bold uppercase tracking-widest">Token Usage by Provider</h3>
                {providers.filter(p => (p.tokensUsed || 0) > 0).length === 0 ? (
                  <div className="flex flex-col items-center text-center gap-3 py-10">
                    <span className="material-symbols-outlined text-4xl text-muted/30">bar_chart</span>
                    <p className="text-xs text-muted">No usage yet. Use the copilot or test panel to start tracking.</p>
                  </div>
                ) : (<>
                  {providers.filter(p => (p.tokensUsed || 0) > 0).map(provider => {
                    const tokens = provider.tokensUsed || 0;
                    const requests = provider.requestCount || 0;
                    const maxTokens = Math.max(...providers.map(p => p.tokensUsed || 0), 1);
                    return (
                      <div key={provider.id} className="bg-surface border border-muted p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-text-main font-bold">{provider.name}</span>
                          <span className="text-[10px] text-muted font-mono">{provider.model}</span>
                        </div>
                        <div className="w-full h-2 bg-background mb-2"><div className="h-full bg-primary transition-all" style={{ width: `${(tokens / maxTokens) * 100}%` }} /></div>
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-primary font-bold">{formatTokens(tokens)} tokens</span>
                          <span className="text-muted">{requests} requests</span>
                          <span className="text-muted">~{(tokens / Math.max(requests, 1)).toFixed(0)} avg</span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t border-muted/30 pt-3 flex justify-between text-xs font-mono">
                    <span className="text-text-main font-bold">Total</span>
                    <span className="text-primary">{formatTokens(providers.reduce((s, p) => s + (p.tokensUsed || 0), 0))} tokens</span>
                    <span className="text-muted">{providers.reduce((s, p) => s + (p.requestCount || 0), 0)} requests</span>
                  </div>
                </>)}
              </div>
            )}
          </div>
        </section>

        {/* Right: Test */}
        <section className="w-1/2 flex flex-col bg-background">
          <div className="p-5 border-b border-muted/30 bg-surface/30">
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-ai">chat</span>
              Test Your AI
            </h2>
            <p className="text-muted text-[10px] mt-0.5 font-mono">Send a message to check your connection</p>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
            <div className="flex-1 bg-surface/20 border border-muted p-4 font-mono text-[11px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
              {testLog.map((log, i) => (
                <div key={i}><span className={log.type === 'primary' ? 'text-primary' : log.type === 'ai' ? 'text-accent-ai' : log.type === 'error' ? 'text-accent-error' : 'text-muted'}>{log.msg}</span></div>
              ))}
              <div ref={logEndRef} />
            </div>
            <div className="flex gap-2">
              <input value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isTesting && runTest()} disabled={isTesting}
                className="flex-1 bg-surface border border-muted text-text-main font-mono text-xs px-4 py-2.5 outline-none focus:border-primary placeholder-muted disabled:opacity-50"
                placeholder="Type a test message..." />
              <button onClick={runTest} disabled={isTesting || !testPrompt}
                className={`bg-primary text-background px-5 py-2 font-bold text-xs uppercase tracking-widest hover:bg-[#0cf1f1] transition-all ${isTesting || !testPrompt ? 'opacity-50' : ''}`}>
                {isTesting ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </section>
      </div>
      {dialog && <InlineDialog {...dialog} />}
    </div>
  );
};

export default OrchestrationHub;
