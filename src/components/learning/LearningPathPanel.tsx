"use client";

import React, { useState } from 'react';
import { useIDEStore } from '../../store/useIDEStore';
import { LESSONS } from '../../data/lessons';
import { DEMO_FILES } from '../../data/demoProject';
import { Lesson, LessonCategory } from '../../types';

const TRACK_INFO: Record<LessonCategory, { label: string; icon: string; color: string }> = {
  'coding-basics': { label: 'Coding Basics', icon: 'code', color: 'text-primary' },
  'architecture': { label: 'Architecture', icon: 'account_tree', color: 'text-[#FF9F43]' },
  'llm-orchestration': { label: 'AI & LLMs', icon: 'smart_toy', color: 'text-accent-ai' },
  'git-collaboration': { label: 'Git & Collaboration', icon: 'source', color: 'text-accent-warning' },
};

/** Extract lines from a demo file for inline display */
function getCodeSnippet(filePath: string, startLine: number, endLine: number): string | null {
  const file = DEMO_FILES.find(f => f.path === filePath);
  if (!file) return null;
  const lines = file.content.split('\n');
  return lines.slice(startLine - 1, endLine).join('\n');
}

const LessonStepView: React.FC<{
  lesson: Lesson;
  onComplete: () => void;
  onBack: () => void;
}> = ({ lesson, onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { setView, openFile, ensureFiles } = useIDEStore();
  const step = lesson.steps[currentStep];
  const isLast = currentStep === lesson.steps.length - 1;

  const snippet = step.codeHighlight
    ? getCodeSnippet(step.codeHighlight.file, step.codeHighlight.startLine, step.codeHighlight.endLine)
    : null;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const handleOpenFile = (filePath: string) => {
    // Ensure the demo file exists in the store before trying to open it
    const demoFile = DEMO_FILES.find(f => f.path === filePath);
    if (demoFile) {
      ensureFiles([demoFile]);
    }
    setView('code');
    openFile(filePath);
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

        {/* Inline code snippet */}
        {snippet && step.codeHighlight && (
          <div className="mb-3">
            <div className="flex items-center justify-between bg-background border border-muted/30 border-b-0 px-3 py-1.5">
              <span className="text-[11px] text-muted font-mono">
                {step.codeHighlight.file.split('/').pop()} · lines {step.codeHighlight.startLine}-{step.codeHighlight.endLine}
              </span>
              <button
                onClick={() => handleOpenFile(step.codeHighlight!.file)}
                className="flex items-center gap-1 text-[11px] text-primary font-mono hover:underline"
              >
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                Open in editor
              </button>
            </div>
            <pre className="bg-background border border-muted/30 p-3 overflow-x-auto custom-scrollbar">
              <code className="text-[11px] text-text-main font-mono leading-relaxed whitespace-pre">{snippet}</code>
            </pre>
          </div>
        )}

        {/* Open file button when there's a code highlight but no snippet (file not in demo data) */}
        {step.codeHighlight && !snippet && (
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
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

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

  const getNextLesson = (): Lesson | null => {
    return LESSONS.find(l => !completedSet.has(l.id) && !isLessonLocked(l)) || null;
  };

  const getNewlyUnlocked = (completedId: string): Lesson[] => {
    return LESSONS.filter(l =>
      !completedSet.has(l.id) &&
      l.id !== completedId &&
      l.prerequisiteLessons.includes(completedId) &&
      l.prerequisiteLessons.every(id => completedSet.has(id))
    );
  };

  const handleCompleteLesson = (lessonId: string) => {
    completeLesson(lessonId);
    const lesson = LESSONS.find(l => l.id === lessonId);
    addToast(`Lesson completed: ${lesson?.title}`, 'success');
    setActiveLesson(null);
    setJustCompleted(lessonId);
  };

  const handleClose = () => {
    toggleLearningPath(false);
    setJustCompleted(null);
    setActiveLesson(null);
  };

  const activeLessonData = activeLesson ? LESSONS.find(l => l.id === activeLesson) : null;
  const justCompletedData = justCompleted ? LESSONS.find(l => l.id === justCompleted) : null;

  const tracks = Object.entries(TRACK_INFO).map(([category, info]) => ({
    category: category as LessonCategory,
    ...info,
    lessons: LESSONS.filter(l => l.category === category),
  }));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />
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
          <button onClick={handleClose} className="text-muted hover:text-text-main p-1">
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
          {justCompletedData ? (
            /* --- Completion screen --- */
            (() => {
              const unlocked = getNewlyUnlocked(justCompletedData.id);
              const next = getNextLesson();
              const allDone = completedCount >= totalLessons;
              return (
                <div className="flex flex-col items-center text-center gap-5 py-10 px-6">
                  <span className="material-symbols-outlined text-5xl text-primary">celebration</span>
                  <div>
                    <h3 className="text-lg font-bold text-text-main mb-1">Lesson Complete!</h3>
                    <p className="text-xs text-muted font-mono">{justCompletedData.title}</p>
                  </div>

                  {unlocked.length > 0 && (
                    <div className="bg-background border border-primary/20 p-3 w-full max-w-sm">
                      <p className="text-[11px] text-primary font-bold uppercase tracking-wider mb-2">
                        <span className="material-symbols-outlined text-[14px] align-middle mr-1">lock_open</span>
                        Unlocked {unlocked.length} new {unlocked.length === 1 ? 'lesson' : 'lessons'}
                      </p>
                      {unlocked.map(l => (
                        <button key={l.id} onClick={() => { setJustCompleted(null); setActiveLesson(l.id); }}
                          className="w-full text-left flex items-center gap-2 text-xs text-text-main py-1.5 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[14px] text-primary">play_circle</span>
                          {l.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {allDone ? (
                    <div className="flex flex-col items-center gap-2 mt-2">
                      <span className="material-symbols-outlined text-3xl text-primary">emoji_events</span>
                      <p className="text-sm font-bold text-primary">All lessons complete!</p>
                      <p className="text-xs text-muted">You've finished every lesson. Well done.</p>
                    </div>
                  ) : next ? (
                    <button onClick={() => { setJustCompleted(null); setActiveLesson(next.id); }}
                      className="flex items-center gap-2 px-5 py-2 bg-primary text-background text-xs font-bold uppercase tracking-wider hover:bg-[#0cf1f1] transition-all mt-2">
                      Next: {next.title}
                      <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </button>
                  ) : null}

                  <button onClick={() => setJustCompleted(null)}
                    className="text-[11px] text-muted hover:text-text-main font-mono mt-2">
                    Back to Learning Path
                  </button>
                </div>
              );
            })()
          ) : activeLessonData ? (
            <LessonStepView
              lesson={activeLessonData}
              onComplete={() => handleCompleteLesson(activeLessonData.id)}
              onBack={() => setActiveLesson(null)}
            />
          ) : (
            <div className="p-4 flex flex-col gap-4">
              {/* Continue / Start banner */}
              {(() => {
                const next = getNextLesson();
                if (!next || completedCount >= totalLessons) return null;
                const trackInfo = TRACK_INFO[next.category];
                return (
                  <button onClick={() => setActiveLesson(next.id)}
                    className="w-full bg-surface border border-primary/30 p-4 text-left hover:shadow-neon transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-lg ${trackInfo.color}`}>{trackInfo.icon}</span>
                        <div>
                          <p className="text-[11px] text-primary font-bold uppercase tracking-wider mb-0.5">
                            {completedCount === 0 ? 'Start Learning' : 'Continue Learning'}
                          </p>
                          <h3 className="text-sm font-bold text-text-main">{next.title}</h3>
                          <p className="text-[11px] text-muted mt-0.5">{next.description}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-xl text-primary opacity-50 group-hover:opacity-100 transition-opacity">
                        play_circle
                      </span>
                    </div>
                  </button>
                );
              })()}

              {/* All-complete banner */}
              {completedCount >= totalLessons && totalLessons > 0 && (
                <div className="w-full bg-primary/5 border border-primary/30 p-4 text-center">
                  <span className="material-symbols-outlined text-2xl text-primary">emoji_events</span>
                  <p className="text-sm font-bold text-primary mt-1">All lessons complete!</p>
                  <p className="text-xs text-muted mt-1">You've mastered all the concepts. Review any lesson below.</p>
                </div>
              )}

              {/* Track grid with per-track progress */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tracks.map(track => {
                  const trackCompleted = track.lessons.filter(l => completedSet.has(l.id)).length;
                  const trackTotal = track.lessons.length;
                  return (
                    <div key={track.category}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`material-symbols-outlined text-sm ${track.color}`}>{track.icon}</span>
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-text-main">{track.label}</h3>
                        <span className="text-[11px] text-muted font-mono ml-auto">{trackCompleted}/{trackTotal}</span>
                      </div>
                      <div className="h-1 bg-background mb-3">
                        <div className="h-full bg-primary/60 transition-all duration-500" style={{ width: `${trackTotal > 0 ? (trackCompleted / trackTotal) * 100 : 0}%` }} />
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
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningPathPanel;
