/**
 * Regression coverage for focus stealing.
 *
 * The trap's setup effect used to depend on a `useCallback` keyed off `onEscape`. Every
 * caller passes an inline arrow, so that identity changed each render, the effect re-ran,
 * and focus snapped back to the first focusable element. Combined with git polling firing
 * a store update every 10 seconds, this pulled the caret out of any field the user was
 * typing in — including the API key input in Settings.
 */
import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

/** Panel with an inline onEscape, mirroring how every real caller uses the hook. */
const Panel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const trapRef = useFocusTrap<HTMLDivElement>(() => onClose());
  return (
    <div ref={trapRef}>
      <button>first</button>
      <input aria-label="api-key" />
      <button>last</button>
    </div>
  );
};

/** Re-renders `Panel` on demand, standing in for an unrelated store update. */
const Harness: React.FC = () => {
  const [, setTick] = useState(0);
  return (
    <>
      <button onClick={() => setTick((t) => t + 1)}>poll</button>
      <Panel onClose={() => {}} />
    </>
  );
};

const nextFrame = () => act(async () => {
  await new Promise((r) => requestAnimationFrame(() => r(null)));
});

describe('useFocusTrap', () => {
  it('focuses the first focusable element on mount', async () => {
    const { getByText } = render(<Panel onClose={() => {}} />);
    await nextFrame();
    expect(document.activeElement).toBe(getByText('first'));
  });

  it('prefers an element marked data-autofocus', async () => {
    const WithAutofocus: React.FC = () => {
      const trapRef = useFocusTrap<HTMLDivElement>(() => {});
      return (
        <div ref={trapRef}>
          <button>first</button>
          <input aria-label="search" data-autofocus />
        </div>
      );
    };
    const { getByLabelText } = render(<WithAutofocus />);
    await nextFrame();
    expect(document.activeElement).toBe(getByLabelText('search'));
  });

  it('does not steal focus when an unrelated re-render occurs', async () => {
    const { getByText, getByLabelText } = render(<Harness />);
    await nextFrame();

    // User clicks into the text field, as they would to type an API key.
    const input = getByLabelText('api-key') as HTMLInputElement;
    act(() => input.focus());
    expect(document.activeElement).toBe(input);

    // Something unrelated updates the store — git polling does this every 10 seconds.
    act(() => {
      getByText('poll').click();
    });
    await nextFrame();

    expect(document.activeElement).toBe(input);
  });

  it('keeps using the latest onEscape without re-running the trap', async () => {
    const calls: string[] = [];
    const Wrapper: React.FC = () => {
      const [label, setLabel] = useState('first');
      const trapRef = useFocusTrap<HTMLDivElement>(() => calls.push(label));
      return (
        <div ref={trapRef}>
          <button onClick={() => setLabel('second')}>change</button>
          <input aria-label="field" />
        </div>
      );
    };

    const { getByText, getByLabelText, container } = render(<Wrapper />);
    await nextFrame();

    const input = getByLabelText('field') as HTMLInputElement;
    act(() => input.focus());

    // Change the captured value, then confirm focus survived the re-render.
    act(() => {
      getByText('change').click();
    });
    await nextFrame();
    expect(document.activeElement).toBe(input);

    act(() => {
      container.firstElementChild!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );
    });

    // The ref-held callback must see the current value, not the one captured at mount.
    expect(calls).toEqual(['second']);
  });
});
