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
    toggleLearningPath,
    openFile,
    ensureFiles,
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

  // Switch view when step requires it, and auto-open demo file for code view
  useEffect(() => {
    if (currentStep?.targetView) {
      setView(currentStep.targetView);
      // When the welcome tour switches to code view, open the first lesson file
      // so the editor isn't empty
      if (tutorialId === 'welcome-tour' && currentStep.targetView === 'code' && currentStep.id === 'welcome-4') {
        const { DEMO_FILES } = require('../../data/demoProject');
        const firstFile = DEMO_FILES.find((f: any) => f.name === 'lesson-1-hello.ts');
        if (firstFile) {
          ensureFiles([firstFile]);
          openFile(firstFile.path);
        }
      }
    }
  }, [currentStep, setView, tutorialId, openFile, ensureFiles]);

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
  // Clamp both axes so the card never leaves the viewport
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const targetInTopHalf = spotlightRect ? spotlightRect.top + spotlightRect.height / 2 < windowHeight / 2 : true;
  const CARD_MAX_W = Math.min(380, windowWidth - 32);
  const CARD_EST_H = 200; // estimated card height for clamping
  const EDGE_PAD = 16;

  const getCardStyle = (): React.CSSProperties => {
    if (!spotlightRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: 420,
      };
    }

    const clampedLeft = Math.max(EDGE_PAD, Math.min(spotlightRect.left, windowWidth - CARD_MAX_W - EDGE_PAD));

    if (targetInTopHalf) {
      // Place below the spotlight, but clamp so it doesn't overflow the bottom
      const idealTop = spotlightRect.top + spotlightRect.height + EDGE_PAD;
      const clampedTop = Math.min(idealTop, windowHeight - CARD_EST_H - EDGE_PAD);
      return {
        position: 'fixed',
        top: Math.max(EDGE_PAD, clampedTop),
        left: clampedLeft,
        maxWidth: CARD_MAX_W,
      };
    } else {
      // Place above the spotlight, but clamp so it doesn't overflow the top
      const idealBottom = windowHeight - spotlightRect.top + EDGE_PAD;
      const clampedBottom = Math.min(idealBottom, windowHeight - CARD_EST_H - EDGE_PAD);
      return {
        position: 'fixed',
        bottom: Math.max(EDGE_PAD, clampedBottom),
        left: clampedLeft,
        maxWidth: CARD_MAX_W,
      };
    }
  };

  const cardStyle = getCardStyle();

  const handleNext = () => {
    if (isLastStep) {
      completeTutorial();
      // After completing the welcome tour, open the Learning Path so beginners know what to do next
      if (tutorialId === 'welcome-tour') {
        toggleLearningPath(true);
      }
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
          <span className="text-[11px] font-mono text-muted uppercase tracking-widest">
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
            className="text-[11px] text-muted font-mono hover:text-text-main transition-colors"
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
