# SPEC.md — Beginner UX Upgrade (Phase 1)

## Overview

Three high-impact features to transform Neon Protocol IDE from a teaching tool into an active learning environment. These build on the existing 24-lesson, 358-term glossary, and 4-tutorial foundation.

| Feature | Codename | Impact | Effort |
|---------|----------|--------|--------|
| Interactive Challenges | `challenges` | Transforms passive lessons into active learning (10% → 60% retention) | Medium |
| Error Translation Layer | `error-translate` | #1 reason beginners quit — intercept and explain every error | Medium |
| "Explain This" Context Menu | `explain-this` | Removes biggest friction: not knowing what to ask | Low |

---

## Feature 1: Interactive Challenges

### Problem
All 24 lessons are read-only. Users learn concepts but never practice them. No way to verify understanding.

### Solution
Add a challenge system that attaches hands-on exercises to lessons. Challenges run in the editor with automated pass/fail validation.

### Challenge Types

| Type | Description | Example |
|------|-------------|---------|
| `fill-in-the-blank` | Code template with `___` placeholders user must fill | "Complete this function signature: `function greet(___: string)`" |
| `fix-the-bug` | Broken code that user must correct | "This function returns undefined — find and fix the bug" |
| `predict-output` | Multiple-choice: what does this code print? | "What does `[1,2,3].map(x => x * 2)` return?" |
| `free-code` | Open editor with a goal and test function | "Write a function that reverses a string" |

### Data Model

```typescript
// src/types/index.ts — new types

export type ChallengeType = 'fill-in-the-blank' | 'fix-the-bug' | 'predict-output' | 'free-code';
export type ChallengeStatus = 'locked' | 'available' | 'attempted' | 'completed';

export interface Challenge {
  id: string;
  lessonId: string;                    // links to existing Lesson.id
  title: string;
  description: string;                 // what the user needs to do
  type: ChallengeType;
  difficulty: 1 | 2 | 3;              // star rating shown in UI
  starterCode: string;                 // pre-filled in editor
  language: string;                    // syntax highlighting
  hints: string[];                     // progressive hints (reveal one at a time)
  validation: ChallengeValidation;
}

export interface ChallengeValidation {
  // For predict-output
  choices?: string[];                  // multiple choice options
  correctChoice?: number;             // index of correct answer

  // For fill-in-the-blank / fix-the-bug / free-code
  testFn?: string;                    // JavaScript function body that receives user code as string
                                      // Returns { pass: boolean; message: string }
  expectedOutput?: string;            // for simple output matching
  requiredSubstrings?: string[];      // code must contain these strings
  forbiddenSubstrings?: string[];     // code must NOT contain these
}

// Extend LearningProgress
export interface LearningProgress {
  completedSteps: string[];
  completedLessons: string[];
  completedChallenges: string[];       // NEW — challenge IDs
  challengeAttempts: Record<string, number>;  // NEW — challengeId → attempt count
  currentTutorialStep: number;
  activeTutorialId: string | null;
}
```

### Challenge Data File

New file: `src/data/challenges.ts`

```typescript
export const CHALLENGES: Challenge[] = [
  // Linked to lesson: 'what-is-a-function'
  {
    id: 'challenge-function-basics',
    lessonId: 'what-is-a-function',
    title: 'Write Your First Function',
    description: 'Create a function called "double" that takes a number and returns it multiplied by 2.',
    type: 'free-code',
    difficulty: 1,
    starterCode: '// Write your function below\n',
    language: 'typescript',
    hints: [
      'A function starts with the "function" keyword',
      'Use "return" to send a value back',
      'Multiply with the * operator',
    ],
    validation: {
      requiredSubstrings: ['function', 'return'],
      testFn: `
        try {
          const fn = new Function(code + '\\nreturn double(5);');
          const result = fn();
          if (result === 10) return { pass: true, message: 'Your function works!' };
          return { pass: false, message: 'double(5) should return 10, but got ' + result };
        } catch (e) {
          return { pass: false, message: 'Error: ' + e.message };
        }
      `,
    },
  },
  {
    id: 'challenge-predict-map',
    lessonId: 'what-is-a-function',
    title: 'Predict the Output',
    description: 'What does this code return?\\n```\\n[1, 2, 3].map(x => x + 10)\\n```',
    type: 'predict-output',
    difficulty: 1,
    starterCode: '',
    language: 'typescript',
    hints: ['.map() runs the function on every item in the array'],
    validation: {
      choices: ['[10, 20, 30]', '[11, 12, 13]', '[1, 2, 3, 10]', 'Error'],
      correctChoice: 1,
    },
  },
  // ... more challenges per lesson
];
```

