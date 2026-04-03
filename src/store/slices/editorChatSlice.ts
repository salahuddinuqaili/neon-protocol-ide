import { StateCreator } from 'zustand';
import { ChatMessage, EditorSettings, Toast } from '../../types';

let toastCounter = 0;

export interface EditorChatSlice {
  editorSettings: EditorSettings;
  chatMessages: ChatMessage[];
  toasts: Toast[];

  updateEditorSettings: (settings: Partial<EditorSettings>) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export const createEditorChatSlice: StateCreator<EditorChatSlice, [], [], EditorChatSlice> = (set) => ({
  editorSettings: { fontSize: 13, wordWrap: true, minimap: false, lineHeight: 1.6, systemRamGb: 16 },
  chatMessages: [],
  toasts: [],

  updateEditorSettings: (settings) => set((state) => ({
    editorSettings: { ...state.editorSettings, ...settings },
  })),

  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message],
  })),

  clearChatMessages: () => set({ chatMessages: [] }),

  addToast: (message, type) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 3000);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),
});
