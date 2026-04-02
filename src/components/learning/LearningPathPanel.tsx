"use client";

import React, { useState } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { LESSONS } from '../../data/lessons';
import { Lesson, LessonCategory } from '../../types';

const TRACK_INFO: Record<LessonCategory, { label: string; icon: string; color: string }> = {
  'coding-basics': { label: 'Coding Basics', icon: 'code', color: 'text-primary' },
  'architecture': { label: 'Architecture', icon: 'account_tree', color: 'text-[#FF9F43]' },
  'llm-orchestration': { label: 'LLM Orchestration', icon: 'smart_toy', color: 'text-accent-ai' },
};

const LessonStepView: React.FC<{
  lesson: Lesson;
  onComplete: () => void;
  onBack: () => void;
}> = ({ lesson, onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { setView, openFile } = useIDEStore();
  const step = lesson.steps[currentStep];
  const isLast = currentStep === lesson.steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const handleOpenFile = (file: string) => {
    setView('code');
    openFile(file);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-muted/30">
        <button onClick={onBack} className="text-muted hover:text-text-main">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-text-main truncate">{lesson.title}</h3>
          <span className="text-[11px] text-muted font-mono">Step {currentStep + 1} of {lesson.steps.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="bg-surface border border-muted/30 p-4 mb-4">
          <p className="text-xs text-text-main leading-relaxed font-mono">{step.instruction}</p>
        </div>

        {step.codeHighlight && (
          <button
            onClick={() => handleOpenFile(step.codeHighlight!.file)}
            className="flex items-center gap-2 text-[11px] text-primary font-mono hover:underline mb-3"
          >
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            Open {step.codeHighlight.file.split('/').pop()} (lines {step.codeHighlight.startLine}-{step.codeHighlight.endLine})
          </button>
        )}

        {step.nodeHighlight && (
          <div className="flex items-center gap-2 text-[11px] text-accent-ai font-mono mb-3">
            <span className="material-symbols-outlined text-[14px]">hub</span>
            Look for the "{step.nodeHighlight}" node on the map
          </div>
        )}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-6">
          {lesson.steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 transition-colors ${
                i === currentStep ? 'bg-primary' : i < currentStep ? 'bg-primary/40' : 'bg-muted/30'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 border-t border-muted/30">
        <button
          onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1 text-[11px] text-muted hover:text-text-main disabled:opacity-30 font-mono"
        >
          <span className="material-symbols-outlined text-[14px]">chevron_left</span> Back
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-1 px-4 py-1.5 bg-primary text-background text-[11px] font-bold uppercase tracking-wider hover:bg-[#0cf1f1] transition-all"
        >
          {isLast ? 'Complete' : 'Next'}
          <span className="material-symbols-outlined text-[14px]">{isLast ? 'check' : 'chevron_right'}</span>
        </button>
      </div>
    </div>
  );
};

const LessonCard: React.FC<{
  lesson: Lesson;
  isCompleted: boolean;
  isLocked: boolean;
  missingPrereqs: string[];
  onClick: () => void;
}> = ({ lesson, isCompleted, isLocked, missingPrereqs, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`w-full text-left p-3 border transition-all ${
        isCompleted
          ? 'bg-primary/5 border-primary/30'
          : isLocked
          ? 'bg-surface/50 border-muted/20 opacity-50 cursor-not-allowed'
          : 'bg-surface border-muted/30 hover:border-primary hover:shadow-neon'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`material-symbols-outlined text-sm mt-0.5 shrink-0 ${
          isCompleted ? 'text-primary' : isLocked ? 'text-muted/30' : 'text-muted'
        }`}>
          {isCompleted ? 'check_circle' : isLocked ? 'lock' : 'play_circle'}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-text-main truncate">{lesson.title}</h4>
          <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{lesson.description}</p>
          {isLocked && missingPrereqs.length > 0 && (
            <p className="text-[11px] text-muted/60 mt-1 font-mono">
              Requires: {missingPrereqs.join(', ')}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

const LearningPathPanel: React.FC = () => {
  const { isLearningPathOpen, toggleLearningPath, learningProgress, completeLesson, addToast } = useIDEStore();
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  if (!isLearningPathOpen) return null;

  const completedSet = new Set(learningProgress.completedLessons);
  const totalLessons = LESSONS.length;
  const completedCount = learningProgress.completedLessons.length;

  const isLessonLocked = (lesson: Lesson): boolean => {
    return lesson.prerequisiteLessons.some(id => !completedSet.has(id));
  };

  const getMissingPrereqs = (lesson: Lesson): string[] => {
    return lesson.prerequisiteLessons
      .filter(id => !completedSet.has(id))
      .map(id => LESSONS.find(l => l.id === id)?.title || id);
  };

  const handleCompleteLesson = (lessonId: string) => {
    completeLesson(lessonId);
    const lesson = LESSONS.find(l => l.id === lessonId);
    addToast(`Lesson completed: ${lesson?.title}`, 'success');
    setActiveLesson(null);
  };

  const activeLessonData = activeLesson ? LESSONS.find(l => l.id === activeLesson) : null;

  const tracks = Object.entries(TRACK_INFO).map(([category, info]) => ({
    category: category as LessonCategory,
    ...info,
    lessons: LESSONS.filter(l => l.category === category),
  }));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => toggleLearningPath(false)} />
      <div className="relative z-10 w-full max-w-3xl max-h-[80vh] mx-4 bg-surface border border-primary shadow-neon flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl text-primary">school</span>
            <div>
              <h2 className="text-sm font-bold text-text-main uppercase tracking-wide">Learning Path</h2>
              <span className="text-[11px] text-muted font-mono">{completedCount} of {totalLessons} lessons completed</span>
            </div>
          </div>
          <button onClick={() => toggleLearningPath(false)} className="text-muted hover:text-text-main p-1">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-background shrink-0">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeLessonData ? (
            <LessonStepView
              lesson={activeLessonData}
              onComplete={() => handleCompleteLesson(activeLessonData.id)}
              onBack={() => setActiveLesson(null)}
            />
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tracks.map(track => (
                <div key={track.category}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`material-symbols-outlined text-sm ${track.color}`}>{track.icon}</span>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-main">{track.label}</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {track.lessons.map(lesson => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        isCompleted={completedSet.has(lesson.id)}
                        isLocked={isLessonLocked(lesson)}
                        missingPrereqs={getMissingPrereqs(lesson)}
                        onClick={() => setActiveLesson(lesson.id)}
                      />
                    ))}
                    {track.lessons.length === 0 && (
                      <p className="text-[11px] text-muted/50 font-mono">Coming soon</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPathPanel;