### Store Changes

Extend `learningSlice.ts`:

```typescript
// New actions
startChallenge: (challengeId: string) => void;
completeChallenge: (challengeId: string) => void;
recordChallengeAttempt: (challengeId: string) => void;
```

Bump schema version to `4` in `useIDEStore.ts`. Add migration from v3:
- Add `completedChallenges: []` and `challengeAttempts: {}` to persisted `learningProgress`.

### UI Components

New file: `src/components/learning/ChallengePanel.tsx`

- **Trigger**: "Try the Challenge" button appears at the end of each lesson in `LearningPathPanel.tsx` (after final step, before completion celebration)
- **Layout**: Split view — instructions + hints on left, code editor (Monaco) on right
- **Predict-output**: Radio button choices instead of editor
- **Hint system**: "Need a hint?" button reveals hints one at a time (tracks how many revealed)
- **Validation flow**:
  1. User clicks "Check My Answer"
  2. Run validation (substring checks first, then testFn via `new Function()`)
  3. Pass → confetti animation + "Challenge Complete!" + unlock badge
  4. Fail → show message from validation, increment attempt counter, suggest hint if available
- **Skip option**: "Skip Challenge" always available — challenges are encouraged, not required for lesson completion
- **Completion**: Calls `completeChallenge(id)` → adds to `completedChallenges` in persisted progress

### Integration with Existing Lessons

In `LearningPathPanel.tsx`, after the final step of a lesson:
- Check if `CHALLENGES.filter(c => c.lessonId === lesson.id).length > 0`
- If yes, show "Practice What You Learned" card with challenge count and difficulty stars
- Clicking opens `ChallengePanel` as a modal overlay (same z-index pattern as LearningPathPanel)

### Completion Celebration Enhancement

When a challenge is completed, the celebration screen in `LearningPathPanel.tsx` shows:
- Challenge badge earned (bronze/silver/gold based on attempt count: 1 attempt = gold, 2-3 = silver, 4+ = bronze)
- "Challenges completed: X/Y" in the lesson card

---

## Feature 2: Error Translation Layer

### Problem
Terminal errors, build failures, and LLM connection errors are cryptic. Beginners don't know what "ECONNREFUSED" or "TypeError: Cannot read properties of undefined" means. This is the #1 reason new coders quit.

### Solution
Intercept errors at three layers (terminal, LLM, build) and display a beginner-friendly explanation panel alongside the raw error. Optionally link to relevant lessons and offer AI-powered "Fix it for me".

### Error Sources

| Source | Where errors appear | Hook point |
|--------|-------------------|------------|
| Terminal | `TerminalPanel.tsx` — lines with `type: 'error'` | `onTerminalData` callback |
| LLM | `CopilotPanel.tsx` — catch block in sendMessage | `routeChat` rejection |
| Build/TypeScript | Terminal output from `npx tsc`, `npx next build` | Terminal error pattern matching |

### Data Model

```typescript
// src/types/index.ts — new types

export interface TranslatedError {
  id: string;
  rawError: string;                    // original error text
  title: string;                       // short plain-English title
  explanation: string;                 // 2-3 sentence beginner explanation
  commonCauses: string[];              // bullet list of likely causes
  suggestedFix?: string;              // concrete action user can take
  relatedLessonId?: string;           // link to relevant lesson
  relatedGlossaryTerms?: string[];    // link to glossary entries
  severity: 'info' | 'warning' | 'error';
}
```

### Error Pattern Registry

New file: `src/config/errorPatterns.ts`

