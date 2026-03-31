"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { TUTORIALS } from '../../data/tutorials';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;

const TutorialOverlay: React.FC = () => {
  const {
    isTutorialActive,
    learningProgress,
    setView,
    advanceTutorial,
    completeTutorial,
    skipTutorial,
  } = useIDEStore();

  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);

  const tutorialId = learningProgress.activeTutorialId;
  const stepIndex = learningProgress.currentTutorialStep;
  const steps = tutorialId ? TUTORIALS[tutorialId] : null;
  const currentStep = steps && stepIndex < steps.length ? steps[stepIndex] : null;

  const updateSpotlight = useCallback(() => {
    if (!currentStep?.targetSelector) {
      setSpotlightRect(null);
      return;
    }
    const el = document.querySelector(currentStep.targetSelector);
    if (!el) {
      setSpotlightRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setSpotlightRect({
      top: rect.top - PADDING,
      left: rect.left - PADDING,
      width: rect.width + PADDING * 2,
      height: rect.height + PADDING * 2,
    });
  }, [currentStep]);

  // Switch view when step requires it
  useEffect(() => {
    if (currentStep?.targetView) {
      setView(currentStep.targetView);
    }
  }, [currentStep, setView]);

  // Recalculate spotlight position after view switch and on resize/scroll
  useEffect(() => {
    if (!isTutorialActive) return;

    // Delay initial measurement to let view transitions settle
    const timeout = setTimeout(updateSpotlight, 100);

    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [isTutorialActive, updateSpotlight]);

  if (!isTutorialActive || !steps || !currentStep) return null;

  const isLastStep = stepIndex === steps.length - 1;
  const isFirstStep = stepIndex === 0;
  const stepNumber = stepIndex + 1;
  const totalSteps = steps.length;

  // Determine card position: below target if in top half, above if in bottom half
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const targetInTopHalf = spotlightRect ? spotlightRect.top + spotlightRect.height / 2 < windowHeight / 2 : true;

  const cardStyle: React.CSSProperties = spotlightRect
    ? targetInTopHalf
      ? {
          position: 'fixed',
          top: spotlightRect.top + spotlightRect.height + 16,
          left: Math.max(16, Math.min(spotlightRect.left, window.innerWidth - 400)),
          maxWidth: 380,
        }
      : {
          position: 'fixed',
          bottom: windowHeight - spotlightRect.top + 16,
          left: Math.max(16, Math.min(spotlightRect.left, window.innerWidth - 400)),
          maxWidth: 380,
        }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: 420,
      };

  const handleNext = () => {
    if (isLastStep) {
      completeTutorial();
    } else {
      advanceTutorial();
    }
  };

  const handleBack = () => {
    // Go back by manipulating the step directly via store
    // advanceTutorial goes forward, so we need to set step back manually
    // The store only has advanceTutorial, so we re-start at previous step
    if (stepIndex > 0) {
      useIDEStore.setState((state) => ({
        learningProgress: {
          ...state.learningProgress,
          currentTutorialStep: state.learningProgress.currentTutorialStep - 1,
        },
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-[200]" aria-modal="true" role="dialog">
      {/* Backdrop with spotlight cutout */}
      <div
        className="absolute inset-0"
        style={
          spotlightRect
            ? {
                position: 'fixed',
                top: spotlightRect.top,
                left: spotlightRect.left,
                width: spotlightRect.width,
                height: spotlightRect.height,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
                borderRadius: 4,
                pointerEvents: 'none',
                zIndex: 200,
              }
            : {
                background: 'rgba(0,0,0,0.7)',
                zIndex: 200,
              }
        }
      />

      {/* Clickable backdrop area to prevent interaction outside spotlight */}
      {spotlightRect && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 199 }}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Instruction Card */}
      <div
        style={{ ...cardStyle, zIndex: 201 }}
        className="bg-surface/95 border border-primary shadow-neon p-5 w-full"
      >
        {/* Step counter */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
            Step {stepNumber} of {totalSteps}
          </span>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i < stepIndex ? 'bg-primary' : i === stepIndex ? 'bg-primary animate-pulse' : 'bg-muted/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-display font-bold text-text-main mb-2 tracking-wide">
          {currentStep.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted leading-relaxed mb-4">
          {currentStep.description}
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={skipTutorial}
            className="text-[10px] text-muted font-mono hover:text-text-main transition-colors"
          >
            Skip Tour
          </button>
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-muted border border-muted/30 hover:text-text-main hover:border-muted transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold bg-primary text-background hover:bg-[#0cf1f1] transition-all shadow-neon"
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <span className="material-symbols-outlined text-[14px]">arrow_forward</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
