import { StateCreator } from 'zustand';
import { ChatMessage, EditorSettings, Toast } from '../../types';

let toastCounter = 0;
let chatCounter = 0;

export interface EditorChatSlice {
  editorSettings: EditorSettings;
  chatMessages: ChatMessage[];
  toasts: Toast[];

  updateEditorSettings: (settings: Partial<EditorSettings>) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
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
    chatMessages: [...state.chatMessages, {
      ...message,
      id: `msg-${++chatCounter}`,
      timestamp: Date.now(),
    }],
  })),

  clearChatMessages: () => set({ chatMessages: [] }),

  addToast: (message, type) => {
    const id = `toast-${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    // Auto-remove after 3 seconds. The timeout ID is not tracked because
    // the removal is idempotent — if the toast was already manually removed,
    // the filter is a no-op.
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 3000);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),
});
