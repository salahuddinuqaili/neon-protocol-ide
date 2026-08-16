/**
 * Platform-aware keyboard handling.
 *
 * Every shortcut in the app was originally bound to `ctrlKey` only. macOS uses Command
 * for the same actions, so on the shipped .dmg none of them worked — including Save.
 * Route all shortcut checks through `isModKey` so both platforms behave natively.
 */

/**
 * True when running on macOS. Safe to call during SSR (returns false), so it must not be
 * read at module scope in a component — call it inside a handler or effect.
 */
export function isMac(): boolean {
  if (typeof window === 'undefined') return false;

  // Electron reports the real platform; the browser build falls back to UA sniffing.
  const platform = window.electronAPI?.platform;
  if (platform) return platform === 'darwin';

  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  if (!nav) return false;
  return /mac|iphone|ipad|ipod/i.test((nav as any).userAgentData?.platform || nav.platform || nav.userAgent);
}

/** The primary shortcut modifier for this platform: Command on macOS, Control elsewhere. */
export function isModKey(e: Pick<KeyboardEvent, 'ctrlKey' | 'metaKey'>): boolean {
  return isMac() ? e.metaKey : e.ctrlKey;
}

/** Display label for the primary modifier, for tooltips and hint text. */
export function modLabel(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

/** Formats a shortcut for display, e.g. `shortcut('B')` -> "Ctrl+B" or "⌘B". */
export function shortcut(key: string, opts?: { shift?: boolean; alt?: boolean }): string {
  const mac = isMac();
  const parts: string[] = [mac ? '⌘' : 'Ctrl'];
  if (opts?.alt) parts.push(mac ? '⌥' : 'Alt');
  if (opts?.shift) parts.push(mac ? '⇧' : 'Shift');
  parts.push(key);
  return mac ? parts.join('') : parts.join('+');
}
