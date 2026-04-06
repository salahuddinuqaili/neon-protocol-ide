import { describe, it, expect } from 'vitest';
import { buildExplainPrompt } from '../../lib/explainPrompts';

describe('buildExplainPrompt', () => {
  const code = 'const x = 42;';
  const fileName = 'app.ts';
  const language = 'typescript';

  it('includes file context in all modes', () => {
    const modes = ['explain', 'line', 'simplify', 'ask'] as const;
    for (const mode of modes) {
      const result = buildExplainPrompt(code, mode, fileName, language);
      expect(result).toContain(fileName);
      expect(result).toContain(language);
    }
  });

  it('builds an explain prompt with analogy instructions', () => {
    const result = buildExplainPrompt(code, 'explain', fileName, language);
    expect(result).toContain('new to programming');
    expect(result).toContain('analogy');
    expect(result).toContain('line by line');
    expect(result).toContain(code);
  });

  it('builds a line prompt that is concise', () => {
    const result = buildExplainPrompt(code, 'line', fileName, language);
    expect(result).toContain('single line');
    expect(result).toContain('2-3 sentences');
    expect(result).toContain(code);
  });

  it('builds a simplify prompt with before/after instructions', () => {
    const result = buildExplainPrompt(code, 'simplify', fileName, language);
    expect(result).toContain('simpler');
    expect(result).toContain('simplified version');
    expect(result).toContain(code);
  });

  it('builds an ask prompt with the code block', () => {
    const result = buildExplainPrompt(code, 'ask', fileName, language);
    expect(result).toContain('selected this code');
    expect(result).toContain(code);
  });

  it('wraps code in a fenced code block with language', () => {
    const result = buildExplainPrompt(code, 'explain', fileName, language);
    expect(result).toContain('```typescript');
    expect(result).toContain('```');
  });

  it('handles multi-line code', () => {
    const multiLine = 'function greet(name: string) {\n  return `Hello, ${name}!`;\n}';
    const result = buildExplainPrompt(multiLine, 'explain', fileName, language);
    expect(result).toContain(multiLine);
  });

  it('handles unknown language gracefully', () => {
    const result = buildExplainPrompt(code, 'explain', 'data.csv', 'plaintext');
    expect(result).toContain('plaintext');
    expect(result).toContain('data.csv');
  });
});
