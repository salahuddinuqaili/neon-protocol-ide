import { describe, it, expect } from 'vitest';
import { LESSONS } from '../../data/lessons';
import { GLOSSARY_ENTRIES } from '../../data/glossary';
import { DEMO_FILES } from '../../data/demoProject';

describe('Educational content integrity', () => {
  describe('lessons', () => {
    it('has unique lesson IDs', () => {
      const ids = LESSONS.map(l => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('has no broken prerequisite references', () => {
      const allIds = new Set(LESSONS.map(l => l.id));
      for (const lesson of LESSONS) {
        for (const prereq of lesson.prerequisiteLessons) {
          expect(allIds.has(prereq), `Lesson "${lesson.id}" references non-existent prerequisite "${prereq}"`).toBe(true);
        }
      }
    });

    it('has no circular prerequisites', () => {
      const lessonMap = new Map(LESSONS.map(l => [l.id, l]));
      for (const lesson of LESSONS) {
        const visited = new Set<string>();
        const stack = [...lesson.prerequisiteLessons];
        while (stack.length > 0) {
          const id = stack.pop()!;
          if (id === lesson.id) {
            throw new Error(`Circular prerequisite: ${lesson.id} -> ... -> ${id}`);
          }
          if (visited.has(id)) continue;
          visited.add(id);
          const dep = lessonMap.get(id);
          if (dep) stack.push(...dep.prerequisiteLessons);
        }
      }
    });

    it('every lesson has at least 2 steps', () => {
      for (const lesson of LESSONS) {
        expect(lesson.steps.length, `Lesson "${lesson.id}" has ${lesson.steps.length} step(s)`).toBeGreaterThanOrEqual(2);
      }
    });

    it('all codeHighlight files exist in demo project', () => {
      const demoFilePaths = new Set(DEMO_FILES.map(f => f.path));
      for (const lesson of LESSONS) {
        for (const step of lesson.steps) {
          if (step.codeHighlight) {
            expect(demoFilePaths.has(step.codeHighlight.file),
              `Lesson "${lesson.id}" references missing demo file "${step.codeHighlight.file}"`).toBe(true);
          }
        }
      }
    });

    it('covers all 4 tracks', () => {
      const categories = new Set(LESSONS.map(l => l.category));
      expect(categories).toContain('coding-basics');
      expect(categories).toContain('architecture');
      expect(categories).toContain('llm-orchestration');
      expect(categories).toContain('git-collaboration');
    });
  });

  describe('glossary', () => {
    it('has unique entry IDs', () => {
      const ids = GLOSSARY_ENTRIES.map(e => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('related terms reference existing entries', () => {
      const allIds = new Set(GLOSSARY_ENTRIES.map(e => e.id));
      for (const entry of GLOSSARY_ENTRIES) {
        for (const related of entry.relatedTerms) {
          expect(allIds.has(related),
            `Glossary entry "${entry.id}" references non-existent related term "${related}"`).toBe(true);
        }
      }
    });

    it('covers all 4 categories', () => {
      const categories = new Set(GLOSSARY_ENTRIES.map(e => e.category));
      expect(categories).toContain('coding');
      expect(categories).toContain('llm');
      expect(categories).toContain('architecture');
      expect(categories).toContain('ide');
    });

    it('has at least 40 entries', () => {
      expect(GLOSSARY_ENTRIES.length).toBeGreaterThanOrEqual(40);
    });
  });

  describe('demo project', () => {
    it('has unique file paths', () => {
      const paths = DEMO_FILES.map(f => f.path);
      expect(new Set(paths).size).toBe(paths.length);
    });

    it('all files have non-empty content', () => {
      for (const file of DEMO_FILES) {
        expect(file.content.trim().length, `Demo file "${file.path}" has empty content`).toBeGreaterThan(0);
      }
    });

    it('has a README', () => {
      expect(DEMO_FILES.some(f => f.name === 'README.md')).toBe(true);
    });
  });
});
