"use client";

import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus within a container. On mount, saves the previously focused element
 * and focuses the first focusable child (or one marked `data-autofocus`). On Tab/Shift+Tab,
 * cycles through focusable elements. On unmount, restores focus.
 *
 * The setup effect deliberately runs only on mount. It previously depended on the keydown
 * handler, which depended on `onEscape` — and every caller passes an inline arrow function,
 * so that identity changed on each render. The effect therefore re-ran on *every* render and
 * re-focused the first element: with git polling pushing a store update every 10 seconds,
 * focus was yanked out of whatever the user was typing, including the API key field in
 * Settings. `onEscape` is held in a ref so the latest callback is always used without
 * retriggering the trap.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(onEscape?: () => void) {
  const ref = useRef<T>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);

  onEscapeRef.current = onEscape;

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    previousFocus.current = document.activeElement as HTMLElement;

    // Let a panel nominate its own initial target (a search box beats a close button).
    const initial =
      container.querySelector<HTMLElement>('[data-autofocus]') ??
      container.querySelectorAll<HTMLElement>(FOCUSABLE)[0];

    // Deferred so the element exists after any open animation; cancelled on unmount so a
    // quickly-closed panel never steals focus back after it is gone.
    const frame = initial ? requestAnimationFrame(() => initial.focus()) : null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscapeRef.current) {
        e.preventDefault();
        onEscapeRef.current();
        return;
      }

      if (e.key !== 'Tab') return;

      // Re-queried per keypress: a panel's focusable set changes as it renders.
      const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      container.removeEventListener('keydown', handleKeyDown);
      // Only restore to an element still in the document, or focus lands on nothing.
      const previous = previousFocus.current;
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  return ref;
}
