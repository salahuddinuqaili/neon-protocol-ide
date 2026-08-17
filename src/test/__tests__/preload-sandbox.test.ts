/**
 * Renderers are sandboxed by default from Electron 20 onward, and a sandboxed preload may
 * only require 'electron', 'events', 'timers', and 'url'.
 *
 * Requiring anything else throws while the preload is evaluating. Because the throw happens
 * inside the object literal passed to `contextBridge.exposeInMainWorld`, the bridge is never
 * installed at all — `window.electronAPI` is `undefined`, and since every call site guards
 * with `api?.method` the packaged app silently degrades to browser mode: no terminal, no
 * git, no file saving, no cloud AI, and no error anywhere. A single `require('os')` for the
 * machine's RAM did exactly this.
 *
 * Node built-ins belong in the main process, reached over IPC.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const PRELOAD = path.resolve(__dirname, '../../electron/preload.js');

/** Modules a sandboxed preload is allowed to pull in. */
const SANDBOX_SAFE = new Set(['electron', 'events', 'timers', 'timers/promises', 'url']);

/** Strips comments so prose about a banned pattern is not mistaken for the pattern. */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('preload sandbox safety', () => {
  const source = stripComments(fs.readFileSync(PRELOAD, 'utf8'));

  it('requires only modules available to a sandboxed preload', () => {
    const required = [...source.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1]);
    const unsafe = required.filter((m) => !SANDBOX_SAFE.has(m));

    expect(
      unsafe,
      `preload.js requires ${unsafe.join(', ')}, which a sandboxed preload cannot load. ` +
        `The require throws before contextBridge runs, so window.electronAPI ends up undefined ` +
        `and the whole desktop app silently falls back to browser mode. ` +
        `Move this to the main process and expose it over IPC.`
    ).toEqual([]);
  });

  it('exposes the bridge exactly once', () => {
    const calls = source.match(/contextBridge\.exposeInMainWorld/g) || [];
    expect(calls).toHaveLength(1);
  });

  it('does not reference Node globals unavailable in a sandboxed preload', () => {
    // `process.platform`, `process.versions` and `process.env` are still injected, but
    // filesystem-style globals are not.
    expect(source).not.toMatch(/\b__dirname\b/);
    expect(source).not.toMatch(/\b__filename\b/);
  });

  it('keeps every exposed method backed by a main-process handler', () => {
    const ipcDir = path.resolve(__dirname, '../../electron/ipc');
    const handlerSource = fs
      .readdirSync(ipcDir)
      .filter((f) => f.endsWith('.js'))
      .map((f) => fs.readFileSync(path.join(ipcDir, f), 'utf8'))
      .join('\n');
    const mainSource = fs.readFileSync(path.resolve(__dirname, '../../../index.js'), 'utf8');
    const registered = `${handlerSource}\n${mainSource}`;

    // Channels the preload invokes, versus channels the main process handles.
    const invoked = [...source.matchAll(/ipcRenderer\.invoke\(\s*'([^']+)'/g)].map((m) => m[1]);
    const missing = [...new Set(invoked)].filter(
      (channel) => !registered.includes(`'${channel}'`)
    );

    expect(
      missing,
      `These IPC channels are exposed to the renderer but no main-process handler registers ` +
        `them, so calling them rejects at runtime: ${missing.join(', ')}`
    ).toEqual([]);
  });
});
