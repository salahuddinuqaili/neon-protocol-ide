/** Git file status code to Tailwind color class */
export const GIT_STATUS_COLORS: Record<string, string> = {
  M: 'text-accent-warning',
  A: 'text-primary',
  D: 'text-accent-error',
  R: 'text-accent-ai',
  C: 'text-accent-ai',
  '?': 'text-muted',
  '!': 'text-muted',
  ' ': 'text-muted',
};

/** Git status code to human-readable display character */
export const GIT_STATUS_LABELS: Record<string, string> = {
  M: 'M',
  A: 'A',
  D: 'D',
  R: 'R',
  C: 'C',
  '?': 'U',
  '!': '!',
  ' ': ' ',
};

/** Git status code to beginner-friendly full word */
export const GIT_STATUS_WORDS: Record<string, string> = {
  M: 'Modified',
  A: 'Added',
  D: 'Deleted',
  R: 'Renamed',
  C: 'Copied',
  '?': 'Untracked',
  '!': 'Ignored',
  ' ': 'Unchanged',
};

/** Beginner-friendly tooltip for each git status */
export const GIT_STATUS_TIPS: Record<string, string> = {
  M: 'You changed this file since the last commit',
  A: 'This is a new file added to git tracking',
  D: 'This file was deleted',
  R: 'This file was renamed or moved',
  C: 'This file was copied',
  '?': 'Git does not track this file yet — stage it to include in your next commit',
  '!': 'Git is ignoring this file (listed in .gitignore)',
  ' ': 'No changes',
};
