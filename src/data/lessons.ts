import { Lesson, NodeEducation } from '../types';

export const LESSONS: Lesson[] = [
  // --- Coding Basics Track ---
  {
    id: 'what-is-a-function',
    title: 'What is a Function?',
    description: 'Learn the most fundamental building block of programming: reusable blocks of code.',
    category: 'coding-basics',
    requiredView: 'code',
    prerequisiteLessons: [],
    steps: [
      {
        instruction: 'Open "lesson-1-hello.ts" from the sidebar. This file shows a simple function. A function is like a recipe: you define the steps once, then "call" it whenever you need that task done.',
        codeHighlight: { file: 'demo-project/lesson-1-hello.ts', startLine: 1, endLine: 10 },
      },
      {
        instruction: 'Look at the function signature: `function greet(name: string): string`. The word "function" declares it. "greet" is its name. "(name: string)" is the input it needs. ": string" is what it gives back.',
        codeHighlight: { file: 'demo-project/lesson-1-hello.ts', startLine: 8, endLine: 15 },
      },
      {
        instruction: 'Now look at how the function is *called*: `greet("World")`. This runs the recipe with "World" as the ingredient, and it returns "Hello, World!". Functions let you reuse logic without copy-pasting.',
        codeHighlight: { file: 'demo-project/lesson-1-hello.ts', startLine: 16, endLine: 25 },
      },
      {
        instruction: 'Congratulations! You now understand functions: they have a name, inputs (parameters), a body (the steps), and an output (return value). Every program is built from functions calling other functions.',
      },
    ],
  },
  {
    id: 'components-and-reuse',
    title: 'Components and Reuse',
    description: 'Discover how user interfaces are built from small, reusable building blocks.',
    category: 'coding-basics',
    requiredView: 'code',
    prerequisiteLessons: ['what-is-a-function'],
    steps: [
      {
        instruction: 'Open "lesson-2-component.tsx". A component is a special function that returns a piece of user interface. In React, components are the building blocks of everything the user sees.',
        codeHighlight: { file: 'demo-project/lesson-2-component.tsx', startLine: 1, endLine: 10 },
      },
      {
        instruction: 'Notice the JSX syntax: HTML-like code inside JavaScript. `<div className="card">` creates a visual container. Components can include other components, nesting like building blocks.',
        codeHighlight: { file: 'demo-project/lesson-2-component.tsx', startLine: 10, endLine: 25 },
      },
      {
        instruction: 'Components accept "props" (short for properties). These are inputs, like function parameters, that customize what the component displays. This is how one component can be reused with different data.',
        codeHighlight: { file: 'demo-project/lesson-2-component.tsx', startLine: 25, endLine: 40 },
      },
    ],
  },
  {
    id: 'how-data-flows',
    title: 'How Data Flows Through an App',
    description: 'Trace the journey of data from user click to database and back.',
    category: 'coding-basics',
    requiredView: 'code',
    prerequisiteLessons: ['components-and-reuse'],
    steps: [
      {
        instruction: 'Open "lesson-3-api.ts". When a user clicks a button, the frontend sends a request to the backend through an API. This file shows what happens on the receiving end.',
        codeHighlight: { file: 'demo-project/lesson-3-api.ts', startLine: 1, endLine: 15 },
      },
      {
        instruction: 'The API endpoint receives the request, processes it (maybe querying a database), and sends a response back. This request-response pattern is how all web apps work.',
        codeHighlight: { file: 'demo-project/lesson-3-api.ts', startLine: 15, endLine: 30 },
      },
      {
        instruction: 'Now open "lesson-4-database.ts". The database is where data lives permanently. The API calls the database to read or write data. Without a database, everything would be lost when the app restarts.',
        codeHighlight: { file: 'demo-project/lesson-4-database.ts', startLine: 1, endLine: 20 },
      },
      {
        instruction: 'The full flow: User clicks button -> Frontend sends request -> API receives it -> Database stores/retrieves data -> API sends response -> Frontend updates the screen. Switch to the MAP view to see this flow visually!',
      },
    ],
  },
  {
    id: 'reading-typescript',
    title: 'Reading TypeScript',
    description: 'Learn to read TypeScript code by understanding types, interfaces, and common patterns.',
    category: 'coding-basics',
    requiredView: 'code',
    prerequisiteLessons: ['what-is-a-function'],
    steps: [
      {
        instruction: 'TypeScript adds "types" to JavaScript. A type tells you what kind of data something is. `name: string` means "name" holds text. `age: number` means "age" holds a number. This catches mistakes before you run the code.',
        codeHighlight: { file: 'demo-project/lesson-1-hello.ts', startLine: 1, endLine: 10 },
      },
      {
        instruction: 'An "interface" defines the shape of an object. It is like a form template: it says what fields are required and what type each field should be. `interface User { name: string; age: number }` means every User must have a text name and numeric age.',
        codeHighlight: { file: 'demo-project/lesson-3-api.ts', startLine: 1, endLine: 12 },
      },
      {
        instruction: 'The `:` after a variable or parameter is a type annotation. `const count: number = 5` or `function add(a: number, b: number): number`. Read these as labels that describe what goes in each box.',
      },
    ],
  },

  {
    id: 'error-handling-basics',
    title: 'Error Handling: When Code Breaks',
    description: 'Learn to handle errors gracefully so your app doesn\'t crash.',
    category: 'coding-basics',
    requiredView: 'code',
    prerequisiteLessons: ['what-is-a-function'],
    steps: [
      {
        instruction: 'Every function can fail. A network request might timeout. A file might not exist. Instead of crashing, good code anticipates problems and handles them. This is called "error handling."',
      },
      {
        instruction: 'The most common pattern is try/catch. You "try" a risky operation, and if it fails, you "catch" the error and respond safely. This prevents the entire app from crashing.',
        codeHighlight: { file: 'demo-project/lesson-error-handling.ts', startLine: 1, endLine: 25 },
      },
      {
        instruction: 'Look at how we fetch data: if the network request fails, we don\'t crash. Instead, we return a helpful error message. Users can retry or go back. The app stays responsive.',
        codeHighlight: { file: 'demo-project/lesson-error-handling.ts', startLine: 26, endLine: 50 },
      },
      {
        instruction: 'Congratulations! You now understand error handling: anticipate failures, catch errors, and respond gracefully. This is what separates apps that break from apps that work.',
      },
    ],
  },
  {
    id: 'debugging-basics',
    title: 'Debugging: Finding and Fixing Bugs',
    description: 'Learn to systematically find and fix problems in your code.',
    category: 'coding-basics',
    requiredView: 'code',
    prerequisiteLessons: ['what-is-a-function', 'error-handling-basics'],
    steps: [
      {
        instruction: 'Every programmer writes bugs. The skill is finding them fast. Debugging is the process of finding what\'s wrong and fixing it. The three main tools: (1) Read the code carefully, (2) Use console.log() to see values, (3) Use a debugger to pause execution.',
      },
      {
        instruction: 'Most bugs are found by adding console.log() statements: print the input, the output, and intermediate values. This shows you exactly where the data goes wrong.',
        codeHighlight: { file: 'demo-project/lesson-debugging.ts', startLine: 1, endLine: 30 },
      },
      {
        instruction: 'Systematic debugging: (1) Understand what the code should do, (2) Run it and see what it actually does, (3) Form a hypothesis about what\'s wrong, (4) Test with console.log or the debugger, (5) Fix it, (6) Test again.',
        codeHighlight: { file: 'demo-project/lesson-debugging.ts', startLine: 31, endLine: 55 },
      },
      {
        instruction: 'You\'re now a debugger! Remember: debugging is not about being smart — it\'s about being methodical. Print values, read errors, form hypotheses, and test them.',
      },
    ],
  },
  {
    id: 'testing-basics',
    title: 'Testing: Verify Your Code Works',
    description: 'Learn to write tests that catch bugs before users do.',
    category: 'coding-basics',
    requiredView: 'code',
    prerequisiteLessons: ['what-is-a-function', 'error-handling-basics'],
    steps: [
      {
        instruction: 'Testing means writing small checks that verify your code works correctly. Instead of manually testing every feature, you write code that tests your code automatically.',
      },
      {
        instruction: 'A test has three parts: (1) Set up test data, (2) Call the function, (3) Check if the result matches expectations. If the result matches, the test passes. If not, it fails and tells you what went wrong.',
        codeHighlight: { file: 'demo-project/lesson-testing.ts', startLine: 1, endLine: 30 },
      },
      {
        instruction: 'Look at how we test the greet function from Lesson 1. We call it with different inputs and verify the output. If a test fails, we know the function is broken before it reaches users.',
        codeHighlight: { file: 'demo-project/lesson-testing.ts', startLine: 31, endLine: 60 },
      },
      {
        instruction: 'The power of testing: when you change code, run all tests automatically. If anything breaks, tests tell you immediately. This is why professional developers write tests — it saves time and prevents bugs.',
      },
    ],
  },

  // --- Architecture Track ---
  {
    id: 'frontend-vs-backend',
    title: 'Frontend vs Backend',
    description: 'Understand the two halves of every web application and why they are separated.',
    category: 'architecture',
    requiredView: 'blueprint',
    prerequisiteLessons: [],
    steps: [
      {
        instruction: 'Look at the blueprint map. The "User Interface" node is the frontend -- what users see. The other nodes (API, Database, AI) are the backend -- what runs behind the scenes. This separation is fundamental to all web apps.',
        nodeHighlight: 'User Interface',
      },
      {
        instruction: 'Why separate them? The frontend runs on the user\'s device (their browser). The backend runs on a server. This means many users can share one backend, and you can update the frontend without touching the database.',
        nodeHighlight: 'AI Router',
      },
      {
        instruction: 'The lines (edges) between nodes show communication. The frontend talks to the backend through APIs -- structured messages sent over the internet. The backend never directly touches the user\'s screen.',
      },
    ],
  },
  {
    id: 'apis-the-bridges',
    title: 'APIs: The Bridges Between Systems',
    description: 'Learn how different parts of an application communicate through APIs.',
    category: 'architecture',
    requiredView: 'code',
    prerequisiteLessons: ['frontend-vs-backend'],
    steps: [
      {
        instruction: 'Open "lesson-3-api.ts". An API (Application Programming Interface) defines the rules for communication between systems. The frontend says "Give me all users", the API knows how to fulfill that request.',
        codeHighlight: { file: 'demo-project/lesson-3-api.ts', startLine: 1, endLine: 12 },
      },
      {
        instruction: 'APIs use HTTP methods: GET (read data), POST (create data), PUT (update data), DELETE (remove data). Each "endpoint" handles one type of request. `/api/users` might handle GET (list users) and POST (create a user).',
        codeHighlight: { file: 'demo-project/lesson-3-api.ts', startLine: 12, endLine: 30 },
      },
      {
        instruction: 'AI services also use APIs! When the copilot asks a question, it sends an HTTP POST request to the AI provider\'s API with your prompt, and gets back the AI\'s response. Switch to the MAP view to see this connection.',
      },
    ],
  },
  {
    id: 'why-databases-matter',
    title: 'Why Databases Matter',
    description: 'Understand data persistence and why applications need databases.',
    category: 'architecture',
    requiredView: 'code',
    prerequisiteLessons: ['frontend-vs-backend'],
    steps: [
      {
        instruction: 'Open "lesson-4-database.ts". Without a database, your app has amnesia -- it forgets everything when it restarts. A database is permanent storage: user accounts, messages, settings all live here.',
        codeHighlight: { file: 'demo-project/lesson-4-database.ts', startLine: 1, endLine: 15 },
      },
      {
        instruction: 'Databases support CRUD operations: Create (add new data), Read (fetch existing data), Update (change data), Delete (remove data). Almost every feature in every app maps to one of these four operations.',
        codeHighlight: { file: 'demo-project/lesson-4-database.ts', startLine: 15, endLine: 35 },
      },
      {
        instruction: 'Switch to the MAP view and find the "Data Storage" node. Notice how the API connects to it -- the API is the gatekeeper that controls who can read or write data. The frontend never talks to the database directly for security reasons.',
        nodeHighlight: 'Data Storage',
      },
    ],
  },

  // --- LLM Orchestration Track ---
  {
    id: 'what-is-an-llm',
    title: 'What is an LLM?',
    description: 'Understand Large Language Models -- the AI "brains" that power modern assistants.',
    category: 'llm-orchestration',
    requiredView: 'code',
    prerequisiteLessons: [],
    steps: [
      {
        instruction: 'Open "lesson-5-ai-prompt.ts". An LLM (Large Language Model) is an AI trained on billions of pages of text. It predicts what words should come next, but does this so well it can answer questions, write code, and hold conversations.',
        codeHighlight: { file: 'demo-project/lesson-5-ai-prompt.ts', startLine: 1, endLine: 15 },
      },
      {
        instruction: 'LLMs understand "prompts" -- the text you send them. A prompt includes a system message (hidden instructions) and user messages (your questions). The quality of the prompt directly affects the quality of the response.',
        codeHighlight: { file: 'demo-project/lesson-5-ai-prompt.ts', startLine: 15, endLine: 35 },
      },
      {
        instruction: 'LLMs measure text in "tokens" (roughly 1 token per word). They have a limited "context window" -- the maximum tokens they can see at once. This is why the copilot only sends the first 100 lines of your file, not the whole thing.',
        codeHighlight: { file: 'demo-project/lesson-5-ai-prompt.ts', startLine: 35, endLine: 50 },
      },
    ],
  },
  {
    id: 'local-vs-cloud-ai',
    title: 'Local vs Cloud AI',
    description: 'Compare running AI on your computer versus using cloud services.',
    category: 'llm-orchestration',
    requiredView: 'orchestrator',
    prerequisiteLessons: ['what-is-an-llm'],
    steps: [
      {
        instruction: 'Switch to the AI settings view. You\'ll see providers listed here. "Ollama" is a local provider -- it runs AI models directly on your computer, for free, with no internet needed.',
      },
      {
        instruction: 'Cloud providers like OpenAI and Anthropic run powerful models on their servers. They are faster and more capable, but cost money (per token) and require an API key and internet connection.',
      },
      {
        instruction: 'The best strategy? Use local AI for everyday questions (it\'s free) and cloud AI for complex tasks that need a smarter model. The Neon Protocol IDE lets you set up multiple providers and automatically falls back between them.',
      },
    ],
  },
  {
    id: 'tokens-and-context',
    title: 'Tokens and Context Windows',
    description: 'Understand how AI measures text and why conversation length matters.',
    category: 'llm-orchestration',
    requiredView: 'code',
    prerequisiteLessons: ['what-is-an-llm'],
    steps: [
      {
        instruction: 'Open "lesson-5-ai-prompt.ts" and look at the token explanation section. AI models break text into tokens -- roughly one token per word. "Hello world" is about 2 tokens. A full page of text is about 500 tokens.',
        codeHighlight: { file: 'demo-project/lesson-5-ai-prompt.ts', startLine: 35, endLine: 50 },
      },
      {
        instruction: 'Each model has a context window -- a maximum number of tokens it can process at once. This includes the system message, conversation history, AND the response. If you hit the limit, older messages get dropped.',
      },
      {
        instruction: 'Token usage is also how cloud providers charge you. More tokens = higher cost. This is why the IDE tracks token usage in the AI settings -- so you can monitor your spending. Switch to the AI view and check the "Usage" tab.',
      },
    ],
  },
  {
    id: 'provider-routing-explained',
    title: 'Provider Routing Explained',
    description: 'Learn how the IDE intelligently routes AI requests across multiple providers.',
    category: 'llm-orchestration',
    requiredView: 'code',
    prerequisiteLessons: ['local-vs-cloud-ai'],
    steps: [
      {
        instruction: 'Open "lesson-6-ai-router.ts". Routing means choosing which AI provider to use. Instead of hardcoding one provider, the IDE tries them in priority order and falls back if one fails.',
        codeHighlight: { file: 'demo-project/lesson-6-ai-router.ts', startLine: 1, endLine: 15 },
      },
      {
        instruction: 'Look at the routing logic: filter enabled providers, sort by priority, try each one. If the first provider fails (network error, expired key, overloaded), automatically try the next. This is the "fallback" pattern.',
        codeHighlight: { file: 'demo-project/lesson-6-ai-router.ts', startLine: 15, endLine: 35 },
      },
      {
        instruction: 'Switch to the AI settings. You can reorder providers with the up/down arrows to set priority. The top provider is tried first. This is real orchestration -- coordinating multiple AI services for reliability.',
      },
    ],
  },
  {
    id: 'building-an-ai-pipeline',
    title: 'Building an AI Pipeline',
    description: 'See how all the pieces connect into a complete AI-assisted development workflow.',
    category: 'llm-orchestration',
    requiredView: 'code',
    prerequisiteLessons: ['provider-routing-explained', 'tokens-and-context'],
    steps: [
      {
        instruction: 'Open "lesson-7-orchestrator.ts". This file shows the complete picture: prompts go in, the router picks a provider, the provider generates a response, tokens are tracked, and the result comes back to you.',
        codeHighlight: { file: 'demo-project/lesson-7-orchestrator.ts', startLine: 1, endLine: 20 },
      },
      {
        instruction: 'The copilot uses this pipeline every time you ask a question. It constructs a prompt (including the system message and your code), routes it through your providers, and displays the response. All the pieces you\'ve learned work together.',
        codeHighlight: { file: 'demo-project/lesson-7-orchestrator.ts', startLine: 20, endLine: 45 },
      },
      {
        instruction: 'Switch to the MAP view and find the "AI Router" and "AI Service" nodes. This is the visual representation of what you just learned. You now understand the full AI orchestration pipeline! Congratulations on completing the LLM Orchestration track.',
        nodeHighlight: 'AI Router',
      },
    ],
  },

  // --- AI Best Practices Track ---
  {
    id: 'writing-effective-prompts',
    title: 'Writing Effective Prompts',
    description: 'Learn to ask better questions and get better answers from AI.',
    category: 'llm-orchestration',
    requiredView: 'code',
    prerequisiteLessons: ['what-is-an-llm'],
    steps: [
      {
        instruction: 'Open "lesson-8-prompting.ts". The quality of an AI\'s answer depends almost entirely on how you ask. A vague question gets a vague answer. A specific, well-structured question gets a useful one.',
        codeHighlight: { file: 'demo-project/lesson-8-prompting.ts', startLine: 1, endLine: 18 },
      },
      {
        instruction: 'Look at the "bad vs good" prompt examples. "How do I code?" gives the AI nothing to work with. But "I have a TypeScript function that takes a user object and returns their full name — how should I handle the case where the last name is missing?" gives context, constraints, and a clear question.',
        codeHighlight: { file: 'demo-project/lesson-8-prompting.ts', startLine: 19, endLine: 46 },
      },
      {
        instruction: 'Great prompts follow a pattern: (1) Context — what you are working on, (2) Question — what you need, (3) Constraints — any requirements or preferences. Try it now: open the Copilot and ask about the file you have open. Include what you are trying to do, not just "explain this code."',
        codeHighlight: { file: 'demo-project/lesson-8-prompting.ts', startLine: 47, endLine: 70 },
      },
      {
        instruction: 'One last skill: follow-up prompting. If the AI\'s answer is too complex, say "Explain that more simply." If it is too brief, say "Give me a concrete example." If it is wrong, say "That doesn\'t seem right because..." Conversation with AI is iterative, not one-shot.',
        codeHighlight: { file: 'demo-project/lesson-8-prompting.ts', startLine: 71, endLine: 90 },
      },
    ],
  },
  {
    id: 'vibe-coding-with-ai',
    title: 'Vibe Coding: Iterating with AI',
    description: 'Learn the iterative workflow of building software collaboratively with AI.',
    category: 'llm-orchestration',
    requiredView: 'code',
    prerequisiteLessons: ['writing-effective-prompts'],
    steps: [
      {
        instruction: 'Open "lesson-9-vibe-coding.ts". Vibe coding is a workflow where you describe what you want, ask the AI for ideas, evaluate its suggestions, and iterate. Instead of "write this for me," you collaborate: "Let\'s think about how to solve this."',
        codeHighlight: { file: 'demo-project/lesson-9-vibe-coding.ts', startLine: 1, endLine: 20 },
      },
      {
        instruction: 'The vibe coding loop has 4 steps: (1) Describe your intent in plain English, (2) Review the AI\'s suggestion critically, (3) Ask follow-ups to refine, (4) Test the result yourself. You drive; the AI assists. Never blindly copy-paste AI output.',
        codeHighlight: { file: 'demo-project/lesson-9-vibe-coding.ts', startLine: 21, endLine: 45 },
      },
      {
        instruction: 'Why not just let the AI do everything? Because AI can hallucinate — confidently produce code that looks correct but has subtle bugs. You need to understand what the code does, test it, and verify edge cases. AI is a power tool, not an autopilot.',
        codeHighlight: { file: 'demo-project/lesson-9-vibe-coding.ts', startLine: 46, endLine: 70 },
      },
      {
        instruction: 'Try it now! Open the Copilot and practice the vibe coding loop: (1) Describe a small feature you want, (2) Read the AI\'s response carefully, (3) Ask "What could go wrong with this approach?", (4) Ask "Can you simplify this?" The best developers use AI as a thinking partner, not a replacement for thinking.',
      },
    ],
  },
  {
    id: 'spotting-ai-mistakes',
    title: 'Spotting AI Mistakes',
    description: 'Learn to identify when AI is wrong and how to verify its output.',
    category: 'llm-orchestration',
    requiredView: 'code',
    prerequisiteLessons: ['what-is-an-llm', 'writing-effective-prompts'],
    steps: [
      {
        instruction: 'AI models are confident even when wrong. They can invent function names that don\'t exist, suggest deprecated syntax, or oversimplify complex problems. This is called "hallucination." Your job is to stay skeptical and verify.',
      },
      {
        instruction: 'Red flags to watch for: (1) The AI says "simply do X" for something complex — it may be oversimplifying. (2) It references a specific library version — it may be outdated. (3) It gives very different answers when you rephrase the same question — it may be guessing.',
      },
      {
        instruction: 'How to verify: (1) Test the code — does it actually run? (2) Check the docs — does that function really exist with those parameters? (3) Ask a follow-up: "Are you sure about that? What\'s the source?" (4) Ask for alternatives: "What other approaches exist?"',
      },
      {
        instruction: 'Knowing when NOT to trust AI is just as important as knowing how to use it. Use AI for brainstorming, explaining concepts, and getting unstuck. Use documentation, tests, and your own reasoning for final decisions. The best developers combine both.',
      },
    ],
  },

  {
    id: 'ai-limitations-ethics',
    title: 'AI Limitations and Responsible Use',
    description: 'Understand what AI can and cannot do, and how to use it responsibly.',
    category: 'llm-orchestration',
    requiredView: 'code',
    prerequisiteLessons: ['spotting-ai-mistakes', 'vibe-coding-with-ai'],
    steps: [
      {
        instruction: 'AI is powerful but not magical. LLMs have hard limits: they can hallucinate, they can\'t reason about the future, they can\'t access the internet unless you tell them, and they can produce biased outputs if trained on biased data.',
      },
      {
        instruction: 'Good practices: (1) Always verify AI output — test the code it generates, (2) Use AI for brainstorming, not final decisions, (3) Don\'t share sensitive data (passwords, API keys) in prompts, (4) Understand that AI doesn\'t truly "understand" — it predicts patterns.',
      },
      {
        instruction: 'Responsible use means: knowing AI can be wrong, knowing training data includes biases, knowing AI output may have licensing implications. When using AI, you are responsible for the final result.',
      },
      {
        instruction: 'The best developers use AI as a tool, not a replacement for judgment. AI is fast at generating code, but humans are responsible for its correctness and ethics. You now understand how to use AI effectively and responsibly.',
      },
    ],
  },

  // --- Git & Collaboration Track ---
  {
    id: 'what-is-version-control',
    title: 'What is Version Control?',
    description: 'Understand why developers track changes and how git saves your work.',
    category: 'git-collaboration',
    requiredView: 'code',
    prerequisiteLessons: [],
    steps: [
      {
        instruction: 'Imagine writing an essay and being able to undo any change from any point — even from last week. That\'s what version control does for code. Git is the most popular version control system. It records every change as a "commit" — a snapshot of your project at a moment in time.',
      },
      {
        instruction: 'Each commit has: (1) a unique ID (hash), (2) a message describing the change, (3) who made the change, and (4) when. You can browse the full history, compare any two points, or undo a mistake by going back to an earlier commit.',
      },
      {
        instruction: 'In the sidebar, click the GIT tab. If your project is a git repository, you\'ll see changed files listed here. If not, it will say "Not a git repository." All professional projects use git — it\'s as fundamental as the code editor itself.',
      },
    ],
  },
  {
    id: 'staging-and-committing',
    title: 'Staging and Committing',
    description: 'Learn the two-step process of saving changes: stage first, then commit.',
    category: 'git-collaboration',
    requiredView: 'code',
    prerequisiteLessons: ['what-is-version-control'],
    steps: [
      {
        instruction: 'Git uses a two-step save process. First you "stage" files — this selects which changes to include. Then you "commit" — this saves the staged changes permanently. Think of staging as packing a box, and committing as shipping it.',
      },
      {
        instruction: 'Why two steps? Because you might change 10 files but want to save related changes together. Stage the 3 files that fix a bug, commit with message "Fix login timeout." Stage the other 7 later with a different message. This keeps your history clean and readable.',
      },
      {
        instruction: 'In the GIT tab: click the + button next to a file to stage it (moves it to the "Staged" section). Write a short, clear commit message like "Add user profile page" and press Ctrl+Enter or click Commit. Your changes are now saved in git\'s history.',
      },
    ],
  },
  {
    id: 'branches-explained',
    title: 'Branches: Parallel Workstreams',
    description: 'Learn how branches let you work on features without breaking the main code.',
    category: 'git-collaboration',
    requiredView: 'code',
    prerequisiteLessons: ['staging-and-committing'],
    steps: [
      {
        instruction: 'A branch is a parallel version of your project. The "main" branch is the primary, stable version. When you want to add a feature or fix a bug, you create a new branch, make your changes there, and merge it back when done.',
      },
      {
        instruction: 'Why branch? If you code directly on "main" and break something, everyone is affected. With branches, your in-progress work is isolated. Three developers can work on three features simultaneously, each on their own branch, without interfering.',
      },
      {
        instruction: 'Click the branch name in the bottom footer bar. You\'ll see all local and remote branches. Click "Create new branch" to start a new one. When you\'re done with your work, push the branch and create a pull request to merge it back to main.',
      },
    ],
  },
  {
    id: 'push-pull-collaborate',
    title: 'Push, Pull, and Collaboration',
    description: 'Share your work with others by pushing to and pulling from remote repositories.',
    category: 'git-collaboration',
    requiredView: 'code',
    prerequisiteLessons: ['branches-explained'],
    steps: [
      {
        instruction: 'A "remote" is a copy of your repository on a server (like GitHub). When you push, your local commits upload to the remote. When you pull, you download new commits others have pushed. This is how teams stay in sync.',
      },
      {
        instruction: 'The workflow: (1) Pull to get the latest changes. (2) Make your changes locally. (3) Stage and commit. (4) Push to share. Always pull before pushing to avoid conflicts. The GIT tab shows upload/download arrows for push and pull.',
      },
      {
        instruction: 'If the footer shows "↑2" next to your branch, you have 2 commits to push. "↓3" means 3 commits to pull. The diff viewer (click any changed file) shows exactly what changed — the old version on the left, the new on the right.',
      },
    ],
  },
  {
    id: 'handling-merge-conflicts',
    title: 'Merge Conflicts: When Collaboration Collides',
    description: 'Learn to resolve merge conflicts when two developers change the same code.',
    category: 'git-collaboration',
    requiredView: 'code',
    prerequisiteLessons: ['push-pull-collaborate'],
    steps: [
      {
        instruction: 'When you and a teammate both edit the same lines, Git can\'t automatically merge. You get a "merge conflict." Instead of panicking, there\'s a clear process: read the conflict markers, choose which version to keep, test, and commit.',
      },
      {
        instruction: 'Git marks conflicts with special markers: <<<<<<< marks your changes, ======= separates the two versions, and >>>>>>> marks their changes. You manually edit the file to keep the correct version, delete the markers, and commit.',
        codeHighlight: { file: 'demo-project/lesson-merge-conflict.ts', startLine: 1, endLine: 30 },
      },
      {
        instruction: 'Best practice: communicate with your team before committing. "I\'m changing the login function — are you working on it too?" Prevention is easier than resolution. Use branches to isolate work. Pull before pushing. This reduces conflicts dramatically.',
      },
      {
        instruction: 'Congratulations! You can now handle the trickiest part of team development. Merge conflicts are normal. With the right process, they\'re not scary — just a routine part of collaboration.',
      },
    ],
  },
];

