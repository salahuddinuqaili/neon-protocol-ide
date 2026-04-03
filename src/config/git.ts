/** Git file status code to Tailwind color class */
export const GIT_STATUS_COLORS: Record<string, string> = {
  M: 'text-accent-warning',
  A: 'text-primary',
  D: 'text-accent-error',
  R: 'text-accent-ai',
  '?': 'text-muted',
  ' ': 'text-muted',
};

/** Git status code to human-readable display character */
export const GIT_STATUS_LABELS: Record<string, string> = {
  M: 'M',
  A: 'A',
  D: 'D',
  R: 'R',
  '?': 'U',
  ' ': ' ',
};
