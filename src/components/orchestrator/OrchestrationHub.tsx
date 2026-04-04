"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { LLMProviderConfig, ProviderType } from '../../types';
import { routeChat, chatWithProvider } from '../../lib/llm/provider';
import ViewHint from '../onboarding/ViewHint';
import InlineDialog, { DialogConfig } from '../layout/InlineDialog';
import ConceptTooltip from '../learning/ConceptTooltip';
import { MODEL_PLACEHOLDERS, PROVIDER_PRESETS, STATUS_DISPLAY, ProviderPreset, getRecommendedModels, DEMO_MODEL } from '../../config/providers';
import { BEGINNER_EXPLAINER } from '../../config/education';
import { OllamaInstallStatus, ModelPullProgress } from '../../types';

type LogEntry = { msg: string; type: 'info' | 'primary' | 'ai' | 'error' };
type Tab = 'providers' | 'usage';

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
  ollamaStatus: string;
  ollamaInstallStatus: OllamaInstallStatus;
  onMove: (index: number, dir: 'up' | 'down') => void;
  onVerify: (p: LLMProviderConfig) => void;
  onUpdate: (id: string, updates: Partial<LLMProviderConfig>) => void;
  onRemove: (id: string) => void;
  onInstallOllama: () => void;
}> = ({ provider, index, total, ollamaStatus, ollamaInstallStatus, onMove, onVerify, onUpdate, onRemove, onInstallOllama }) => {
  const status = provider.connectionStatus || 'untested';
  const statusDisplay = STATUS_DISPLAY[status];
  const modelPlaceholder = MODEL_PLACEHOLDERS[provider.type] || MODEL_PLACEHOLDERS['openai-compatible'];

  return (
    <div className={`bg-surface border transition-all ${status === 'verified' ? 'border-primary/30 shadow-neon' : 'border-muted'}`}>
      <div className="flex items-center h-11 px-2 gap-1">
        <div className="flex flex-col">
          <button onClick={() => onMove(index, 'up')} disabled={index === 0} className="text-muted hover:text-text-main disabled:opacity-20"><span className="material-symbols-outlined text-[13px]">expand_less</span></button>
          <button onClick={() => onMove(index, 'down')} disabled={index === total - 1} className="text-muted hover:text-text-main disabled:opacity-20"><span className="material-symbols-outlined text-[13px]">expand_more</span></button>
        </div>
        <div className="flex-1 flex items-center gap-2 px-1 min-w-0">
          <span className="text-xs text-text-main font-bold truncate">{provider.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 border shrink-0 ${statusDisplay.color}`}>{statusDisplay.label}</span>
        </div>
        <button onClick={() => onUpdate(provider.id, { enabled: !provider.enabled })} role="switch" aria-checked={provider.enabled} aria-label={`${provider.enabled ? 'Disable' : 'Enable'} ${provider.name}`} className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${provider.enabled ? 'bg-primary' : 'bg-muted/30'}`}>
          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-background transition-all ${provider.enabled ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
        <button onClick={() => onRemove(provider.id)} aria-label={`Remove ${provider.name}`} className="text-muted hover:text-accent-error shrink-0"><span className="material-symbols-outlined text-[14px]" aria-hidden="true">close</span></button>
      </div>
      {provider.enabled && (
        <div className="px-3 pb-3 pt-1 border-t border-muted/10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted font-mono uppercase shrink-0 w-12">Model:</span>
            <input value={provider.model} onChange={(e) => onUpdate(provider.id, { model: e.target.value, connectionStatus: 'untested' })}
              className="flex-1 bg-background border border-muted/30 text-text-main text-xs font-mono px-2 py-1 focus:outline-none focus:border-primary" placeholder={modelPlaceholder} />
          </div>
          {(provider.type === 'openai-compatible' || provider.type === 'ollama' || provider.type === 'anthropic') && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted font-mono uppercase shrink-0 w-12">URL:</span>
              <input value={provider.baseUrl} onChange={(e) => onUpdate(provider.id, { baseUrl: e.target.value, connectionStatus: 'untested' })}
                className="flex-1 bg-background border border-muted/30 text-text-main text-xs font-mono px-2 py-1 focus:outline-none focus:border-primary" placeholder="https://..." />
            </div>
          )}
          {provider.type !== 'ollama' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted font-mono uppercase shrink-0 w-12">Key:</span>
              <input type="password" value={provider.apiKey || ''} onChange={(e) => onUpdate(provider.id, { apiKey: e.target.value, connectionStatus: 'untested' })}
                placeholder="paste your API key" className="flex-1 bg-background border border-muted/30 text-text-main text-xs font-mono px-2 py-1 focus:outline-none focus:border-primary" />
            </div>
          )}
          {provider.type === 'ollama' && ollamaStatus !== 'active' && status !== 'verified' && (
            <div className="bg-background border border-accent-ai/20 p-2.5">
              <p className="text-xs text-accent-ai font-bold mb-1">Ollama not detected</p>
              {ollamaInstallStatus === 'not-installed' || ollamaInstallStatus === 'unknown' ? (
                <div className="flex flex-col gap-2">
                  <button onClick={onInstallOllama}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-accent-ai text-background hover:opacity-90 transition-all w-fit">
                    <span className="material-symbols-outlined text-[14px]">download</span> Install Ollama Automatically
                  </button>
                  <details className="group">
                    <summary className="text-[11px] text-muted cursor-pointer hover:text-text-main">Or install manually...</summary>
                    <ol className="text-xs text-muted leading-relaxed list-decimal list-inside space-y-0.5 mt-1">
                      <li>Download from <span className="text-primary">ollama.com</span></li>
                      <li>Install and open it</li>
                      <li>Run: <span className="text-primary font-mono">ollama pull {provider.model || 'llama3:8b'}</span></li>
                    </ol>
                  </details>
                </div>
              ) : ollamaInstallStatus === 'installing' ? (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-accent-ai animate-spin">progress_activity</span>
                  <span className="text-xs text-accent-ai">Installing Ollama...</span>
                </div>
              ) : ollamaInstallStatus === 'error' ? (
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-accent-error">Installation failed. Try installing manually:</p>
                  <ol className="text-xs text-muted leading-relaxed list-decimal list-inside space-y-0.5">
                    <li>Download from <span className="text-primary">ollama.com</span></li>
                    <li>Install and open it</li>
                    <li>Run: <span className="text-primary font-mono">ollama pull {provider.model || 'llama3:8b'}</span></li>
                  </ol>
                </div>
              ) : (
                <p className="text-xs text-primary">Ollama installed. Start it to connect.</p>
              )}
            </div>
          )}
          {status === 'failed' && provider.connectionError && (
            <div className="text-xs text-accent-error bg-accent-error/5 border border-accent-error/20 p-2">{provider.connectionError}</div>
          )}
          <div className="flex items-center justify-between mt-1">
            <button onClick={() => onVerify(provider)} disabled={status === 'testing'}
              className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 border transition-all ${
                status === 'verified' ? 'text-primary border-primary/30 hover:bg-primary/10' :
                status === 'testing' ? 'text-accent-ai border-accent-ai/30 opacity-50' :
                'text-text-main border-muted hover:border-primary'}`}>
              <span className="material-symbols-outlined text-[14px]">{status === 'verified' ? 'check_circle' : status === 'testing' ? 'hourglass_top' : 'play_arrow'}</span>
              {status === 'verified' ? 'Re-verify' : status === 'testing' ? 'Testing...' : 'Verify Connection'}
            </button>
            {(provider.tokensUsed || 0) > 0 && (
              <span className="text-[11px] text-muted font-mono">{formatTokens(provider.tokensUsed || 0)} tokens</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const OrchestrationHub: React.FC = () => {
  const { ollamaStatus, ollamaInstallStatus, setOllamaInstallStatus, hardwareInfo, availableOllamaModels, setAvailableOllamaModels, modelPullProgress, setModelPullProgress, addToast, providers, updateProvider, reorderProviders, addProvider, removeProvider, trackTokenUsage, learningMode, dismissedHints, dismissHint } = useIDEStore();
  const [activeTab, setActiveTab] = useState<Tab>('providers');
  const [testPrompt, setTestPrompt] = useState('');
  const isBeginnerMode = learningMode === 'beginner';
  const [testLog, setTestLog] = useState<LogEntry[]>([
    { msg: isBeginnerMode
      ? '> Welcome! This is like a chat window for testing your AI. Try typing a simple question below and press Send.'
      : '> Ready. Type a message to test your AI connection.', type: 'info' },
  ]);
  const [isTesting, setIsTesting] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const recommendedModels = hardwareInfo ? getRecommendedModels(hardwareInfo.ramGb) : [];
  const hasOllamaProvider = providers.some(p => p.type === 'ollama');

  const handleInstallOllama = async () => {
    const api = typeof window !== 'undefined' ? (window as any).electronAPI : undefined;
    if (!api?.ollamaInstall) {
      addToast('Auto-install is only available in the desktop app', 'info');
      return;
    }
    setOllamaInstallStatus('installing');
    const cleanup = api.onOllamaInstallProgress?.((msg: string) => {
      addToast(typeof msg === 'string' ? msg.slice(0, 100) : 'Installing...', 'info');
    });
    try {
      const result = await api.ollamaInstall();
      if (result.success) {
        setOllamaInstallStatus('installed');
        addToast('Ollama installed successfully. Starting it up...', 'success');
      } else {
        setOllamaInstallStatus('error', result.error);
        addToast(`Installation failed: ${result.error}`, 'error');
      }
    } catch (err) {
      setOllamaInstallStatus('error', err instanceof Error ? err.message : String(err));
      addToast('Installation failed', 'error');
    } finally {
      cleanup?.();
    }
  };

  const handlePullModel = async (modelName: string) => {
    const api = typeof window !== 'undefined' ? (window as any).electronAPI : undefined;
    if (!api?.ollamaPullModel) {
      addToast('Model pull is only available in the desktop app', 'info');
      return;
    }
    setModelPullProgress({ model: modelName, percent: 0, status: 'starting' });
    const cleanup = api.onOllamaPullProgress?.((data: ModelPullProgress) => {
      setModelPullProgress(data);
    });
    try {
      const result = await api.ollamaPullModel(modelName);
      if (result.success) {
        addToast(`Model ${modelName} is ready`, 'success');
        setAvailableOllamaModels([...availableOllamaModels, modelName]);
        // Auto-set on existing Ollama provider if it has no model
        const ollamaProvider = providers.find(p => p.type === 'ollama' && !p.model);
        if (ollamaProvider) {
          updateProvider(ollamaProvider.id, { model: modelName, connectionStatus: 'untested' });
        }
      } else {
        addToast(`Failed to pull ${modelName}: ${result.error}`, 'error');
      }
    } catch (err) {
      addToast(`Failed to pull ${modelName}`, 'error');
    } finally {
      setModelPullProgress(null);
      cleanup?.();
    }
  };

  const handleSetupDemoModel = async () => {
    // Add an Ollama provider if none exists
    if (!hasOllamaProvider) {
      const id = `provider-${Date.now()}`;
      addProvider({ id, name: 'Local (Ollama)', type: 'ollama', model: DEMO_MODEL.model, baseUrl: 'http://localhost:11434', apiKey: '', enabled: true, priority: 0, tokensUsed: 0, requestCount: 0, connectionStatus: 'untested' });
    }
    // Pull the demo model
    await handlePullModel(DEMO_MODEL.model);
    dismissHint('demo-model-offer');
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testLog]);

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

  const handleAddPreset = (preset: ProviderPreset) => {
    const id = `provider-${Date.now()}`;
    if (!preset.baseUrl) {
      setDialog({
        isOpen: true, type: 'prompt', title: 'Provider Name', placeholder: 'My AI Service',
        onConfirm: (name) => {
          addProvider({ id, name: name || preset.label, type: preset.type, model: '', baseUrl: '', apiKey: '', enabled: true, priority: 0, tokensUsed: 0, requestCount: 0, connectionStatus: 'untested' });
          addToast(`Added ${name || preset.label}`, 'success');
        },
        onClose: () => setDialog(null),
      });
    } else {
      const existing = providers.find(p => p.type === preset.type && p.baseUrl === preset.baseUrl);
      if (existing) { addToast(`${preset.label} already added`, 'info'); return; }
      addProvider({ id, name: preset.label, type: preset.type, model: preset.model, baseUrl: preset.baseUrl, apiKey: '', enabled: true, priority: 0, tokensUsed: 0, requestCount: 0, connectionStatus: 'untested' });
      addToast(`Added ${preset.label}`, 'success');
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
      <div className="flex flex-col lg:flex-row h-full">
        {/* Left */}
        <section className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-muted/30 bg-background">
          <div className="flex border-b border-muted/30 bg-surface/50">
            {([['providers', 'smart_toy', 'Providers'], ['usage', 'bar_chart', 'Usage']] as [Tab, string, string][]).map(([tab, icon, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text-main'}`}>
                <span className="material-symbols-outlined text-[16px]">{icon}</span>{label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'providers' && (
              <div className="p-4 flex flex-col gap-3">
                {/* Beginner Explainer */}
                {learningMode === 'beginner' && !dismissedHints.includes('orchestrator-explainer') && (
                  <div className="bg-background border border-accent-ai/20 p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-accent-ai">school</span>
                        <span className="text-xs font-bold text-accent-ai uppercase tracking-widest">New to AI? Start here</span>
                      </div>
                      <button onClick={() => dismissHint('orchestrator-explainer')} className="text-[11px] text-muted hover:text-text-main font-mono">Got it, let me configure</button>
                    </div>
                    {BEGINNER_EXPLAINER.map((item, i) => (
                      <details key={i} className="group">
                        <summary className="flex items-center gap-2 cursor-pointer text-xs text-text-main font-bold py-1 hover:text-primary transition-colors list-none">
                          <span className="material-symbols-outlined text-[14px] text-accent-ai">{item.icon}</span>
                          {item.q}
                          <span className="material-symbols-outlined text-[12px] text-muted ml-auto group-open:rotate-180 transition-transform">expand_more</span>
                        </summary>
                        <p className="text-xs text-muted leading-relaxed pl-6 pb-1">{item.a}</p>
                      </details>
                    ))}
                  </div>
                )}

                {/* Demo Model Offer — shown when Ollama is active but no models are pulled */}
                {ollamaStatus === 'active' && availableOllamaModels.length === 0 && !dismissedHints.includes('demo-model-offer') && (
                  <div className="bg-background border border-primary/30 p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary">rocket_launch</span>
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Quick Start</span>
                      </div>
                      <button onClick={() => dismissHint('demo-model-offer')} className="text-[11px] text-muted hover:text-text-main font-mono">Skip</button>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Ollama is running! Download a small demo model (~{DEMO_MODEL.sizeGb} GB) to try AI right away.
                    </p>
                    {modelPullProgress?.model === DEMO_MODEL.model ? (
                      <div className="flex flex-col gap-1">
                        <div className="w-full h-2 bg-background border border-muted/30">
                          <div className="h-full bg-primary transition-all" style={{ width: `${modelPullProgress.percent}%` }} />
                        </div>
                        <span className="text-[11px] text-muted font-mono">{modelPullProgress.status} {modelPullProgress.percent}%</span>
                      </div>
                    ) : (
                      <button onClick={handleSetupDemoModel}
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-primary text-background hover:bg-[#0cf1f1] transition-all w-fit">
                        <span className="material-symbols-outlined text-[14px]">download</span> Get Demo Model ({DEMO_MODEL.label})
                      </button>
                    )}
                  </div>
                )}

                {/* Empty state */}
                {providers.length === 0 ? (
                  <div className="flex flex-col items-center text-center gap-4 py-8 px-4">
                    <span className="material-symbols-outlined text-4xl text-muted/30">smart_toy</span>
                    <div>
                      <h3 className="text-sm font-bold text-text-main mb-1">No AI providers configured</h3>
                      <p className="text-xs text-muted leading-relaxed max-w-xs">Add a local or cloud AI provider to power the copilot. Configure it, then verify the connection.</p>
                    </div>
                    <button onClick={() => setShowAddMenu(true)}
                      className="flex items-center gap-1.5 px-5 py-2 bg-primary text-background text-xs font-bold uppercase tracking-wider hover:bg-[#0cf1f1] transition-all">
                      <span className="material-symbols-outlined text-[14px]">add</span> Add Provider
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Header row with Add button */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-text-main">Your AI Providers</h3>
                        <p className="text-xs text-muted mt-0.5">Providers are tried in order from top to bottom.</p>
                      </div>
                      <div className="relative">
                        <button onClick={() => setShowAddMenu(s => !s)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-background text-xs font-bold uppercase tracking-wider hover:bg-[#0cf1f1] transition-all">
                          <span className="material-symbols-outlined text-[14px]">add</span> Add
                        </button>
                      </div>
                    </div>

                  </>
                )}

                {/* Add menu dropdown */}
                {showAddMenu && (<>
                  <div className="fixed inset-0 z-[99]" onClick={() => setShowAddMenu(false)} />
                  <div className="fixed top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 z-[100] w-80 max-w-[85vw] bg-surface border border-muted shadow-lg">
                    <div className="px-4 py-2 text-xs font-bold text-muted uppercase tracking-wider bg-background/50 border-b border-muted/10">
                      Choose provider type
                    </div>
                    {PROVIDER_PRESETS.map((preset, i) => (
                      <button key={i} onClick={() => handleAddPreset(preset)} className="w-full text-left px-4 py-3 text-text-main hover:bg-surface-hover flex flex-col border-b border-muted/5">
                        <span className="text-xs font-bold">{preset.label}</span>
                        {preset.description && <span className="text-[11px] text-muted mt-0.5">{preset.description}</span>}
                      </button>
                    ))}
                  </div>
                </>)}

                {providers.map((provider, index) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    index={index}
                    total={providers.length}
                    ollamaStatus={ollamaStatus}
                    ollamaInstallStatus={ollamaInstallStatus}
                    onMove={moveProvider}
                    onVerify={verifyProvider}
                    onUpdate={updateProvider}
                    onRemove={(id) => {
                      setDialog({ isOpen: true, type: 'confirm', title: 'Remove Provider', danger: true, message: `Remove this provider?`, confirmLabel: 'Remove',
                        onConfirm: () => { removeProvider(id); addToast('Removed', 'info'); }, onClose: () => setDialog(null) });
                    }}
                    onInstallOllama={handleInstallOllama}
                  />
                ))}

                {/* Model Recommendations — shown when Ollama is active and hardware detected */}
                {ollamaStatus === 'active' && hasOllamaProvider && recommendedModels.length > 0 && (
                  <div className="bg-surface border border-muted p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-accent-ai">memory</span>
                      <span className="text-xs font-bold text-text-main uppercase tracking-widest">Recommended Models</span>
                    </div>
                    {hardwareInfo && (
                      <p className="text-[11px] text-muted font-mono">
                        {hardwareInfo.ramGb} GB RAM{hardwareInfo.gpu.detected ? ` · ${hardwareInfo.gpu.name}${hardwareInfo.gpu.vramGb > 0 ? ` (${hardwareInfo.gpu.vramGb} GB)` : ''}` : ''} · {hardwareInfo.cpuCores} cores
                      </p>
                    )}
                    <div className="flex flex-col gap-1.5">
                      {recommendedModels.map((model) => {
                        const isInstalled = availableOllamaModels.some(m => m.startsWith(model.model.split(':')[0]));
                        const isPulling = modelPullProgress?.model === model.model;
                        return (
                          <div key={model.model} className="flex items-center justify-between bg-background border border-muted/30 px-2.5 py-1.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-text-main font-bold truncate">{model.label}</span>
                                <span className="text-[10px] text-muted font-mono shrink-0">{model.sizeGb} GB</span>
                                {model.fits && <span className="text-[10px] text-primary font-mono shrink-0">recommended</span>}
                              </div>
                              <p className="text-[11px] text-muted truncate">{model.description}</p>
                              {isPulling && (
                                <div className="w-full h-1.5 bg-background border border-muted/30 mt-1">
                                  <div className="h-full bg-primary transition-all" style={{ width: `${modelPullProgress.percent}%` }} />
                                </div>
                              )}
                            </div>
                            <div className="ml-2 shrink-0">
                              {isInstalled ? (
                                <span className="text-[10px] text-primary font-bold uppercase">Installed</span>
                              ) : isPulling ? (
                                <span className="text-[10px] text-accent-ai font-mono">{modelPullProgress.percent}%</span>
                              ) : (
                                <button onClick={() => handlePullModel(model.model)} disabled={modelPullProgress !== null}
                                  className="text-[11px] font-bold uppercase text-text-main border border-muted px-2 py-0.5 hover:border-primary hover:text-primary transition-all disabled:opacity-30">
                                  Pull
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="p-4 flex flex-col gap-4">
                <h3 className="text-xs text-muted font-bold uppercase tracking-widest"><ConceptTooltip termId="token">Token</ConceptTooltip> Usage by <ConceptTooltip termId="provider">Provider</ConceptTooltip></h3>
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
                          <span className="text-xs text-muted font-mono">{provider.model}</span>
                        </div>
                        <div className="w-full h-2 bg-background mb-2"><div className="h-full bg-primary transition-all" style={{ width: `${(tokens / maxTokens) * 100}%` }} /></div>
                        <div className="flex items-center justify-between text-xs font-mono">
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
        <section className="w-full lg:w-1/2 flex flex-col bg-background">
          <div className="p-5 border-b border-muted/30 bg-surface/30">
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-ai">chat</span>
              Test Your AI
            </h2>
            <p className="text-muted text-xs mt-0.5 font-mono">
              {providers.some(p => p.enabled && p.connectionStatus === 'verified')
                ? 'Your AI is connected. Send a message to try it out.'
                : providers.some(p => p.enabled)
                  ? 'Add a provider on the left and verify it first.'
                  : 'Set up a provider on the left to get started.'}
            </p>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
            {!providers.some(p => p.enabled) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-6">
                <span className="material-symbols-outlined text-5xl text-muted/20">smart_toy</span>
                <div>
                  <p className="text-sm text-text-main mb-1">No AI provider connected yet</p>
                  <p className="text-xs text-muted leading-relaxed max-w-xs">
                    Choose a provider from the left panel to connect an AI.
                    Once verified, you can test it here and use the copilot in the code editor.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 bg-surface/20 border border-muted p-4 font-mono text-xs overflow-y-auto custom-scrollbar flex flex-col gap-1">
                  {testLog.map((log, i) => (
                    <div key={i}><span className={log.type === 'primary' ? 'text-primary' : log.type === 'ai' ? 'text-accent-ai' : log.type === 'error' ? 'text-accent-error' : 'text-muted'}>{log.msg}</span></div>
                  ))}
                  <div ref={logEndRef} />
                </div>
                {isBeginnerMode && !testPrompt && (
                  <div className="flex gap-2 flex-wrap">
                    {['What is TypeScript?', 'Explain what an API is', 'Write a hello world function'].map(suggestion => (
                      <button key={suggestion} onClick={() => setTestPrompt(suggestion)}
                        className="text-xs font-mono text-accent-ai border border-accent-ai/30 px-2 py-1 hover:bg-accent-ai/10 transition-colors">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isTesting && runTest()} disabled={isTesting}
                    className="flex-1 bg-surface border border-muted text-text-main font-mono text-xs px-4 py-2.5 outline-none focus:border-primary placeholder-muted disabled:opacity-50"
                    placeholder={isBeginnerMode ? 'Try asking a question...' : 'Type a test message...'} />
                  <button onClick={runTest} disabled={isTesting || !testPrompt}
                    className={`bg-primary text-background px-5 py-2 font-bold text-xs uppercase tracking-widest hover:bg-[#0cf1f1] transition-all ${isTesting || !testPrompt ? 'opacity-50' : ''}`}>
                    {isTesting ? '...' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
      {dialog && <InlineDialog {...dialog} />}
    </div>
  );
};

export default OrchestrationHub;
