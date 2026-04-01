"use client";

import React, { useState } from 'react';
import { useIDEStore } from '../../store/useIDEStore';

const ArchitectureGuide: React.FC = () => {
  const { learningMode, toggleLearningPath } = useIDEStore();
  const [collapsed, setCollapsed] = useState(false);

  if (learningMode !== 'beginner') return null;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="bg-surface/90 border border-muted px-2 py-1 text-[11px] text-muted font-mono hover:border-primary hover:text-primary transition-all flex items-center gap-1"
        title="Show architecture guide"
      >
        <span className="material-symbols-outlined text-[12px]">help</span>
        Guide
      </button>
    );
  }

  return (
    <div className="bg-surface/95 border border-primary/50 shadow-neon p-3 max-w-[260px] backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-primary">school</span>
          <span className="text-[11px] font-bold text-text-main uppercase tracking-wide">How to Read This Map</span>
        </div>
        <button onClick={() => setCollapsed(true)} className="text-muted hover:text-text-main">
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>
      <ul className="space-y-1.5 mb-3">
        <li className="flex items-start gap-2 text-[11px] text-text-main">
          <span className="material-symbols-outlined text-[12px] text-primary mt-0.5 shrink-0">check_box_outline_blank</span>
          <span><strong className="text-primary">Boxes</strong> = parts of your app (UI, API, Database, etc.)</span>
        </li>
        <li className="flex items-start gap-2 text-[11px] text-text-main">
          <span className="material-symbols-outlined text-[12px] text-primary mt-0.5 shrink-0">trending_flat</span>
          <span><strong className="text-primary">Lines</strong> = data flowing between parts</span>
        </li>
        <li className="flex items-start gap-2 text-[11px] text-text-main">
          <span className="material-symbols-outlined text-[12px] text-primary mt-0.5 shrink-0">palette</span>
          <span><strong className="text-accent-ai">Purple</strong> = AI, <strong className="text-accent-error">Pink</strong> = storage</span>
        </li>
      </ul>
      <button
        onClick={() => toggleLearningPath(true)}
        className="flex items-center gap-1 text-[11px] text-primary font-bold hover:underline"
      >
        <span className="material-symbols-outlined text-[12px]">school</span>
        Open Learning Path
      </button>
    </div>
  );
};

export default ArchitectureGuide;
