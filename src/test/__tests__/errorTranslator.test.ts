import { describe, it, expect } from 'vitest';
import { translateError } from '../../lib/errorTranslator';

describe('translateError', () => {
  it('returns null for unrecognized errors', () => {
    expect(translateError('some random text that is not an error')).toBeNull();
  });

  it('matches ECONNREFUSED', () => {
    const result = translateError('Error: connect ECONNREFUSED 127.0.0.1:11434');
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Connection Refused');
    expect(result!.severity).toBe('error');
    expect(result!.relatedLessonId).toBe('local-vs-cloud-ai');
  });

  it('matches TypeError: Cannot read properties of undefined', () => {
    const result = translateError("TypeError: Cannot read properties of undefined (reading 'map')");
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Missing Value Error');
    expect(result!.severity).toBe('error');
  });

  it('matches old-style TypeError: Cannot read property of undefined', () => {
    const result = translateError("TypeError: Cannot read property 'name' of undefined");
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Missing Value Error');
  });

  it('matches SyntaxError', () => {
    const result = translateError('SyntaxError: Unexpected token }');
    expect(result).not.toBeNull();
    expect(result!.title).toContain('Syntax Error');
    expect(result!.relatedLessonId).toBe('reading-typescript');
  });

  it('matches ReferenceError', () => {
    const result = translateError('ReferenceError: myVar is not defined');
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Unknown Name Error');
  });

  it('matches 401 Unauthorized', () => {
    const result = translateError('Request failed with status 401 Unauthorized');
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Authentication Failed');
    expect(result!.suggestedFix).toBeTruthy();
  });

  it('matches rate limit / 429', () => {
    const result = translateError('Error: 429 Too Many Requests');
    expect(result).not.toBeNull();
    expect(result!.title).toContain('Rate Limited');
    expect(result!.severity).toBe('warning');
  });

  it('matches timeout errors', () => {
    const result = translateError('Error: ETIMEDOUT connecting to api.openai.com');
    expect(result).not.toBeNull();
    expect(result!.title).toContain('Timed Out');
    expect(result!.severity).toBe('warning');
  });

  it('matches module not found', () => {
    const result = translateError("Error: Cannot find module 'express'");
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Missing Package');
    expect(result!.suggestedFix).toContain('npm install');
  });

  it('matches TypeScript errors', () => {
    const result = translateError("src/app.ts(10,5): error TS2304: Cannot find name 'foo'.");
    expect(result).not.toBeNull();
    expect(result!.title).toContain('TypeScript');
  });

  it('matches git not a repository', () => {
    const result = translateError('fatal: not a git repository (or any of the parent directories): .git');
    expect(result).not.toBeNull();
    expect(result!.title).toContain('Not a Git Repository');
  });

  it('matches ENOENT / file not found', () => {
    const result = translateError("Error: ENOENT: no such file or directory, open '/path/to/file.txt'");
    expect(result).not.toBeNull();
    expect(result!.title).toContain('Not Found');
  });

  it('matches permission denied', () => {
    const result = translateError('Error: EACCES: permission denied, open /etc/passwd');
    expect(result).not.toBeNull();
    expect(result!.title).toContain('Permission Denied');
  });

  it('matches port already in use', () => {
    const result = translateError('Error: listen EADDRINUSE: address already in use :::3000');
    expect(result).not.toBeNull();
    expect(result!.title).toContain('Port Already in Use');
  });

  it('matches out of memory', () => {
    const result = translateError('FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory');
    expect(result).not.toBeNull();
    expect(result!.title).toContain('Out of Memory');
  });

  it('matches CORS errors', () => {
    const result = translateError("Access to fetch at 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header");
    expect(result).not.toBeNull();
    expect(result!.title).toContain('Cross-Origin');
  });

  it('matches not a function', () => {
    const result = translateError('TypeError: myVar.forEach is not a function');
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Not a Function');
  });

  it('preserves the raw error text', () => {
    const raw = 'Error: connect ECONNREFUSED 127.0.0.1:11434';
    const result = translateError(raw);
    expect(result!.rawError).toBe(raw);
  });

  it('generates unique IDs', () => {
    const a = translateError('SyntaxError: Unexpected token');
    const b = translateError('SyntaxError: Unexpected end of input');
    expect(a!.id).not.toBe(b!.id);
  });

  it('returns commonCauses as a non-empty array', () => {
    const result = translateError('Error: ECONNREFUSED');
    expect(Array.isArray(result!.commonCauses)).toBe(true);
    expect(result!.commonCauses.length).toBeGreaterThan(0);
  });
});
