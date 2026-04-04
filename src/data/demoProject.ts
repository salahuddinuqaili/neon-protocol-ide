import { FileEntry } from '../types';

export const DEMO_FILES: FileEntry[] = [
  {
    name: 'README.md',
    path: 'demo-project/README.md',
    language: 'markdown',
    content: `# Welcome to Your First AI App!

This demo project teaches you how software is built, piece by piece.
Each file is a lesson that introduces a coding concept.

## How to Use This Project

1. **Read the files in order** (lesson-1 through lesson-7)
2. **Switch to the MAP view** to see how the pieces connect visually
3. **Ask the AI Copilot** questions about any code you don't understand

## File Guide

| File | What You'll Learn |
|------|-------------------|
| lesson-1-hello.ts | Functions and variables |
| lesson-2-component.tsx | UI components and reuse |
| lesson-3-api.ts | APIs and request/response |
| lesson-4-database.ts | Data persistence and CRUD |
| lesson-5-ai-prompt.ts | How AI understands text |
| lesson-6-ai-router.ts | Provider routing and fallback |
| lesson-7-orchestrator.ts | The complete AI pipeline |
| lesson-8-prompting.ts | Writing effective prompts |
| lesson-9-vibe-coding.ts | Iterating with AI (vibe coding) |

Happy learning!
`,
  },
  {
    name: 'lesson-1-hello.ts',
    path: 'demo-project/lesson-1-hello.ts',
    language: 'typescript',
    content: `// ===========================================
// LESSON 1: Functions and Variables
// ===========================================
// A function is a reusable block of code.
// You define it once, then "call" it whenever you need it.
// Think of it like a recipe: define the steps, then cook anytime.

// --- What is a variable? ---
// A variable is a named container that stores a value.
// \`const\` means the value won't change (constant).
// \`let\` means the value can change later.

const appName: string = "My First App";
let userCount: number = 0;

// --- What is a function? ---
// A function has: a name, inputs (parameters), and an output (return value).
// This function takes a "name" (text) and returns a greeting (text).

function greet(name: string): string {
  // The \`return\` keyword sends a value back to whoever called this function
  return "Hello, " + name + "!";
}

// --- Calling a function ---
// To use a function, you "call" it by writing its name followed by parentheses.
// The value inside the parentheses is the "argument" (the actual input).

const message = greet("World");
// message now contains: "Hello, World!"

// --- Functions can call other functions ---
// This is how programs are built: small functions working together.

function welcomeUser(name: string): string {
  userCount = userCount + 1;  // Update the variable
  const greeting = greet(name);  // Call the greet function
  return greeting + " You are visitor #" + userCount;
}

// --- Try it yourself ---
// Ask the AI Copilot: "What does the welcomeUser function do step by step?"

const result = welcomeUser("Alice");
// result = "Hello, Alice! You are visitor #1"

// KEY TAKEAWAYS:
// 1. Variables store data (const = fixed, let = changeable)
// 2. Functions are reusable recipes (name + inputs + output)
// 3. Functions can call other functions to build complex behavior
// 4. TypeScript adds types (: string, : number) to catch errors early
`,
  },
  {
    name: 'lesson-2-component.tsx',
    path: 'demo-project/lesson-2-component.tsx',
    language: 'typescript',
    content: `// ===========================================
// LESSON 2: Components and Reuse
// ===========================================
// A component is a function that returns a piece of user interface.
// Components are the building blocks of everything the user sees.
// They use JSX -- a syntax that looks like HTML inside JavaScript.

import React from 'react';

// --- What is a component? ---
// A component is a function that returns JSX (visual elements).
// This component displays a greeting card.

function GreetingCard() {
  return (
    <div className="card">
      <h2>Welcome!</h2>
      <p>This is a React component.</p>
    </div>
  );
}

// --- What are props? ---
// Props (short for "properties") are inputs to a component.
// They let you customize what a component displays.
// Think of props like settings on a widget.

// First, define what props this component accepts:
interface UserCardProps {
  name: string;       // The user's name (required)
  role: string;       // The user's role (required)
  isOnline?: boolean; // Whether they're online (optional -- note the ?)
}

// Then, use those props in the component:
function UserCard(props: UserCardProps) {
  return (
    <div className="user-card">
      <h3>{props.name}</h3>
      <p>Role: {props.role}</p>
      <span>{props.isOnline ? "Online" : "Offline"}</span>
    </div>
  );
}

// --- Reusing components ---
// The magic of components: use the same building block with different data!
// Each <UserCard /> below is the same component, but with different props.

function TeamPage() {
  return (
    <div>
      <h1>Our Team</h1>
      <UserCard name="Alice" role="Engineer" isOnline={true} />
      <UserCard name="Bob" role="Designer" isOnline={false} />
      <UserCard name="Carol" role="Manager" isOnline={true} />
    </div>
  );
}

// --- Components inside components ---
// Components can contain other components, building complex UIs
// from simple pieces. This is called "composition".

function App() {
  return (
    <div>
      <GreetingCard />
      <TeamPage />
    </div>
  );
}

export default App;

// KEY TAKEAWAYS:
// 1. Components are functions that return visual elements (JSX)
// 2. Props are inputs that customize a component's output
// 3. Components can be reused with different props
// 4. Components can contain other components (composition)
// 5. This pattern builds complex UIs from simple building blocks
`,
  },
  {
    name: 'lesson-3-api.ts',
    path: 'demo-project/lesson-3-api.ts',
    language: 'typescript',
    content: `// ===========================================
// LESSON 3: APIs and Request/Response
// ===========================================
// An API (Application Programming Interface) is how different
// parts of an application talk to each other.
// Think of it like a waiter: you (frontend) place an order,
// the waiter (API) brings it to the kitchen (backend),
// and returns with your food (data).

// --- Define the shape of our data ---
// An interface says "every User object must have these fields."
// This is TypeScript keeping us honest about data structure.

interface User {
  id: number;
  name: string;
  email: string;
}

// --- A simple in-memory "database" for this lesson ---
const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];

// --- API Endpoint: GET all users ---
// "GET" means "give me data." This function handles requests
// to read the list of all users.

function getUsers(): User[] {
  // In a real app, this would query a database
  return users;
}

// --- API Endpoint: GET one user by ID ---
// Find a specific user. Returns the user or undefined if not found.

function getUserById(id: number): User | undefined {
  return users.find(user => user.id === id);
}

// --- API Endpoint: POST (create) a new user ---
// "POST" means "create something new." This adds a user to the list.

function createUser(name: string, email: string): User {
  const newUser: User = {
    id: users.length + 1,  // Simple ID generation
    name: name,
    email: email,
  };
  users.push(newUser);  // Add to our "database"
  return newUser;        // Return the created user
}

// --- How the frontend uses this API ---
// In a real web app, the frontend sends HTTP requests:
//
//   GET  /api/users        -> getUsers()        -> returns all users
//   GET  /api/users/1      -> getUserById(1)    -> returns Alice
//   POST /api/users        -> createUser(...)   -> creates new user
//
// The frontend never touches the database directly.
// The API is the gatekeeper that controls access.

// --- Try it ---
const allUsers = getUsers();
const alice = getUserById(1);
const newUser = createUser("Carol", "carol@example.com");

// KEY TAKEAWAYS:
// 1. APIs define rules for how software components communicate
// 2. GET = read data, POST = create data (also PUT = update, DELETE = remove)
// 3. Each "endpoint" handles one type of request
// 4. The frontend talks to the API, the API talks to the database
// 5. This separation keeps your app organized and secure
`,
  },
  {
    name: 'lesson-4-database.ts',
    path: 'demo-project/lesson-4-database.ts',
    language: 'typescript',
    content: `// ===========================================
// LESSON 4: Data Persistence and CRUD
// ===========================================
// Without a database, your app has amnesia -- it forgets
// everything when it restarts. A database stores data
// permanently so it survives restarts, crashes, and updates.

// --- CRUD: The four fundamental operations ---
// Almost every feature in every app maps to one of these:
//   C - Create  (add new data)
//   R - Read    (fetch existing data)
//   U - Update  (change existing data)
//   D - Delete  (remove data)

// --- Defining our data shape ---
interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
}

// --- A simple database simulation ---
// In a real app, this would be PostgreSQL, MongoDB, SQLite, etc.
// We'll use an in-memory array to demonstrate the concepts.

class SimpleDatabase {
  private items: TodoItem[] = [];
  private nextId = 1;

  // CREATE: Add a new item
  create(title: string): TodoItem {
    const item: TodoItem = {
      id: this.nextId++,
      title: title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.items.push(item);
    console.log("Created:", item.title);
    return item;
  }

  // READ: Get all items (with optional filter)
  readAll(onlyCompleted?: boolean): TodoItem[] {
    if (onlyCompleted !== undefined) {
      return this.items.filter(item => item.completed === onlyCompleted);
    }
    return [...this.items]; // Return a copy to prevent direct mutation
  }

  // READ: Get one item by ID
  readById(id: number): TodoItem | undefined {
    return this.items.find(item => item.id === id);
  }

  // UPDATE: Change an existing item
  update(id: number, changes: Partial<TodoItem>): TodoItem | undefined {
    const item = this.items.find(item => item.id === id);
    if (item) {
      Object.assign(item, changes); // Apply the changes
      console.log("Updated:", item.title);
    }
    return item;
  }

  // DELETE: Remove an item
  delete(id: number): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      const removed = this.items.splice(index, 1);
      console.log("Deleted:", removed[0].title);
      return true;
    }
    return false;
  }
}

// --- Using the database ---
const db = new SimpleDatabase();

// Create
const todo1 = db.create("Learn about functions");
const todo2 = db.create("Build a component");
const todo3 = db.create("Set up an AI provider");

// Read
const allTodos = db.readAll();           // All 3 items
const firstTodo = db.readById(1);        // Just "Learn about functions"

// Update
db.update(1, { completed: true });       // Mark first todo as done
const completed = db.readAll(true);      // Just the completed ones

// Delete
db.delete(2);                            // Remove "Build a component"
const remaining = db.readAll();          // 2 items left

// KEY TAKEAWAYS:
// 1. Databases store data permanently (survive restarts)
// 2. CRUD = Create, Read, Update, Delete (the four operations)
// 3. Every app feature maps to one of these operations
// 4. The API layer controls access to the database
// 5. Never let the frontend access the database directly
`,
  },
  {
    name: 'lesson-5-ai-prompt.ts',
    path: 'demo-project/lesson-5-ai-prompt.ts',
    language: 'typescript',
    content: `// ===========================================
// LESSON 5: How AI Understands Text
// ===========================================
// LLMs (Large Language Models) are AI systems trained on
// vast amounts of text. They generate responses by predicting
// what words should come next. Let's learn how to talk to them.

// --- What is a message? ---
// AI conversations use a message format with "roles":

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// - "system": Hidden instructions that set the AI's behavior
//   (the user never sees this, but it shapes every response)
//
// - "user": The human's messages (questions, instructions)
//
// - "assistant": The AI's responses

// --- Building a prompt ---
// A prompt is the complete set of messages you send to the AI.
// The system message goes first, then the conversation history.

function buildPrompt(
  systemInstruction: string,
  userQuestion: string,
  codeContext?: string
): AIMessage[] {
  const messages: AIMessage[] = [];

  // Step 1: System message sets the AI's personality and rules
  messages.push({
    role: 'system',
    content: systemInstruction,
  });

  // Step 2: Optionally include code context
  // This helps the AI understand what you're working on
  if (codeContext) {
    messages.push({
      role: 'user',
      content: "Here is the code I'm working on:\\n" + codeContext,
    });
    messages.push({
      role: 'assistant',
      content: "I see the code. What would you like to know about it?",
    });
  }

  // Step 3: The actual user question
  messages.push({
    role: 'user',
    content: userQuestion,
  });

  return messages;
}

// --- Example: The copilot builds a prompt like this ---
const copilotPrompt = buildPrompt(
  "You are a helpful coding assistant. Be concise and clear.",
  "What does the greet function do?",
  'function greet(name: string) { return "Hello, " + name; }'
);
// Result: 4 messages that give the AI all the context it needs

// --- What are tokens? ---
// AI models don't read words -- they read "tokens."
// A token is roughly 3/4 of a word in English.
//
//   "Hello world"         = ~2 tokens
//   "function greet()"    = ~4 tokens
//   A full page of text   = ~500 tokens
//   This entire file      = ~700 tokens
//
// Why tokens matter:
// 1. Each model has a maximum "context window" (e.g., 4096 tokens)
// 2. Everything must fit: system + history + question + response
// 3. Cloud providers charge per token (more tokens = higher cost)

function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

// --- Context window limits ---
// If your conversation exceeds the context window, older messages
// are dropped. This is why the copilot only sends the first
// 100 lines of your file -- to leave room for the response.

const contextWindowSize = 4096; // tokens (varies by model)
const systemTokens = estimateTokens("You are a helpful assistant.");
const availableForChat = contextWindowSize - systemTokens;

// KEY TAKEAWAYS:
// 1. AI conversations use messages with roles: system, user, assistant
// 2. The system message shapes the AI's behavior (like stage directions)
// 3. Tokens are how AI measures text (~1 token per word)
// 4. Context windows limit how much text the AI can process at once
// 5. Good prompts = better responses (prompt engineering matters!)
`,
  },
  {
    name: 'lesson-6-ai-router.ts',
    path: 'demo-project/lesson-6-ai-router.ts',
    language: 'typescript',
    content: `// ===========================================
// LESSON 6: Provider Routing and Fallback
// ===========================================
// What happens when your AI provider goes down?
// A router tries multiple providers in order, falling back
// to alternatives if the primary fails.
// This is how production AI systems stay reliable.

// --- Define what a provider looks like ---
interface AIProvider {
  name: string;
  enabled: boolean;
  priority: number;  // Lower number = tried first
}

// --- A simple routing function ---
// This is a simplified version of what the Neon Protocol IDE does.
// See src/lib/llm/provider.ts for the real implementation!

async function routeToProvider(
  providers: AIProvider[],
  question: string
): Promise<string> {

  // Step 1: Filter to only enabled providers
  const available = providers.filter(p => p.enabled);

  if (available.length === 0) {
    throw new Error("No AI providers are enabled!");
  }

  // Step 2: Sort by priority (lowest number first)
  const sorted = available.sort((a, b) => a.priority - b.priority);

  // Step 3: Try each provider in order
  for (const provider of sorted) {
    try {
      console.log("Trying:", provider.name);

      // In the real app, this sends an HTTP request to the provider's API
      const response = await sendToProvider(provider, question);

      console.log("Success:", provider.name);
      return response; // Got a response! Return it.

    } catch (error) {
      // This provider failed. Log the error and try the next one.
      console.log(provider.name, "failed. Trying fallback...");
    }
  }

  // Step 4: All providers failed
  throw new Error("All providers failed. Check your connections.");
}

// --- Simulated provider call ---
// In reality, this is an HTTP fetch() to the provider's API
async function sendToProvider(
  provider: AIProvider,
  question: string
): Promise<string> {
  // Simulate: 80% chance of success
  if (Math.random() > 0.2) {
    return \`[\${provider.name}] Response to: \${question}\`;
  }
  throw new Error(\`\${provider.name} is temporarily unavailable\`);
}

// --- How it works in practice ---
const myProviders: AIProvider[] = [
  { name: "Ollama (local)",  enabled: true,  priority: 1 },  // Try first (free!)
  { name: "Groq (cloud)",    enabled: true,  priority: 2 },  // Fallback #1
  { name: "OpenAI (cloud)",  enabled: false, priority: 3 },  // Disabled (no API key)
];

// The router will:
// 1. Skip OpenAI (disabled)
// 2. Try Ollama first (priority 1)
// 3. If Ollama fails, try Groq (priority 2)
// 4. If all fail, throw an error

// --- Why routing matters ---
// - Reliability: Your copilot keeps working even if one service is down
// - Cost control: Try free/cheap providers first, expensive ones as fallback
// - Flexibility: Add or remove providers without changing any other code
// - This is a real pattern used in production AI systems!

// KEY TAKEAWAYS:
// 1. Routing = choosing which provider to use for each request
// 2. Priority determines the order providers are tried
// 3. Fallback means automatically trying the next option on failure
// 4. This pattern makes AI features reliable and cost-effective
// 5. The Neon Protocol IDE does exactly this in its LLM router
`,
  },
  {
    name: 'lesson-7-orchestrator.ts',
    path: 'demo-project/lesson-7-orchestrator.ts',
    language: 'typescript',
    content: `// ===========================================
// LESSON 7: The Complete AI Pipeline
// ===========================================
// Now let's see how all the pieces fit together.
// This is "orchestration" -- coordinating multiple systems
// to accomplish a task. The Neon Protocol IDE orchestrates:
//   Prompts -> Router -> Providers -> Responses -> UI

// --- The orchestration pipeline ---
// When you ask the copilot a question, here's what happens:

interface PipelineResult {
  answer: string;
  provider: string;
  tokensUsed: number;
}

// Step 1: The copilot BUILDS A PROMPT (Lesson 5)
// It takes your question + the current file's code and
// formats them into messages with roles.

function buildCopilotPrompt(question: string, fileContent: string) {
  return [
    {
      role: 'system' as const,
      content: 'You are a helpful coding assistant. Be concise.',
    },
    {
      role: 'user' as const,
      content: \`I'm working on this code:\\n\${fileContent.slice(0, 2000)}\`,
      // Note: only first 2000 chars to save tokens!
    },
    {
      role: 'user' as const,
      content: question,
    },
  ];
}

// Step 2: The ROUTER picks a provider (Lesson 6)
// It filters enabled providers, sorts by priority,
// and tries each one with fallback on failure.

// Step 3: The provider runs INFERENCE
// The AI model processes your prompt and generates
// a response, consuming tokens in the process.

// Step 4: TOKEN TRACKING records usage (Lesson 5)
// The IDE tracks how many tokens each provider uses
// so you can monitor costs and optimize.

function trackUsage(provider: string, tokens: number) {
  console.log(\`\${provider} used \${tokens} tokens\`);
  // In the real app, this updates the Zustand store
  // and shows up in the AI Settings "Usage" tab
}

// Step 5: The RESPONSE is displayed in the UI
// The copilot panel shows the AI's answer,
// and the user can ask follow-up questions.

// --- Putting it all together ---
async function askCopilot(
  question: string,
  currentFile: string,
): Promise<PipelineResult> {

  // Build the prompt with context
  const messages = buildCopilotPrompt(question, currentFile);

  // Route through providers (simplified)
  const provider = "Ollama";  // In reality: routeChat() picks this
  const answer = "Here's what that code does..."; // In reality: API response
  const tokensUsed = Math.ceil((question.length + currentFile.length) / 4);

  // Track usage
  trackUsage(provider, tokensUsed);

  // Return the result
  return { answer, provider, tokensUsed };
}

// --- The full picture ---
// Open the MAP view to see this visually:
//
//   [User Interface] --question--> [AI Router]
//        ^                            |
//        |                    tries providers in order
//        |                            |
//        |                     [AI Service]
//        |                            |
//        +------- response -----------+
//
// This is AI orchestration: coordinating prompts, routing,
// providers, and responses into a seamless experience.

// --- What you've learned ---
// Lesson 1: Functions - the building blocks of code
// Lesson 2: Components - the building blocks of UI
// Lesson 3: APIs - how systems communicate
// Lesson 4: Databases - how data persists
// Lesson 5: Prompts & Tokens - how AI understands text
// Lesson 6: Routing & Fallback - how to use multiple AI providers
// Lesson 7: Orchestration - how it all connects
//
// Congratulations! You now understand the fundamentals of
// both coding AND AI orchestration. Keep exploring! 🚀

export { askCopilot, buildCopilotPrompt, trackUsage };
`,
  },
  {
    name: 'lesson-8-prompting.ts',
    path: 'demo-project/lesson-8-prompting.ts',
    language: 'typescript',
    content: `// ===========================================
// LESSON 8: Writing Effective Prompts
// ===========================================
// The #1 skill for working with AI is asking good questions.
// A vague prompt gets a vague answer. A specific, structured
// prompt gets a useful, actionable response.
// This lesson teaches you the difference.

// --- Why prompt quality matters ---
// AI models respond to patterns. If your question is fuzzy,
// the AI has to guess what you mean. If your question is
// precise, the AI can give you exactly what you need.
//
// Think of it like asking for directions:
//   Bad:  "How do I get there?"
//   Good: "How do I walk from the train station to the library
//          using the shortest route that avoids construction?"

// --- Bad vs Good prompts ---

// BAD PROMPT: "How do I code?"
// Problem: Too vague. The AI will give a generic overview
// that probably won't help with your specific situation.

// GOOD PROMPT:
// "I have a TypeScript function that takes a user object
//  and returns their full name. How should I handle the
//  case where lastName is undefined?"
//
// Why it works:
// - Context: TypeScript function, user object
// - Specific question: handling undefined lastName
// - Clear goal: defensive coding for edge cases

// --- Even better with constraints ---

// GREAT PROMPT:
// "I have this TypeScript function:
//  function fullName(user: { first: string; last?: string }) { ... }
//  How should I handle when 'last' is undefined?
//  I want to return just the first name in that case,
//  not 'undefined' or an empty string."
//
// Why it's great:
// - Shows the actual code
// - States the desired behavior
// - Rules out wrong answers ("not undefined or empty string")

// --- The prompt structure pattern ---
// Most great prompts follow this structure:
//
// 1. CONTEXT:  What are you working on?
//    "I'm building a React form that submits user data..."
//
// 2. QUESTION: What specifically do you need?
//    "How should I validate the email field before submit?"
//
// 3. CONSTRAINTS: Any requirements or preferences?
//    "I want client-side validation without a library."

interface PromptTemplate {
  context: string;     // What you're working on
  question: string;    // What you need help with
  constraints?: string; // Any preferences or limits
}

function buildEffectivePrompt(template: PromptTemplate): string {
  let prompt = template.context + '\\n\\n' + template.question;
  if (template.constraints) {
    prompt += '\\n\\nConstraints: ' + template.constraints;
  }
  return prompt;
}

// --- Follow-up prompting ---
// The first answer isn't always perfect. That's normal!
// Great AI users iterate with follow-ups:
//
// "Explain that more simply"
//   → When the answer is too technical
//
// "Give me a concrete example"
//   → When the answer is too abstract
//
// "What could go wrong with this approach?"
//   → When you want to stress-test the suggestion
//
// "That doesn't seem right because..."
//   → When you spot an error (AI can be wrong!)
//
// "Can you simplify this? I don't need X or Y"
//   → When the answer is over-engineered

// KEY TAKEAWAYS:
// 1. Specific prompts get specific (useful) answers
// 2. Include context, question, and constraints
// 3. Show actual code when asking about code
// 4. Use follow-ups to refine: "explain simpler", "give example"
// 5. The AI works WITH you — it's a conversation, not a search
`,
  },
  {
    name: 'lesson-9-vibe-coding.ts',
    path: 'demo-project/lesson-9-vibe-coding.ts',
    language: 'typescript',
    content: `// ===========================================
// LESSON 9: Vibe Coding — Iterating with AI
// ===========================================
// Vibe coding is a workflow where you and the AI collaborate.
// You describe your intent in plain language, the AI suggests
// an approach, you evaluate it, refine it, and iterate.
// It's not "AI writes code for me" — it's "AI thinks with me."

// --- What is vibe coding? ---
// Traditional coding: you think, you type, you debug alone.
// Vibe coding: you describe, AI suggests, you evaluate, repeat.
//
// The key difference: you stay in the driver's seat.
// The AI is your copilot — it helps navigate, but YOU decide
// where to go.

// --- The vibe coding loop ---
//
// Step 1: DESCRIBE your intent in plain English
//   "I need a function that filters a list of products
//    to only show ones under $50 that are in stock."
//
// Step 2: REVIEW the AI's suggestion critically
//   - Does it handle edge cases? (empty list, negative prices)
//   - Is it readable? Could a teammate understand it?
//   - Is it the simplest approach that works?
//
// Step 3: ASK FOLLOW-UPS to refine
//   "What if the price is null?"
//   "Can you add TypeScript types?"
//   "Is there a more efficient way?"
//
// Step 4: TEST the result yourself
//   - Run it. Does it actually work?
//   - Try weird inputs. What breaks?
//   - Read through it. Do you understand every line?

// --- Example: Building a feature with vibe coding ---

// You say: "I need to sort a list of tasks by priority,
// with 'high' first, 'medium' second, 'low' last."

// AI suggests something like:
type Priority = 'high' | 'medium' | 'low';
interface Task { id: number; title: string; priority: Priority; }

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  );
}

// --- Now you evaluate ---
// Good: It uses a lookup object for clear priority mapping
// Good: It spreads [...tasks] to avoid mutating the original
// Question: What if two tasks have the same priority?
//
// You ask: "Can you add secondary sorting by title
//           when priorities are equal?"
//
// The AI refines. You review again. This IS vibe coding.

// --- Why not let AI do everything? ---
// Because AI can "hallucinate" — produce code that LOOKS right
// but has subtle bugs. Examples:
//
// - Using a function that doesn't exist in your framework version
// - Missing edge cases (what if the array is empty?)
// - Suggesting patterns that work in Python but not TypeScript
// - Being confidently wrong about how a library works
//
// The code might pass a quick glance but fail in production.
// That's why you always need to:
//
// 1. READ the code — don't just copy-paste
// 2. TEST the code — run it with real and edge-case inputs
// 3. UNDERSTAND the code — could you explain it to someone?
// 4. OWN the code — if it breaks, you need to fix it

// --- Vibe coding best practices ---
//
// DO:
//   ✓ Start with a clear description of what you want
//   ✓ Ask "What could go wrong?" after getting a suggestion
//   ✓ Ask for simpler alternatives if the code is complex
//   ✓ Test everything the AI generates
//   ✓ Use AI to learn — ask "why does this work?"
//
// DON'T:
//   ✗ Copy-paste without reading
//   ✗ Assume the AI is always right
//   ✗ Skip testing because "the AI wrote it"
//   ✗ Use AI-generated code you don't understand
//   ✗ Feel bad about asking "dumb" questions — there are none

// KEY TAKEAWAYS:
// 1. Vibe coding = describe, review, refine, test (repeat)
// 2. You drive the direction; AI helps with implementation
// 3. Always read, test, and understand AI-generated code
// 4. AI is a thinking partner, not a replacement for thinking
// 5. The best developers combine their judgment with AI speed
`,
  },
];
