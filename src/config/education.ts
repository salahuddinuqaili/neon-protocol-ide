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
  terminal: {
    title: 'Integrated Terminal',
    body: 'Run command-line tools directly in your project folder. You can install dependencies, run tests, or use git commands that aren\'t available in the UI. Type "clear" to empty the screen.',
  },
};

export const BEGINNER_EXPLAINER = [
  { icon: 'smart_toy', q: 'What is an AI Provider?', a: 'A provider is a service that runs AI models. Local providers run on your computer (free, private). Cloud providers run on remote servers (may require an API key and charge per use).' },
  { icon: 'psychology', q: 'What is a Model?', a: 'A model is a specific AI "brain." Smaller models (2B-7B) are fast but less capable. Larger models (70B+) are smarter but slower and need more memory. It\'s like choosing between a quick snack and a gourmet meal.' },
  { icon: 'token', q: 'What are Tokens?', a: 'Tokens are how AI measures text -- roughly 1 token per word. When the AI reads your question and writes a response, it counts tokens. Cloud providers charge by token usage.' },
  { icon: 'key', q: 'What is an API Key?', a: 'An API key is like a membership card for cloud AI services. You sign up on their website, get a unique key, and paste it here. Keep it secret! Local providers don\'t need one.' },
  { icon: 'route', q: 'What does Routing mean?', a: 'Routing means trying AI providers in order. If your first choice fails, the system automatically tries the next one. Use the arrows to set the order.' },
  { icon: 'edit_note', q: 'How do I ask good questions?', a: 'Be specific! Instead of "how do I use React?" try "I have a component that needs to update when a button is clicked — how do I use useState?" Include what you are working on, what you want, and any constraints. More context = better answers.' },
  { icon: 'verified_user', q: 'Can I trust the AI\'s answer?', a: 'Not always. AI can be confidently wrong ("hallucinate"). Always verify by: testing the code, checking official docs, or asking "Are you sure? What could go wrong?" Treat AI answers as suggestions to evaluate, not facts to accept.' },
  { icon: 'error', q: 'What if I don\'t have an AI provider?', a: 'No problem! All lessons, glossary, and tutorials work without AI. The copilot just won\'t work until you set up a provider. Start with Ollama (free, local) for a zero-cost start.' },
  { icon: 'lightbulb', q: 'What should I learn first?', a: 'Start with the Learning Path (click the progress ring). Lessons are ordered: functions → components → APIs → databases → AI. Follow the recommended order unless you already know some topics.' },
  { icon: 'shield', q: 'How do I stay safe with AI?', a: 'Don\'t share passwords, API keys, or sensitive data in prompts. Always test AI-generated code before using it in production. Remember: AI is a tool, not a replacement for your judgment.' },
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
