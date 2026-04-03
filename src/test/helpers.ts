import { create } from 'zustand';
import { IDEState } from '../types';

/**
 * Creates a fresh, non-persisted store instance for testing.
 * Uses the same defaults as the real store but without localStorage persistence.
 */
export function createTestStore(overrides: Partial<IDEState> = {}) {
  // Import the store module to get access to defaults — but for testing we
  // create a plain zustand store without persist middleware
  const { useIDEStore } = require('../store/useIDEStore');
  const initialState = useIDEStore.getState();

  return {
    getState: () => ({ ...initialState, ...overrides }),
    setState: useIDEStore.setState,
    store: useIDEStore,
  };
}

/**
 * Resets the store to its initial state between tests.
 */
export function resetStore() {
  const { useIDEStore } = require('../store/useIDEStore');
  const initialState = useIDEStore.getInitialState?.() ?? useIDEStore.getState();
  useIDEStore.setState(initialState, true);
}