```typescript
export interface ErrorPattern {
  pattern: RegExp;
  title: string;
  explanation: string;
  commonCauses: string[];
  suggestedFix?: string;
  relatedLessonId?: string;
  relatedGlossaryTerms?: string[];
  severity: 'info' | 'warning' | 'error';
}

export const ERROR_PATTERNS: ErrorPattern[] = [
  // Connection errors
  {
    pattern: /ECONNREFUSED/i,
    title: 'Connection Refused',
    explanation: 'Your computer tried to connect to a service, but nothing is listening at that address. This usually means the service (like Ollama or an API server) isn\'t running.',
    commonCauses: [
      'Ollama is not running — start it from the AI Settings page',
      'The API URL is wrong — check for typos in the address',
      'A firewall is blocking the connection',
    ],
    suggestedFix: 'Open AI Settings (Ctrl+3) and check that your provider is running.',
    relatedLessonId: 'local-vs-cloud-ai',
    relatedGlossaryTerms: ['api', 'local-ai'],
    severity: 'error',
  },
  {
    pattern: /TypeError: Cannot read propert(y|ies) of (undefined|null)/i,
    title: 'Missing Value Error',
    explanation: 'The code tried to use a value that doesn\'t exist yet. Think of it like trying to open a door that hasn\'t been built — the code expected something to be there, but found nothing.',
    commonCauses: [
      'A variable was used before it was assigned a value',
      'A function returned nothing when a result was expected',
      'Data from an API hasn\'t loaded yet',
    ],
    relatedGlossaryTerms: ['variable', 'function'],
    severity: 'error',
  },
  {
    pattern: /SyntaxError/i,
    title: 'Syntax Error — Code Grammar Mistake',
    explanation: 'There\'s a typo or formatting mistake in the code. Just like English has grammar rules, code has syntax rules. A missing bracket, comma, or quotation mark can cause this.',
    commonCauses: [
      'Missing closing bracket: } ) ]',
      'Missing comma between items',
      'Unclosed string (missing quotation mark)',
      'Using a reserved word as a variable name',
    ],
    relatedLessonId: 'reading-typescript',
    severity: 'error',
  },
  {
    pattern: /ReferenceError: (\w+) is not defined/i,
    title: 'Unknown Name Error',
    explanation: 'The code used a name that doesn\'t exist. This usually means a variable or function was misspelled, or it was used before being created.',
    commonCauses: [
      'Typo in a variable or function name',
      'Forgot to import a module',
      'Variable declared inside a function but used outside it (scope issue)',
    ],
    relatedGlossaryTerms: ['variable', 'function'],
    severity: 'error',
  },
  {
    pattern: /401|Unauthorized/i,
    title: 'Authentication Failed',
    explanation: 'The API server doesn\'t recognize your credentials. This means your API key is missing, expired, or incorrect.',
    commonCauses: [
      'API key is missing — add it in AI Settings',
      'API key was copied with extra spaces',
      'API key has expired or been revoked',
    ],
    suggestedFix: 'Go to AI Settings (Ctrl+3), click your provider, and re-enter your API key.',
    relatedLessonId: 'local-vs-cloud-ai',
    relatedGlossaryTerms: ['api-key'],
    severity: 'error',
  },
  {
    pattern: /429|Too Many Requests|rate.?limit/i,
    title: 'Rate Limited — Too Many Requests',
    explanation: 'You\'re sending requests too fast. APIs limit how many requests you can make per minute to prevent overload. Wait a moment and try again.',
    commonCauses: [
      'Sending many messages quickly to the AI',
      'Free-tier API keys have lower rate limits',
    ],
    suggestedFix: 'Wait 30 seconds and try again, or switch to a local model (Ollama) which has no rate limits.',
    relatedGlossaryTerms: ['token', 'api'],
    severity: 'warning',
  },
  {
    pattern: /ETIMEDOUT|timeout/i,
    title: 'Request Timed Out',
    explanation: 'The request took too long and was cancelled. The server might be overloaded, or your internet connection might be slow.',
    commonCauses: [
      'Slow internet connection',
      'The AI model is processing a very large request',
      'The server is experiencing high traffic',
    ],
    suggestedFix: 'Try a shorter message, or switch to a local model (Ollama) for faster responses.',
    severity: 'warning',
  },
  {
    pattern: /module not found|cannot find module/i,
    title: 'Missing Package',
    explanation: 'The code is trying to use a library (package) that isn\'t installed. Think of it like trying to use a tool that\'s not in your toolbox yet.',
    commonCauses: [
      'Forgot to run "npm install" after cloning the project',
      'The package name is misspelled in the import',
      'The package was removed from package.json',
    ],
    suggestedFix: 'Open the terminal (Ctrl+4) and run: npm install',
    severity: 'error',
  },
  // Add 15-20 more patterns covering common beginner errors
];
```

