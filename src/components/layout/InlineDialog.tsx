"use client";

import React, { useState, useEffect, useRef } from 'react';

interface DialogProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
}

interface PromptDialogProps extends DialogProps {
  type: 'prompt';
  defaultValue?: string;
  placeholder?: string;
  onConfirm: (value: string) => void;
}

interface ConfirmDialogProps extends DialogProps {
  type: 'confirm';
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

export type DialogConfig = PromptDialogProps | ConfirmDialogProps;

const InlineDialog: React.FC<DialogConfig> = (props) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.isOpen) {
      if (props.type === 'prompt') {
        setInputValue(props.defaultValue || '');
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [props.isOpen]);

  if (!props.isOpen) return null;

  const handleSubmit = () => {
    if (props.type === 'prompt') {
      if (inputValue.trim()) {
        props.onConfirm(inputValue.trim());
      }
    } else {
      props.onConfirm();
    }
    props.onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[20vh] bg-black/40" onClick={props.onClose} role="dialog" aria-modal="true" aria-label={props.title}>
      <div
        className="w-[400px] bg-surface border border-muted shadow-lg shadow-black/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-bold text-text-main">{props.title}</h3>
        </div>

        <div className="px-4 pb-4">
          {props.type === 'prompt' ? (
            <input
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') props.onClose(); }}
              placeholder={props.placeholder || ''}
              className="w-full bg-background border border-muted/50 text-text-main text-xs font-mono p-2.5 mt-2 focus:outline-none focus:border-primary placeholder-muted"
            />
          ) : (
            <p className="text-xs text-muted font-mono mt-2 leading-relaxed">{props.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 pb-4">
          <button
            onClick={props.onClose}
            className="px-4 py-1.5 text-xs font-bold text-muted hover:text-text-main border border-muted/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-1.5 text-xs font-bold transition-colors ${
              props.type === 'confirm' && props.danger
                ? 'bg-accent-error text-background hover:bg-accent-error/80'
                : 'bg-primary text-background hover:bg-[#0cf1f1]'
            }`}
          >
            {props.type === 'confirm' ? (props.confirmLabel || 'Confirm') : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InlineDialog;
