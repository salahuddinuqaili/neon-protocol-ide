"use client";

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface MenuItem {
  label: string;
  icon: string;
  action: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Adjust position to stay in viewport
  const adjustedY = Math.min(y, window.innerHeight - items.length * 32 - 16);
  const adjustedX = Math.min(x, window.innerWidth - 180);

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[300] bg-surface border border-muted shadow-lg shadow-black/50 py-1 min-w-[160px]"
      style={{ top: adjustedY, left: adjustedX }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.action(); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-mono transition-colors text-left ${
            item.danger
              ? 'text-accent-error hover:bg-accent-error/10'
              : 'text-text-main hover:bg-surface-hover'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  );
};

export default ContextMenu;
