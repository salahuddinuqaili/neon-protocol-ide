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

  const handleTryDemo = () => {
    setLearningMode('beginner');
    setProject('demo-project', DEMO_FILES);
    setOnboardingComplete();
    setView('blueprint');
    startTutorial('welcome-tour');
  };

  const handleSkip = () => {
    setOnboardingComplete();
  };

  return (
    <div className="absolute inset-0 z-[100] bg-background flex items-center justify-center">
      <div className="max-w-2xl w-full px-8">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="material-symbols-outlined text-4xl text-primary">architecture</span>
            <h1 className="text-3xl font-display font-bold text-text-main tracking-wide uppercase">
              Neon Protocol IDE
            </h1>
          </div>
          <p className="text-sm text-muted font-mono">
            See how your app is built, then change it — with AI to help you.
          </p>
        </div>

        {/* Feature Cards — beginner-friendly language */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-surface border border-muted/30 p-5 hover:border-primary hover:shadow-neon transition-all">
            <span className="material-symbols-outlined text-2xl text-primary mb-3 block">map</span>
            <h3 className="text-sm font-bold text-text-main mb-2 uppercase tracking-wide">Visual Map</h3>
            <p className="text-xs text-muted leading-relaxed">
              See your project as a visual diagram. Click any box to learn what it does and how it connects to other parts.
            </p>
          </div>
          <div className="bg-surface border border-muted/30 p-5 hover:border-primary hover:shadow-neon transition-all">
            <span className="material-symbols-outlined text-2xl text-primary mb-3 block">code</span>
            <h3 className="text-sm font-bold text-text-main mb-2 uppercase tracking-wide">Code Editor</h3>
            <p className="text-xs text-muted leading-relaxed">
              Read and edit the actual code files. Changes are highlighted so you always know what you've modified.
            </p>
          </div>
          <div className="bg-surface border border-muted/30 p-5 hover:border-primary hover:shadow-neon transition-all">
            <span className="material-symbols-outlined text-2xl text-accent-ai mb-3 block">smart_toy</span>
            <h3 className="text-sm font-bold text-text-main mb-2 uppercase tracking-wide">AI Assistant</h3>
            <p className="text-xs text-muted leading-relaxed">
              Ask questions about your code in plain English. The AI explains what things do and helps you make changes.
            </p>
          </div>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="mb-8">
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
            <p className="text-center text-[11px] text-muted/50 mt-2 font-mono">Re-open from the sidebar file explorer</p>
          </div>
        )}

        {/* Learning Mode Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleBeginner}
            className="bg-surface border border-muted/30 p-5 text-left hover:border-primary hover:shadow-neon transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-primary mb-3 block group-hover:scale-110 transition-transform">school</span>
            <h3 className="text-sm font-bold text-text-main mb-2 uppercase tracking-wide">I'm New to Coding</h3>
            <p className="text-xs text-muted leading-relaxed">
              Start with a guided tour and a demo project with step-by-step lessons. Perfect for absolute beginners.
            </p>
          </button>
          <button
            onClick={handleExperienced}
            className="bg-surface border border-muted/30 p-5 text-left hover:border-primary hover:shadow-neon transition-all group"
          >
            <span className="material-symbols-outlined text-2xl text-primary mb-3 block group-hover:scale-110 transition-transform">code</span>
            <h3 className="text-sm font-bold text-text-main mb-2 uppercase tracking-wide">I Have Experience</h3>
            <p className="text-xs text-muted leading-relaxed">
              Jump straight into the IDE. Open your own project and start building with the AI copilot right away.
            </p>
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleTryDemo}
            className="px-8 py-3 bg-primary text-background font-bold text-xs uppercase tracking-widest shadow-neon hover:bg-[#0cf1f1] transition-all"
          >
            Explore a Demo Project
          </button>
          <button
            onClick={handleSkip}
            className="px-6 py-2 text-muted text-xs font-mono hover:text-text-main transition-colors"
          >
            Skip — I'll open my own project
          </button>
          <button
            onClick={handleTryDemo}
            className="text-[11px] text-primary/70 font-mono hover:text-primary transition-colors underline underline-offset-2"
          >
            Take the guided tour
          </button>
        </div>

        <p className="text-center text-[11px] text-muted/30 mt-8 font-mono">
          Works best in Chrome or Edge
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
