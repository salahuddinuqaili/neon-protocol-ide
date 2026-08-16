import { IconName } from './iconManifest';

/**
 * Directory name pattern to Material icon mapping for the blueprint view.
 *
 * Icons are typed as `IconName` so the compiler rejects any glyph missing from
 * `iconManifest.ts` — the bundled font is subset to that list, and an unlisted icon
 * renders as its raw ligature text.
 */
export const DIR_ICON_MAP: { pattern: RegExp; icon: IconName; color?: string }[] = [
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

export function getIconForDir(dirName: string): { icon: IconName; color?: string } {
  for (const entry of DIR_ICON_MAP) {
    if (entry.pattern.test(dirName)) return { icon: entry.icon, color: entry.color };
  }
  return { icon: 'folder' };
}

/** Extension to Material icon mapping for the file tree and Quick Open. */
const FILE_ICON_MAP: { test: RegExp; icon: IconName }[] = [
  { test: /\.json$/i, icon: 'settings_ethernet' },
  { test: /\.md$/i, icon: 'description' },
  { test: /\.css$/i, icon: 'css' },
  { test: /\.html?$/i, icon: 'html' },
  { test: /\.(js|jsx|mjs|cjs)$/i, icon: 'javascript' },
];

export function getFileIcon(name: string): IconName {
  for (const entry of FILE_ICON_MAP) {
    if (entry.test.test(name)) return entry.icon;
  }
  return 'code';
}

export function formatLabel(dirName: string): string {
  const lower = dirName.toLowerCase();
  if (LABEL_OVERRIDES[lower]) return LABEL_OVERRIDES[lower];
  return dirName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
