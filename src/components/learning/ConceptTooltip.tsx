"use client";

import React from 'react';
import ReactDOM from 'react-dom';
import { useIDEStore } from '../../store/useIDEStore';
import { GLOSSARY_ENTRIES } from '../../data/glossary';

interface ConceptTooltipProps {
  termId: string;
  children: React.ReactNode;
}

const ConceptTooltip: React.FC<ConceptTooltipProps> = ({ termId, children }) => {
  const { learningMode, toggleGlossary } = useIDEStore();
  const [isHovered, setIsHovered] = React.useState(false);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [tooltipPos, setTooltipPos] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLSpanElement>(null);
  const hoverTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const entry = GLOSSARY_ENTRIES.find((e) => e.id === termId);

  if (learningMode === 'experienced' || !entry) {
    return <>{children}</>;
  }

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    hoverTimeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const TOOLTIP_H = 80; // estimated tooltip height
        const TOOLTIP_W = 320; // max-w-xs ≈ 320px
        const GAP = 6;

        // Flip above if not enough room below
        const fitsBelow = rect.bottom + GAP + TOOLTIP_H < window.innerHeight;
        const top = fitsBelow
          ? rect.bottom + GAP
          : rect.top - GAP - TOOLTIP_H;

        // Clamp horizontal center so tooltip stays within viewport
        const centerX = rect.left + rect.width / 2;
        const halfW = TOOLTIP_W / 2;
        const clampedLeft = Math.max(halfW + 8, Math.min(centerX, window.innerWidth - halfW - 8));

        setTooltipPos({ top: Math.max(8, top), left: clampedLeft });
      }
      setShowTooltip(true);
    }, 300);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(false);
    leaveTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 200);
  };

  const handleTooltipMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  const handleTooltipMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
      setIsHovered(false);
    }, 200);
  };

  const handleOpenGlossary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowTooltip(false);
    toggleGlossary(true);
  };

  return (
    <>
      <span
        ref={triggerRef}
        className="border-b border-dashed border-accent-ai/50 cursor-help"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      {showTooltip &&
        ReactDOM.createPortal(
          <div
            className="bg-surface border border-accent-ai/50 shadow-lg p-3 max-w-xs z-[200] fixed"
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
              transform: 'translateX(-50%)',
            }}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
          >
            <div className="text-xs font-bold text-text-main mb-1">{entry.term}</div>
            <p className="text-[11px] text-muted leading-relaxed mb-2">
              {entry.shortDefinition}
            </p>
            <button
              onClick={handleOpenGlossary}
              className="text-[11px] text-accent-ai hover:text-primary font-bold uppercase tracking-wider transition-colors"
            >
              Open Glossary
            </button>
          </div>,
          document.body
        )}
    </>
  );
};

export default ConceptTooltip;
