"use client";

import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { DEMO_FILES } from '../../data/demoProject';

const WelcomeScreen: React.FC = () => {
  const { setOnboardingComplete, setProject, setView, recentProjects, setLearningMode, startTutorial } = useIDEStore();

  const handleBeginner = () => {
    setLearningMode('beginner');
    setProject('demo-project', DEMO_FILES);
    setOnboardingComplete();
    setView('blueprint');
    startTutorial('welcome-tour');
  };

  const handleExperienced = () => {
    setLearningMode('experienced');
    setOnboardingComplete();
  };

  const handleSkip = () => {
    setOnboardingComplete();
  };

  return (
    <div className="absolute inset-0 z-[100] bg-background flex items-center justify-center overflow-y-auto">
      <div className="max-w-xl w-full px-4 sm:px-8 py-6 sm:py-10 my-auto">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="material-symbols-outlined text-4xl text-primary">architecture</span>
            <h1 className="text-3xl font-display font-bold text-text-main tracking-wide uppercase">
              Neon Protocol IDE
            </h1>
          </div>
          <p className="text-sm text-muted font-mono">
            See how your app is built, then change it — with AI to help you.
          </p>
        </div>

        {/* What's inside — informational, clearly non-interactive */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-8 sm:mb-10 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-lg text-muted">map</span>
            <span className="text-[11px] text-muted font-mono">Visual Map</span>
          </div>
          <span className="text-muted/30">+</span>
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-lg text-muted">code</span>
            <span className="text-[11px] text-muted font-mono">Code Editor</span>
          </div>
          <span className="text-muted/30">+</span>
          <div className="flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-lg text-accent-ai">smart_toy</span>
            <span className="text-[11px] text-muted font-mono">AI Assistant</span>
          </div>
        </div>

        {/* Primary choice — the main decision */}
        <h2 className="text-[11px] text-muted uppercase tracking-widest font-bold text-center mb-4">
          How would you like to start?
        </h2>

        <div className="flex flex-col gap-3 mb-8">
          {/* Beginner — recommended path */}
          <button
            onClick={handleBeginner}
            className="w-full flex items-center gap-4 p-4 bg-surface border-2 border-primary/60 text-left hover:border-primary hover:shadow-neon transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-primary shrink-0 group-hover:scale-110 transition-transform">
              school
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-main">I'm New to Coding</h3>
                <span className="text-[10px] font-mono text-background bg-primary/80 px-1.5 py-0.5 uppercase tracking-wider">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed mt-1">
                Guided tour + demo project with step-by-step lessons
              </p>
            </div>
            <span className="material-symbols-outlined text-sm text-primary shrink-0">arrow_forward</span>
          </button>

          {/* Experienced */}
          <button
            onClick={handleExperienced}
            className="w-full flex items-center gap-4 p-4 bg-surface border border-muted/30 text-left hover:border-muted hover:bg-surface-hover transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-muted shrink-0 group-hover:text-text-main transition-colors">
              code
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-text-main">I Have Experience</h3>
              <p className="text-xs text-muted leading-relaxed mt-1">
                Jump straight in — open your own project and start building
              </p>
            </div>
            <span className="material-symbols-outlined text-sm text-muted shrink-0">arrow_forward</span>
          </button>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[11px] text-muted uppercase tracking-widest font-bold text-center mb-3">Recent Projects</h3>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {recentProjects.map(name => (
                <button
                  key={name}
                  onClick={handleSkip}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-muted/30 text-text-main text-xs font-mono hover:border-primary hover:shadow-neon transition-all"
                >
                  <span className="material-symbols-outlined text-sm text-primary">folder</span>
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tertiary skip */}
        <p className="text-center">
          <button
            onClick={handleSkip}
            className="text-[11px] text-muted/60 font-mono hover:text-muted transition-colors"
          >
            Skip setup
          </button>
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
