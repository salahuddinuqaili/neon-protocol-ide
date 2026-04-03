"use client";

import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus within a container. On mount, saves the previously
 * focused element and focuses the first focusable child. On Tab/Shift+Tab,
 * cycles through focusable elements. On unmount, restores focus.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(onEscape?: () => void) {
  const ref = useRef<T>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!ref.current) return;

    if (e.key === 'Escape' && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusable = ref.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onEscape]);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    // Save current focus
    previousFocus.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (focusable.length > 0) {
      // Delay to let the DOM settle (modals may be animating)
      requestAnimationFrame(() => focusable[0].focus());
    }

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore previous focus
      previousFocus.current?.focus();
    };
  }, [handleKeyDown]);

  return ref;
}
