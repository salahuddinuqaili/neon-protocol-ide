"use client";

import React, { useState, useCallback } from 'react';
import { Challenge, ChallengeValidation } from '../../types';
import { useIDEStore } from '../../store/useIDEStore';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface ChallengePanelProps {
  challenge: Challenge;
  onClose: () => void;
}

function getBadge(attempts: number): { label: string; color: string } {
  if (attempts <= 1) return { label: 'Gold', color: 'text-yellow-400' };
  if (attempts <= 3) return { label: 'Silver', color: 'text-gray-300' };
  return { label: 'Bronze', color: 'text-amber-600' };
}

function runValidation(
  code: string,
  validation: ChallengeValidation,
  selectedChoice?: number
): { pass: boolean; message: string } {
  // Predict-output: check selected choice
  if (validation.choices && validation.correctChoice !== undefined) {
    if (selectedChoice === validation.correctChoice) {
      return { pass: true, message: 'Correct!' };
    }
    return { pass: false, message: `Not quite. The correct answer is: ${validation.choices[validation.correctChoice]}` };
  }

  // Required substrings
  if (validation.requiredSubstrings) {
    for (const sub of validation.requiredSubstrings) {
      if (!code.includes(sub)) {
        return { pass: false, message: `Your code should contain "${sub}"` };
      }
    }
  }

  // Forbidden substrings
  if (validation.forbiddenSubstrings) {
    for (const sub of validation.forbiddenSubstrings) {
      if (code.includes(sub)) {
        return { pass: false, message: `Your code should not contain "${sub}"` };
      }
    }
  }

  // Expected output
  if (validation.expectedOutput) {
    if (code.trim() === validation.expectedOutput.trim()) {
      return { pass: true, message: 'Output matches!' };
    }
  }

  // testFn — run dynamic validation
  if (validation.testFn) {
    try {
      const testFunc = new Function('code', validation.testFn);
      const result = testFunc(code);
      if (result && typeof result.pass === 'boolean') {
        return result;
      }
      return { pass: false, message: 'Validation returned an unexpected result.' };
    } catch (e: any) {
      return { pass: false, message: `Validation error: ${e.message}` };
    }
  }

  // If only substring checks were used and we got here, they all passed
  if (validation.requiredSubstrings || validation.forbiddenSubstrings) {
    return { pass: true, message: 'All checks passed!' };
  }

  return { pass: true, message: 'Looks good!' };
}

const DifficultyStars: React.FC<{ level: 1 | 2 | 3 }> = ({ level }) => (
  <span className="inline-flex gap-0.5">
    {[1, 2, 3].map(i => (
      <span key={i} className={`text-[12px] ${i <= level ? 'text-yellow-400' : 'text-muted/30'}`}>&#x2605;</span>
    ))}
  </span>
);

