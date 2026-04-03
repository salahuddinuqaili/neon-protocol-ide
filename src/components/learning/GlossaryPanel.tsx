"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { GLOSSARY_ENTRIES } from '../../data/glossary';
import { GlossaryCategory } from '../../types';
import { CATEGORY_LABELS } from '../../config/education';

const CATEGORIES: GlossaryCategory[] = ['coding', 'llm', 'architecture', 'ide'];

const GlossaryPanel: React.FC = () => {
  const { isGlossaryOpen, toggleGlossary } = useIDEStore();
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    coding: true,
    llm: true,
    architecture: true,
    ide: true,
  });
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({});
  const termRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Reset search when panel closes
  useEffect(() => {
    if (!isGlossaryOpen) {
      setSearch('');
    }
  }, [isGlossaryOpen]);

  if (!isGlossaryOpen) return null;

  const searchLower = search.toLowerCase();
  const filteredEntries = search
    ? GLOSSARY_ENTRIES.filter(
        (e) =>
          e.term.toLowerCase().includes(searchLower) ||
          e.shortDefinition.toLowerCase().includes(searchLower)
      )
    : GLOSSARY_ENTRIES;

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleTerm = (id: string) => {
    setExpandedTerms((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToTerm = (termId: string) => {
    // Expand the category that contains this term
    const entry = GLOSSARY_ENTRIES.find((e) => e.id === termId);
    if (entry) {
      setExpandedCategories((prev) => ({ ...prev, [entry.category]: true }));
      setExpandedTerms((prev) => ({ ...prev, [termId]: true }));
    }
    // Scroll after a short delay to allow DOM update
    setTimeout(() => {
      const el = termRefs.current[termId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div
      className={`absolute right-0 top-0 h-full w-[450px] max-w-[95vw] bg-surface border-l border-muted z-[60] transform transition-transform duration-300 ease-in-out shadow-[-10px_0_30px_rgba(0,0,0,0.5)] ${
        isGlossaryOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-muted bg-background">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">menu_book</span>
          <h2 className="text-sm font-bold text-text-main tracking-tight">Glossary</h2>
        </div>
        <button
          onClick={() => toggleGlossary(false)}
          className="text-muted hover:text-text-main p-1 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-muted/30">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search terms..."
          className="w-full bg-surface border border-muted text-xs font-mono px-3 py-2 focus:outline-none focus:border-primary placeholder-muted"
        />
      </div>

      {/* Terms */}
      <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ height: 'calc(100% - 120px)' }}>
        {CATEGORIES.map((cat) => {
          const entries = filteredEntries.filter((e) => e.category === cat);
          if (entries.length === 0) return null;

          return (
            <div key={cat}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-background/50 border-b border-muted/20 hover:bg-surface-hover transition-colors"
              >
                <span
                  className={`material-symbols-outlined text-[14px] text-muted transition-transform ${
                    expandedCategories[cat] ? '' : '-rotate-90'
                  }`}
                >
                  expand_more
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="text-[11px] text-muted/50 font-mono ml-auto">
                  {entries.length}
                </span>
              </button>

              {/* Terms in Category */}
              {expandedCategories[cat] && (
                <div className="flex flex-col">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      ref={(el) => { termRefs.current[entry.id] = el; }}
                      className="border-b border-muted/10"
                    >
                      {/* Term Card */}
                      <button
                        onClick={() => toggleTerm(entry.id)}
                        className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors"
                      >
                        <div className="text-xs font-bold text-text-main">{entry.term}</div>
                        <div className="text-[11px] text-muted mt-0.5 leading-relaxed">
                          {entry.shortDefinition}
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {expandedTerms[entry.id] && (
                        <div className="px-4 pb-3">
                          <p className="text-xs text-text-main leading-relaxed bg-background/50 border-l-2 border-accent-ai p-3 mb-2">
                            {entry.fullExplanation}
                          </p>
                          {entry.relatedTerms.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] text-muted font-mono uppercase">
                                Related:
                              </span>
                              {entry.relatedTerms.map((relId) => {
                                const relEntry = GLOSSARY_ENTRIES.find((e) => e.id === relId);
                                if (!relEntry) return null;
                                return (
                                  <button
                                    key={relId}
                                    onClick={() => scrollToTerm(relId)}
                                    className="text-[11px] text-accent-ai hover:text-primary transition-colors underline"
                                  >
                                    {relEntry.term}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {filteredEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="material-symbols-outlined text-3xl text-muted/30 mb-2">search_off</span>
            <p className="text-xs text-muted">No terms match "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlossaryPanel;
