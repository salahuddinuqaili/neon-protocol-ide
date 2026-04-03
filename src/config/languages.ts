/** Unified mapping from file extension to Monaco Editor language identifier */
export const LANGUAGE_MAP: Record<string, string> = {
  'ts': 'typescript', 'tsx': 'typescript',
  'js': 'javascript', 'jsx': 'javascript',
  'py': 'python', 'rb': 'ruby', 'rs': 'rust',
  'c': 'c', 'cpp': 'cpp', 'go': 'go',
  'java': 'java', 'json': 'json', 'md': 'markdown',
  'css': 'css', 'html': 'html', 'txt': 'text',
};

export function getLanguageForExtension(ext: string): string {
  return LANGUAGE_MAP[ext] || 'text';
}