const ChallengePanel: React.FC<ChallengePanelProps> = ({ challenge, onClose }) => {
  const { completeChallenge, recordChallengeAttempt, learningProgress, addToast } = useIDEStore();
  const [code, setCode] = useState(challenge.starterCode);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [result, setResult] = useState<{ pass: boolean; message: string } | null>(null);
  const [isCompleted, setIsCompleted] = useState(
    learningProgress.completedChallenges.includes(challenge.id)
  );

  const attempts = learningProgress.challengeAttempts[challenge.id] || 0;
  const isPredictOutput = challenge.type === 'predict-output';

  const trapRef = useFocusTrap<HTMLDivElement>(onClose);

  const handleCheck = useCallback(() => {
    recordChallengeAttempt(challenge.id);
    const validationResult = runValidation(code, challenge.validation, selectedChoice ?? undefined);
    setResult(validationResult);

    if (validationResult.pass) {
      completeChallenge(challenge.id);
      setIsCompleted(true);
      addToast(`Challenge complete: ${challenge.title}`, 'success');
    }
  }, [code, selectedChoice, challenge, recordChallengeAttempt, completeChallenge, addToast]);

  const handleRevealHint = () => {
    if (hintsRevealed < challenge.hints.length) {
      setHintsRevealed(h => h + 1);
    }
  };

  const badge = getBadge(attempts);

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Challenge">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div ref={trapRef} className="relative z-10 w-full max-w-4xl max-h-[85vh] mx-4 bg-surface border border-primary shadow-neon flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-primary">fitness_center</span>
            <div>
              <h2 className="text-sm font-bold text-text-main">{challenge.title}</h2>
              <div className="flex items-center gap-2 text-[11px] text-muted font-mono">
                <span className="capitalize">{challenge.type.replace(/-/g, ' ')}</span>
                <span>&middot;</span>
                <DifficultyStars level={challenge.difficulty} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text-main p-1">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Content — split view */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Instructions + hints */}
          <div className="w-1/2 flex flex-col border-r border-muted/30 overflow-y-auto custom-scrollbar p-4">
            <div className="bg-background border border-muted/30 p-4 mb-4">
              <p className="text-xs text-text-main leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
            </div>

            {/* Hints */}
            {challenge.hints.length > 0 && (
              <div className="mb-4">
                {hintsRevealed > 0 && (
                  <div className="flex flex-col gap-2 mb-2">
                    {challenge.hints.slice(0, hintsRevealed).map((hint, i) => (
                      <div key={i} className="bg-accent-ai/5 border border-accent-ai/20 p-2 text-[11px] text-text-main">
                        <span className="text-accent-ai font-bold mr-1">Hint {i + 1}:</span> {hint}
                      </div>
                    ))}
                  </div>
                )}
                {hintsRevealed < challenge.hints.length && (
                  <button
                    onClick={handleRevealHint}
                    className="text-[11px] text-accent-ai hover:text-text-main flex items-center gap-1 font-mono"
                  >
                    <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                    Need a hint? ({challenge.hints.length - hintsRevealed} remaining)
                  </button>
                )}
              </div>
            )}

            {/* Result feedback */}
            {result && (
              <div className={`border p-3 mb-4 ${
                result.pass
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-accent-error/5 border-accent-error/30'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`material-symbols-outlined text-sm ${result.pass ? 'text-primary' : 'text-accent-error'}`}>
                    {result.pass ? 'check_circle' : 'cancel'}
                  </span>
                  <span className={`text-xs font-bold ${result.pass ? 'text-primary' : 'text-accent-error'}`}>
                    {result.pass ? 'Passed!' : 'Not quite...'}
                  </span>
                </div>
                <p className="text-[11px] text-text-main">{result.message}</p>
                {result.pass && (
                  <div className="mt-2 flex items-center gap-2 text-[11px]">
                    <span className={badge.color}>&#x2605; {badge.label} Badge</span>
                    <span className="text-muted">({attempts + 1} {attempts + 1 === 1 ? 'attempt' : 'attempts'})</span>
                  </div>
                )}
              </div>
            )}

            {/* Completion celebration */}
            {isCompleted && (
              <div className="bg-primary/5 border border-primary/30 p-4 text-center">
                <span className="material-symbols-outlined text-3xl text-primary">celebration</span>
                <p className="text-sm font-bold text-primary mt-1">Challenge Complete!</p>
                <p className="text-[11px] text-muted mt-1">{badge.label} badge earned</p>
              </div>
            )}
          </div>

          {/* Right: Code editor or choices */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            {isPredictOutput ? (
              <div className="flex-1 p-4 flex flex-col gap-3">
                <p className="text-[11px] text-muted font-bold uppercase tracking-wider">Choose your answer:</p>
                {challenge.validation.choices?.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedChoice(i)}
                    disabled={isCompleted}
                    className={`text-left p-3 border text-xs font-mono transition-all ${
                      selectedChoice === i
                        ? 'border-primary bg-primary/10 text-text-main'
                        : 'border-muted/30 bg-background text-text-main hover:border-primary/50'
                    } ${isCompleted ? 'opacity-60' : ''}`}
                  >
                    <span className={`inline-flex items-center justify-center w-5 h-5 border text-[10px] mr-2 ${
                      selectedChoice === i ? 'border-primary text-primary' : 'border-muted/50 text-muted'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {choice}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-background border-b border-muted/30">
                  <span className="text-[11px] text-muted font-mono">{challenge.language}</span>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isCompleted}
                  spellCheck={false}
                  className="flex-1 bg-[#181A20] text-text-main font-mono text-xs p-4 resize-none outline-none custom-scrollbar"
                  placeholder="Write your code here..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-4 border-t border-muted/30 shrink-0">
          <button
            onClick={onClose}
            className="text-[11px] text-muted hover:text-text-main font-mono"
          >
            {isCompleted ? 'Close' : 'Skip Challenge'}
          </button>
          <div className="flex items-center gap-3">
            {attempts > 0 && !isCompleted && (
              <span className="text-[11px] text-muted font-mono">
                {attempts} {attempts === 1 ? 'attempt' : 'attempts'}
              </span>
            )}
            {!isCompleted && (
              <button
                onClick={handleCheck}
                disabled={isPredictOutput && selectedChoice === null}
                className="flex items-center gap-1 px-4 py-1.5 bg-primary text-background text-[11px] font-bold uppercase tracking-wider hover:bg-[#0cf1f1] transition-all disabled:opacity-50"
              >
                Check My Answer
                <span className="material-symbols-outlined text-[14px]">check</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { runValidation };
export default ChallengePanel;
