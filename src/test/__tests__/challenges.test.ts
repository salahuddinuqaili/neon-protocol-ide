import { describe, it, expect, beforeEach } from 'vitest';
import { CHALLENGES } from '../../data/challenges';
import { runValidation } from '../../components/learning/ChallengePanel';
import { useIDEStore } from '../../store/useIDEStore';

describe('Challenge data integrity', () => {
  it('every challenge has a valid id, lessonId, and type', () => {
    for (const c of CHALLENGES) {
      expect(c.id).toBeTruthy();
      expect(c.lessonId).toBeTruthy();
      expect(['fill-in-the-blank', 'fix-the-bug', 'predict-output', 'free-code']).toContain(c.type);
    }
  });

  it('predict-output challenges have choices and correctChoice', () => {
    const predictChallenges = CHALLENGES.filter(c => c.type === 'predict-output');
    expect(predictChallenges.length).toBeGreaterThan(0);
    for (const c of predictChallenges) {
      expect(c.validation.choices).toBeDefined();
      expect(c.validation.choices!.length).toBeGreaterThan(1);
      expect(c.validation.correctChoice).toBeDefined();
      expect(c.validation.correctChoice!).toBeGreaterThanOrEqual(0);
      expect(c.validation.correctChoice!).toBeLessThan(c.validation.choices!.length);
    }
  });

  it('non-predict challenges have at least one validation method', () => {
    const nonPredict = CHALLENGES.filter(c => c.type !== 'predict-output');
    for (const c of nonPredict) {
      const v = c.validation;
      const hasValidation = v.testFn || v.expectedOutput || v.requiredSubstrings || v.forbiddenSubstrings;
      expect(hasValidation).toBeTruthy();
    }
  });

  it('has at least 5 challenges across 3 lessons', () => {
    expect(CHALLENGES.length).toBeGreaterThanOrEqual(5);
    const lessonIds = new Set(CHALLENGES.map(c => c.lessonId));
    expect(lessonIds.size).toBeGreaterThanOrEqual(3);
  });

  it('all challenge IDs are unique', () => {
    const ids = CHALLENGES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('runValidation', () => {
  it('validates predict-output with correct choice', () => {
    const result = runValidation('', { choices: ['A', 'B', 'C'], correctChoice: 1 }, 1);
    expect(result.pass).toBe(true);
  });

  it('rejects predict-output with wrong choice', () => {
    const result = runValidation('', { choices: ['A', 'B', 'C'], correctChoice: 1 }, 0);
    expect(result.pass).toBe(false);
    expect(result.message).toContain('B');
  });

  it('checks requiredSubstrings', () => {
    const result = runValidation('function double(n) { return n * 2; }', {
      requiredSubstrings: ['function', 'return'],
    });
    expect(result.pass).toBe(true);
  });

  it('fails when requiredSubstring is missing', () => {
    const result = runValidation('const double = (n) => n * 2;', {
      requiredSubstrings: ['function', 'return'],
    });
    expect(result.pass).toBe(false);
    expect(result.message).toContain('function');
  });

  it('checks forbiddenSubstrings', () => {
    const result = runValidation('console.log("hello")', {
      forbiddenSubstrings: ['eval'],
    });
    expect(result.pass).toBe(true);
  });

  it('fails when forbiddenSubstring is present', () => {
    const result = runValidation('eval("bad")', {
      forbiddenSubstrings: ['eval'],
    });
    expect(result.pass).toBe(false);
    expect(result.message).toContain('eval');
  });

  it('runs testFn for dynamic validation', () => {
    const testFn = `
      if (code.includes('double')) return { pass: true, message: 'Found double' };
      return { pass: false, message: 'Missing double' };
    `;
    const pass = runValidation('function double() {}', { testFn });
    expect(pass.pass).toBe(true);

    const fail = runValidation('function triple() {}', { testFn });
    expect(fail.pass).toBe(false);
  });

  it('handles testFn errors gracefully', () => {
    const testFn = 'throw new Error("test error");';
    const result = runValidation('code', { testFn });
    expect(result.pass).toBe(false);
    expect(result.message).toContain('test error');
  });

  it('validates the actual double function challenge', () => {
    const challenge = CHALLENGES.find(c => c.id === 'challenge-function-basics')!;
    const correctCode = 'function double(n) { return n * 2; }';
    const result = runValidation(correctCode, challenge.validation);
    expect(result.pass).toBe(true);
  });

  it('rejects incorrect double function', () => {
    const challenge = CHALLENGES.find(c => c.id === 'challenge-function-basics')!;
    const wrongCode = 'function double(n) { return n + 2; }';
    const result = runValidation(wrongCode, challenge.validation);
    expect(result.pass).toBe(false);
  });
});

describe('Store challenge actions', () => {
  beforeEach(() => {
    useIDEStore.setState({
      learningProgress: {
        completedSteps: [],
        completedLessons: [],
        completedChallenges: [],
        challengeAttempts: {},
        currentTutorialStep: 0,
        activeTutorialId: null,
      },
    });
  });

  it('recordChallengeAttempt increments the attempt counter', () => {
    useIDEStore.getState().recordChallengeAttempt('challenge-1');
    expect(useIDEStore.getState().learningProgress.challengeAttempts['challenge-1']).toBe(1);
    useIDEStore.getState().recordChallengeAttempt('challenge-1');
    expect(useIDEStore.getState().learningProgress.challengeAttempts['challenge-1']).toBe(2);
  });

  it('completeChallenge adds to completedChallenges', () => {
    useIDEStore.getState().completeChallenge('challenge-1');
    expect(useIDEStore.getState().learningProgress.completedChallenges).toContain('challenge-1');
  });

  it('completeChallenge is idempotent', () => {
    useIDEStore.getState().completeChallenge('challenge-1');
    useIDEStore.getState().completeChallenge('challenge-1');
    expect(useIDEStore.getState().learningProgress.completedChallenges.filter((id: string) => id === 'challenge-1').length).toBe(1);
  });

  it('startChallenge initializes attempt counter', () => {
    useIDEStore.getState().startChallenge('challenge-2');
    expect(useIDEStore.getState().learningProgress.challengeAttempts['challenge-2']).toBe(0);
  });
});