### Error Translation Logic

New file: `src/lib/errorTranslator.ts`

```typescript
import { ERROR_PATTERNS, ErrorPattern } from '../config/errorPatterns';
import { TranslatedError } from '../types';

export function translateError(rawError: string): TranslatedError | null {
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(rawError)) {
      return {
        id: crypto.randomUUID(),
        rawError,
        title: pattern.title,
        explanation: pattern.explanation,
        commonCauses: pattern.commonCauses,
        suggestedFix: pattern.suggestedFix,
        relatedLessonId: pattern.relatedLessonId,
        relatedGlossaryTerms: pattern.relatedGlossaryTerms,
        severity: pattern.severity,
      };
    }
  }
  return null;  // no match — show raw error only
}
```

### AI-Powered Fallback

When `translateError()` returns `null` (no pattern match) and the user is in beginner mode:
- Show a "Ask AI to explain this error" button
- Clicking sends to copilot: `"I got this error and I'm new to coding. Explain what it means and how to fix it:\n\n${rawError}"`
- Uses existing `routeChat()` — no new LLM integration needed

### UI: Error Explanation Card

New component: `src/components/terminal/ErrorCard.tsx`

Renders inline in `TerminalPanel.tsx` directly below the error line:

```
┌─ ⚠ Connection Refused ──────────────────────────┐
│                                                   │
│  Your computer tried to connect to a service,     │
│  but nothing is listening at that address.         │
│                                                   │
│  Common causes:                                   │
│  • Ollama is not running                          │
│  • The API URL has a typo                         │
│  • A firewall is blocking the connection          │
│                                                   │
│  ► Open AI Settings    📖 Related: "Local vs Cloud AI"  │
│                                                   │
│  [Ask AI to explain] [Dismiss]                    │
└───────────────────────────────────────────────────┘
```