// --- Node Education Data ---
// Maps blueprint node names to educational content shown in ModuleExplorer

export const NODE_EDUCATION: Record<string, NodeEducation> = {
  'User Interface': {
    title: 'Frontend / User Interface',
    concept: 'What is a Frontend?',
    explanation: 'The frontend is everything the user sees and interacts with: buttons, forms, lists, navigation. It runs in the browser and communicates with the backend to fetch or save data. Technologies like React, HTML, and CSS are used to build frontends.',
    realWorldAnalogy: 'Think of a restaurant. The frontend is the dining area: the menu, the tables, the decor. Customers interact with this part. Behind the kitchen doors is the backend.',
  },
  'AI Router': {
    title: 'Router / Orchestrator',
    concept: 'What is Routing?',
    explanation: 'A router receives incoming requests and decides where to send them. In AI orchestration, the router picks which AI provider to use based on priority and availability. If one provider fails, it falls back to the next one.',
    realWorldAnalogy: 'Like a phone switchboard operator who connects your call to the right person. If that person is busy, they transfer you to someone else who can help.',
  },
  'Data Storage': {
    title: 'Database / Storage',
    concept: 'What is a Database?',
    explanation: 'A database stores information permanently so it survives app restarts. User accounts, messages, settings, and any data your app needs to remember goes here. The API layer controls who can read or write data.',
    realWorldAnalogy: 'A database is like a filing cabinet. The API is the office assistant who files and retrieves documents for you. You never go into the cabinet directly -- you always ask the assistant.',
  },
  'AI Service': {
    title: 'External AI Service',
    concept: 'What is a Cloud Service?',
    explanation: 'An external service is a program running on someone else\'s server that your app communicates with over the internet. AI providers like OpenAI and Anthropic are external services. You send them requests via their API and get responses back.',
    realWorldAnalogy: 'Like ordering delivery from a restaurant. You don\'t cook the food yourself (that would be "local AI" with Ollama). Instead, you call the restaurant (API), place your order (prompt), and they deliver the result (response).',
  },
  'API Endpoints': {
    title: 'API Layer',
    concept: 'What is an API?',
    explanation: 'An API (Application Programming Interface) is a set of rules defining how different software components communicate. API endpoints are specific URLs that accept requests and return responses. They act as the bridge between the frontend and backend.',
    realWorldAnalogy: 'An API is like a waiter at a restaurant. You (the frontend) tell the waiter what you want. The waiter takes your order to the kitchen (backend), and brings back your food (data).',
  },
  'Pages & UI': {
    title: 'Pages and Components',
    concept: 'What are Pages?',
    explanation: 'Web applications are organized into pages (like Home, Settings, Profile). Each page is built from smaller components (buttons, forms, lists) that can be reused across pages. The router decides which page to show based on the URL.',
    realWorldAnalogy: 'Pages are like chapters in a book. Components are like paragraphs and images that appear within chapters. Some elements (like the header) appear on every page, just like a running header in a book.',
  },
  'Data & Storage': {
    title: 'Data Layer',
    concept: 'What is a Data Layer?',
    explanation: 'The data layer handles reading, writing, and managing all the information your app needs. This includes databases, caches, and file storage. It ensures data is consistent, available, and secure.',
    realWorldAnalogy: 'The data layer is like a warehouse. Different departments (API endpoints) request items from the warehouse, and the warehouse keeps track of inventory (data integrity).',
  },
  'App Logic': {
    title: 'Business Logic',
    concept: 'What is Business Logic?',
    explanation: 'Business logic is the code that implements your app\'s rules and decisions. "If a user has posted 3 times, show them a badge." "If the cart total exceeds $100, apply a discount." These rules are the core of what makes your app unique.',
    realWorldAnalogy: 'Business logic is like the rules of a board game. The board and pieces (UI) let you play, but the rules (logic) determine what moves are valid and who wins.',
  },
};
