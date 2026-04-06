"use client";

import React, { useState } from 'react';
import { TranslatedError } from '../../types';
import { useIDEStore } from '../../store/useIDEStore';

interface ErrorCardProps {
  error: TranslatedError;
  onDismiss: () => void;
  onAskAI?: (errorText: string) => void;
  onOpenLesson?: (lessonId: string) => void;
}

const SEVERITY_STYLES = {
  error: { border: 'border-accent-error/40', icon: 'error', iconColor: 'text-accent-error', bg: 'bg-accent-error/5' },
  warning: { border: 'border-accent-warning/40', icon: 'warning', iconColor: 'text-accent-warning', bg: 'bg-accent-warning/5' },
  info: { border: 'border-primary/40', icon: 'info', iconColor: 'text-primary', bg: 'bg-primary/5' },
};

const ErrorCard: React.FC<ErrorCardProps> = ({ error, onDismiss, onAskAI, onOpenLesson }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { learningMode, toggleLearningPath } = useIDEStore();
  const style = SEVERITY_STYLES[error.severity];

  // In experienced mode, show a minimal inline hint
  if (learningMode === 'experienced') {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-text-main ml-2"
        title={error.title}
      >
        <span className={`material-symbols-outlined text-[12px] ${style.iconColor}`}>{style.icon}</span>
        {!collapsed ? (
          <span className={`border ${style.border} ${style.bg} px-2 py-1 text-[11px] text-text-main`}>
            {error.title}: {error.explanation.split('.')[0]}.
            <button onClick={onDismiss} className="ml-2 text-muted hover:text-text-main">
              <span className="material-symbols-outlined text-[10px]">close</span>
            </button>
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div className={`border ${style.border} ${style.bg} my-1 mx-1 text-xs`}>
      {/* Header — clickable to collapse */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface/30 transition-colors"
      >
        <span className={`material-symbols-outlined text-sm ${style.iconColor}`}>{style.icon}</span>
        <span className="font-bold text-text-main flex-1">{error.title}</span>
        <span className="material-symbols-outlined text-[14px] text-muted">
          {collapsed ? 'expand_more' : 'expand_less'}
        </span>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3">
          {/* Explanation */}
          <p className="text-text-main leading-relaxed mb-2">{error.explanation}</p>

          {/* Common causes */}
          {error.commonCauses.length > 0 && (
            <div className="mb-2">
              <p className="text-muted font-bold mb-1">Common causes:</p>
              <ul className="flex flex-col gap-0.5">
                {error.commonCauses.map((cause, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-text-main">
                    <span className="text-muted mt-0.5 shrink-0">&#x2022;</span>
                    {cause}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {error.suggestedFix && (
              <span className="text-primary text-[11px]">
                <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">lightbulb</span>
                {error.suggestedFix}
              </span>
            )}

            {error.relatedLessonId && onOpenLesson && (
              <button
                onClick={() => onOpenLesson(error.relatedLessonId!)}
                className="flex items-center gap-1 text-[11px] text-accent-ai hover:text-text-main transition-colors"
              >
                <span className="material-symbols-outlined text-[12px]">menu_book</span>
                Related lesson
              </button>
            )}

            {onAskAI && (
              <button
                onClick={() => onAskAI(error.rawError)}
                className="flex items-center gap-1 text-[11px] text-accent-ai hover:text-text-main transition-colors"
              >
                <span className="material-symbols-outlined text-[12px]">smart_toy</span>
                Ask AI to explain
              </button>
            )}

            <button
              onClick={onDismiss}
              className="flex items-center gap-1 text-[11px] text-muted hover:text-text-main transition-colors ml-auto"
            >
              <span className="material-symbols-outlined text-[12px]">close</span>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorCard;
