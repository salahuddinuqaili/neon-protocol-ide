import { GlossaryCategory, LessonCategory } from '../types';

export const HELP_TEXT: Record<string, { title: string; body: string }> = {
  blueprint: {
    title: 'Visual Map',
    body: 'This is a bird\'s-eye view of your project. Each box represents a group of related files (like pages, data, or APIs). Click a box to learn more. Drag to rearrange. Use "Add Node" to create your own boxes.',
  },
  code: {
    title: 'Code Editor',
    body: 'This is where you read and edit code files. Click a file in the left sidebar to open it. The AI copilot on the right side can explain code or help you write changes. Press Ctrl+S to save.',
  },
  orchestrator: {
    title: 'AI Settings',
    body: 'Connect AI models to power the copilot assistant. You can use a local provider that runs on your machine, or a cloud service by entering your API endpoint and key.',
  },
};

export const BEGINNER_EXPLAINER = [
  { icon: 'smart_toy', q: 'What is an AI Provider?', a: 'A provider is a service that runs AI models. Local providers run on your computer (free, private). Cloud providers run on remote servers (may require an API key and charge per use).' },
  { icon: 'psychology', q: 'What is a Model?', a: 'A model is a specific AI "brain." Smaller models (2B-7B) are fast but less capable. Larger models (70B+) are smarter but slower and need more memory. It\'s like choosing between a quick snack and a gourmet meal.' },
  { icon: 'token', q: 'What are Tokens?', a: 'Tokens are how AI measures text -- roughly 1 token per word. When the AI reads your question and writes a response, it counts tokens. Cloud providers charge by token usage.' },
  { icon: 'key', q: 'What is an API Key?', a: 'An API key is like a membership card for cloud AI services. You sign up on their website, get a unique key, and paste it here. Keep it secret! Local providers don\'t need one.' },
  { icon: 'route', q: 'What does Routing mean?', a: 'Routing means trying AI providers in order. If your first choice fails, the system automatically tries the next one. Use the arrows to set the order.' },
];

export const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  coding: 'Coding Basics',
  llm: 'AI & LLMs',
  architecture: 'Architecture',
  ide: 'IDE Features',
};

export const TRACK_INFO: Record<LessonCategory, { label: string; icon: string; color: string }> = {
  'coding-basics': { label: 'Coding Basics', icon: 'code', color: 'text-primary' },
  'architecture': { label: 'Architecture', icon: 'account_tree', color: 'text-[#FF9F43]' },
  'llm-orchestration': { label: 'AI & LLMs', icon: 'smart_toy', color: 'text-accent-ai' },
  'git-collaboration': { label: 'Git & Collaboration', icon: 'source', color: 'text-accent-warning' },
};
