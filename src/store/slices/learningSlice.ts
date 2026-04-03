import { StateCreator } from 'zustand';
import { LearningMode, LearningProgress } from '../../types';

const DEFAULT_LEARNING_PROGRESS: LearningProgress = {
  completedSteps: [],
  completedLessons: [],
  currentTutorialStep: 0,
  activeTutorialId: null,
};

export interface LearningSlice {
  learningMode: LearningMode;
  learningProgress: LearningProgress;
  isTutorialActive: boolean;
  isGlossaryOpen: boolean;
  isLearningPathOpen: boolean;

  setLearningMode: (mode: LearningMode) => void;
  startTutorial: (tutorialId: string) => void;
  advanceTutorial: () => void;
  completeTutorial: () => void;
  skipTutorial: () => void;
  completeLesson: (lessonId: string) => void;
  toggleGlossary: (open?: boolean) => void;
  toggleLearningPath: (open?: boolean) => void;
  resetLearningProgress: () => void;
}

export const createLearningSlice: StateCreator<LearningSlice, [], [], LearningSlice> = (set) => ({
  learningMode: 'beginner',
  learningProgress: DEFAULT_LEARNING_PROGRESS,
  isTutorialActive: false,
  isGlossaryOpen: false,
  isLearningPathOpen: false,

  setLearningMode: (mode) => set({ learningMode: mode }),

  startTutorial: (tutorialId) => set((state) => ({
    isTutorialActive: true,
    learningProgress: {
      ...state.learningProgress,
      activeTutorialId: tutorialId,
      currentTutorialStep: 0,
    },
  })),

  advanceTutorial: () => set((state) => {
    const stepId = `${state.learningProgress.activeTutorialId}-step-${state.learningProgress.currentTutorialStep}`;
    return {
      learningProgress: {
        ...state.learningProgress,
        currentTutorialStep: state.learningProgress.currentTutorialStep + 1,
        completedSteps: state.learningProgress.completedSteps.includes(stepId)
          ? state.learningProgress.completedSteps
          : [...state.learningProgress.completedSteps, stepId],
      },
    };
  }),

  completeTutorial: () => set((state) => ({
    isTutorialActive: false,
    learningProgress: {
      ...state.learningProgress,
      activeTutorialId: null,
      currentTutorialStep: 0,
    },
  })),

  skipTutorial: () => set({
    isTutorialActive: false,
    learningProgress: { ...DEFAULT_LEARNING_PROGRESS },
  }),

  completeLesson: (lessonId) => set((state) => ({
    learningProgress: {
      ...state.learningProgress,
      completedLessons: state.learningProgress.completedLessons.includes(lessonId)
        ? state.learningProgress.completedLessons
        : [...state.learningProgress.completedLessons, lessonId],
    },
  })),

  toggleGlossary: (open?) => set((state) => ({
    isGlossaryOpen: typeof open !== 'undefined' ? open : !state.isGlossaryOpen,
  })),

  toggleLearningPath: (open?) => set((state) => ({
    isLearningPathOpen: typeof open !== 'undefined' ? open : !state.isLearningPathOpen,
  })),

  resetLearningProgress: () => set({
    learningProgress: { ...DEFAULT_LEARNING_PROGRESS },
    isTutorialActive: false,
  }),
});
