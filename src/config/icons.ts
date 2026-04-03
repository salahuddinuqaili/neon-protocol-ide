/** Directory name pattern to Material icon mapping for the blueprint view */
export const DIR_ICON_MAP: { pattern: RegExp; icon: string; color?: string }[] = [
  { pattern: /^api$/i, icon: 'api' },
  { pattern: /^(component|widget|ui)s?$/i, icon: 'widgets' },
  { pattern: /^(page|app|route)s?$/i, icon: 'web' },
  { pattern: /^layout$/i, icon: 'dashboard' },
  { pattern: /^(store|state|redux|zustand)$/i, icon: 'database', color: 'accent-error' },
  { pattern: /^(data|model|schema|migration)s?$/i, icon: 'table_chart' },
  { pattern: /^(lib|util|helper|tool)s?$/i, icon: 'handyman' },
  { pattern: /^(type|interface)s?$/i, icon: 'description' },
  { pattern: /^(test|spec|__test)s?$/i, icon: 'bug_report' },
  { pattern: /^(config|setting)s?$/i, icon: 'tune' },
  { pattern: /^(style|css|theme)s?$/i, icon: 'palette' },
  { pattern: /^hooks?$/i, icon: 'link' },
  { pattern: /^(service|provider|client)s?$/i, icon: 'cloud', color: 'accent-ai' },
  { pattern: /^(auth|login|session)$/i, icon: 'lock' },
  { pattern: /^(learn|education|tutorial)$/i, icon: 'school' },
  { pattern: /^onboarding$/i, icon: 'waving_hand' },
  { pattern: /^search$/i, icon: 'search' },
  { pattern: /^notification(s?)$/i, icon: 'notifications' },
  { pattern: /^(copilot|ai|llm|chat)$/i, icon: 'smart_toy', color: 'accent-ai' },
  { pattern: /^(editor|code|monaco)$/i, icon: 'code' },
  { pattern: /^(blueprint|canvas|graph|map)$/i, icon: 'map' },
  { pattern: /^(electron|desktop)$/i, icon: 'desktop_windows' },
  { pattern: /^(server|backend)$/i, icon: 'dns' },
  { pattern: /^middleware$/i, icon: 'filter_alt' },
  { pattern: /^(public|static|asset|image)s?$/i, icon: 'image' },
  { pattern: /^(script|build|ci|workflow|github)s?$/i, icon: 'terminal' },
  { pattern: /^(doc|readme)s?$/i, icon: 'article' },
  { pattern: /^orchestrat/i, icon: 'route' },
  { pattern: /^(error|exception)s?$/i, icon: 'error' },
];

/** Short directory name overrides for display labels */
export const LABEL_OVERRIDES: Record<string, string> = {
  lib: 'Library',
  llm: 'LLM',
  ai: 'AI',
  api: 'API',
  ui: 'UI',
  db: 'Database',
  utils: 'Utilities',
};

export function getIconForDir(dirName: string): { icon: string; color?: string } {
  for (const entry of DIR_ICON_MAP) {
    if (entry.pattern.test(dirName)) return { icon: entry.icon, color: entry.color };
  }
  return { icon: 'folder' };
}

export function formatLabel(dirName: string): string {
  const lower = dirName.toLowerCase();
  if (LABEL_OVERRIDES[lower]) return LABEL_OVERRIDES[lower];
  return dirName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