- Only shown in beginner mode (`learningMode === 'beginner'`)
- Dismissable per-error (won't re-show for the same terminal session)
- "Related" links open the lesson or glossary entry
- Collapsible — click title to toggle
- Experienced mode: errors show raw only (no card), but a small "?" icon appears on hover that opens the card on click

### Integration Points

**TerminalPanel.tsx:**
- After each `onTerminalData` callback that adds an error line, call `translateError(data)`
- If match found, insert an `ErrorCard` component after the error line
- Track dismissed errors in local component state (not persisted)

**CopilotPanel.tsx:**
- In the catch block of `sendMessage`, call `translateError(error.message)`
- Show `ErrorCard` inline in the chat instead of the raw "Could not reach AI:" message

**No store changes needed** — error translations are ephemeral (derived from terminal output, not persisted).

---

## Feature 3: "Explain This" Context Menu

### Problem
Beginners stare at code they don't understand but don't know what question to ask. The copilot is reactive — it waits for a question. There's no bridge between "I'm confused" and "here's an explanation."

### Solution
Add a right-click context menu in the code editor with beginner-friendly actions: "Explain This Code", "What Does This Do?", "Simplify This". Each sends the selection to the copilot with a teaching-focused prompt.

### Context Menu Actions

| Action | System Prompt Prefix | When Available |
|--------|---------------------|----------------|
| Explain This Code | "Explain this code to a beginner. Use simple language and a real-world analogy." | Text selected |
| What Does This Line Do? | "Explain what this single line does and why it matters in the context of the file." | Cursor on a line (no selection needed) |
| Simplify This | "Rewrite this code to be simpler and easier to understand. Show before/after." | Text selected |
| Find Related Lesson | Searches `LESSONS` and `GLOSSARY` for matching concepts | Always |
| Ask AI About This | Opens copilot with selection pre-filled as a question | Text selected |

### Implementation

**ProCodeEditor.tsx — Monaco Context Menu Registration:**

```typescript
// Inside onMount callback
editor.addAction({
  id: 'explain-this-code',
  label: '💡 Explain This Code',
  contextMenuGroupId: 'learning',
  contextMenuOrder: 1,
  precondition: 'editorHasSelection',
  run: (ed) => {
    const selection = ed.getModel()?.getValueInRange(ed.getSelection()!);
    if (selection) onExplainCode(selection, 'explain');
  },
});

editor.addAction({
  id: 'what-does-this-do',
  label: '❓ What Does This Line Do?',
  contextMenuGroupId: 'learning',
  contextMenuOrder: 2,
  run: (ed) => {
    const pos = ed.getPosition();
    const line = ed.getModel()?.getLineContent(pos!.lineNumber);
    if (line) onExplainCode(line, 'line');
  },
});

editor.addAction({
  id: 'simplify-this',
  label: '✨ Simplify This',
  contextMenuGroupId: 'learning',
  contextMenuOrder: 3,
  precondition: 'editorHasSelection',
  run: (ed) => {
    const selection = ed.getModel()?.getValueInRange(ed.getSelection()!);
    if (selection) onExplainCode(selection, 'simplify');
  },
});

editor.addAction({
  id: 'ask-ai-about-this',
  label: '🤖 Ask AI About This',
  contextMenuGroupId: 'learning',
  contextMenuOrder: 4,
  precondition: 'editorHasSelection',
  run: (ed) => {
    const selection = ed.getModel()?.getValueInRange(ed.getSelection()!);
    if (selection) onExplainCode(selection, 'ask');
  },
});
```

**Prompt Construction:**

New file: `src/lib/explainPrompts.ts`

```typescript
export type ExplainMode = 'explain' | 'line' | 'simplify' | 'ask';

export function buildExplainPrompt(
  code: string,
  mode: ExplainMode,
  fileName: string,
  language: string
): string {
  const fileContext = `The user is working in "${fileName}" (${language}).`;

  switch (mode) {
    case 'explain':
      return `${fileContext}\n\nExplain this code to someone who is new to programming. Use simple language, a real-world analogy, and break it down line by line:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    case 'line':
      return `${fileContext}\n\nExplain what this single line of code does and why it matters. Keep it to 2-3 sentences, use simple language:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    case 'simplify':
      return `${fileContext}\n\nRewrite this code to be simpler and easier to understand. Show the simplified version, then explain what you changed and why:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    case 'ask':
      return `${fileContext}\n\nThe user selected this code and wants to ask about it:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nWhat would you like to know about this code?`;
  }
}
```

### UX Flow

1. User right-clicks selected code in Monaco editor
2. Standard Monaco context menu appears with new "learning" group at the top
3. User clicks e.g. "Explain This Code"
4. **Copilot panel auto-opens** if not already visible
5. User message appears in chat: `"Explain: [first 50 chars of selection]..."`
6. AI responds with teaching-focused explanation
7. User can continue the conversation naturally ("What's a callback?" etc.)

### Props/Callback Chain

```
ProCodeEditor
  → onExplainCode(code: string, mode: ExplainMode)     // new prop

MainLayout (or parent)
  → receives callback
  → ensures copilot panel is open
  → builds prompt via buildExplainPrompt()
  → calls addChatMessage() for user message
  → calls routeChat() with system prompt + explain prompt
  → calls addChatMessage() for AI response
