"use client";

import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';

interface ViewHintProps {
  id: string;
  icon: string;
  title: string;
  description: string;
  position?: 'center' | 'top';
}

const ViewHint: React.FC<ViewHintProps> = ({ id, icon, title, description, position = 'center' }) => {
  const { dismissedHints, dismissHint } = useIDEStore();

  if (dismissedHints.includes(id)) return null;

  return (
    <div className={`absolute inset-0 z-40 flex items-center justify-center pointer-events-none ${
      position === 'top' ? 'items-start pt-16' : ''
    }`}>
      <div className="pointer-events-auto bg-surface/95 border border-primary shadow-neon p-6 max-w-sm text-center backdrop-blur-sm">
        <span className="material-symbols-outlined text-3xl text-primary mb-3 block">{icon}</span>
        <h3 className="text-sm font-bold text-text-main mb-2">{title}</h3>
        <p className="text-xs text-muted leading-relaxed mb-4">{description}</p>
        <button
          onClick={() => dismissHint(id)}
          className="px-5 py-2 bg-primary text-background text-xs font-bold uppercase tracking-widest hover:bg-[#0cf1f1] transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default ViewHint;