```

### Keyboard Shortcut

- `Ctrl+Shift+E`: "Explain This Code" (same as right-click action, uses current selection)
- Registered as Monaco keybinding (not global shortcut) so it only fires in the editor

### Find Related Lesson Action

Instead of sending to AI, this action:
1. Extracts keywords from selection (function names, types, patterns)
2. Searches `LESSONS` titles/descriptions and `GLOSSARY` terms for matches
3. Shows a small dropdown with matching lessons/terms
4. Clicking opens the lesson in `LearningPathPanel` or the term in `GlossaryPanel`

This is a **no-AI** fallback that works even without a provider connected.

---

## Shared Implementation Details

### Schema Migration (v3 → v4)

In `useIDEStore.ts`:

```typescript
version: 4,
migrate: (persisted: any, version: number) => {
  // ... existing v0→v3 migrations ...
  if (version < 4) {
    if (persisted.learningProgress) {
      persisted.learningProgress.completedChallenges = [];
      persisted.learningProgress.challengeAttempts = {};
    }
  }
  return persisted;
},
```

### New Files Summary

| File | Feature | Purpose |
|------|---------|---------|
| `src/data/challenges.ts` | Challenges | Challenge definitions linked to lessons |
| `src/components/learning/ChallengePanel.tsx` | Challenges | Challenge UI with embedded Monaco editor |
| `src/config/errorPatterns.ts` | Error Translation | Regex → explanation mapping |
| `src/lib/errorTranslator.ts` | Error Translation | Pattern matching logic |
| `src/components/terminal/ErrorCard.tsx` | Error Translation | Inline error explanation card |
| `src/lib/explainPrompts.ts` | Explain This | Prompt templates for context menu actions |

### Modified Files Summary

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add Challenge, TranslatedError, ChallengeType types; extend LearningProgress |
| `src/store/slices/learningSlice.ts` | Add challenge actions and state |
| `src/store/useIDEStore.ts` | Bump to v4, add migration, persist new fields |
| `src/components/learning/LearningPathPanel.tsx` | Add "Try the Challenge" button after lessons |
| `src/components/terminal/TerminalPanel.tsx` | Add ErrorCard rendering after error lines |
| `src/components/editor/CopilotPanel.tsx` | Add ErrorCard for LLM errors; accept explain-this messages |
| `src/components/editor/ProCodeEditor.tsx` | Register Monaco context menu actions, add Ctrl+Shift+E |
| `src/components/layout/MainLayout.tsx` | Wire onExplainCode callback between editor and copilot |

### Testing Strategy

Each feature needs:

1. **Unit tests** (`src/test/__tests__/`)
   - `challenges.test.ts` — validation logic (substring checks, testFn execution, predict-output scoring)
   - `errorTranslator.test.ts` — pattern matching against sample errors
   - `explainPrompts.test.ts` — prompt construction for each mode

2. **SSR safety** — existing `ssr-safety.test.ts` catches any unguarded `window` access in new files

3. **Store tests** — extend existing store tests for new actions: `completeChallenge`, `recordChallengeAttempt`

### Implementation Order

```
Phase 1a: Error Translation Layer (lowest risk, immediate impact)
  1. errorPatterns.ts config
  2. errorTranslator.ts logic
  3. ErrorCard.tsx component
  4. TerminalPanel.tsx integration
  5. CopilotPanel.tsx integration
  6. Tests

Phase 1b: "Explain This" Context Menu (builds on copilot)
  1. explainPrompts.ts
  2. ProCodeEditor.tsx — Monaco actions
  3. MainLayout.tsx — callback wiring
  4. CopilotPanel.tsx — accept external messages
  5. Tests

Phase 1c: Interactive Challenges (largest scope)
  1. Types + schema migration
  2. challenges.ts data (start with 5 challenges for first 3 lessons)
  3. learningSlice.ts actions
  4. ChallengePanel.tsx component
  5. LearningPathPanel.tsx integration
  6. Tests
  7. Add more challenges iteratively
```

---

## Out of Scope (Phase 2+)

These were discussed but deferred to keep Phase 1 focused:

- **Guided Project Builder** ("Build With Me" mode)
- **Smart Adaptive Onboarding** (skill assessment quiz)
- **Achievement System & Badges** (gamification layer)
- **"Pair Programming" AI Mode** (proactive suggestions)
- **Visual Debugger / Code Flow Animator**
- **Community Templates & Sharing**
- **Accessibility overhaul** (high-contrast, screen reader, reduced motion)

---

## Decision Log

| Decision | Choice | Why |
|----------|--------|-----|
| Challenge validation runs client-side | `new Function()` in renderer | No server needed; challenges are educational, not security-critical |
| Error patterns are static config, not AI | Regex registry in `errorPatterns.ts` | Instant response (no API call), works offline, predictable |
| AI fallback for unmatched errors | Send to copilot on user click | Covers edge cases without bloating the pattern registry |
| Challenges are optional per lesson | Skip always available | Avoid blocking progression — motivation, not gatekeeping |
| Schema v3 → v4 migration | Add fields with defaults | Non-breaking; existing users keep their progress |
| Context menu uses Monaco API, not custom DOM | `editor.addAction()` | Native integration, works with Monaco's existing context menu system |
