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
  // --- Connection errors ---
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
    pattern: /ENOTFOUND/i,
    title: 'Server Not Found',
    explanation: 'The address you\'re trying to reach doesn\'t exist. It\'s like trying to call a phone number that isn\'t in service.',
    commonCauses: [
      'The URL has a typo (e.g. "localhos" instead of "localhost")',
      'Your internet connection is down',
      'DNS is not resolving the hostname',
    ],
    suggestedFix: 'Double-check the URL in your AI Settings. Make sure you\'re connected to the internet.',
    severity: 'error',
  },

  // --- Auth errors ---
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
    pattern: /403|Forbidden/i,
    title: 'Access Denied',
    explanation: 'Your API key is valid, but it doesn\'t have permission to do what you asked. This is like having a building key that only opens certain doors.',
    commonCauses: [
      'Your API plan doesn\'t include this model',
      'The API key has restricted permissions',
      'Your account needs billing set up',
    ],
    suggestedFix: 'Check your API provider\'s dashboard to verify your plan and permissions.',
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

  // --- JavaScript/TypeScript runtime errors ---
  {
    pattern: /TypeError: Cannot read propert(y|ies).*of (undefined|null)/i,
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
    pattern: /TypeError: .+ is not a function/i,
    title: 'Not a Function',
    explanation: 'The code tried to call something as a function, but it isn\'t one. It\'s like trying to drive a bicycle — it\'s not a car, so you can\'t "drive" it.',
    commonCauses: [
      'Typo in the function name',
      'Calling a property that\'s a value, not a function',
      'The variable was overwritten with a non-function value',
    ],
    relatedGlossaryTerms: ['function'],
    severity: 'error',
  },
  {
    pattern: /RangeError/i,
    title: 'Value Out of Range',
    explanation: 'A number or value is outside the allowed range. This is like trying to set your oven to 10,000 degrees — the value is technically a number, but it\'s not valid.',
    commonCauses: [
      'Infinite recursion (a function calling itself forever)',
      'Array index is negative or too large',
      'Invalid argument to a built-in method',
    ],
    severity: 'error',
  },

  // --- Build / module errors ---
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
  {
    pattern: /export .+ was not found/i,
    title: 'Missing Export',
    explanation: 'The code is trying to import something that the other file doesn\'t export. It\'s like asking a store for a product they don\'t sell.',
    commonCauses: [
      'The export name was misspelled',
      'The export was renamed or removed in the source file',
      'Using a default import when a named import is needed (or vice versa)',
    ],
    severity: 'error',
  },

  // --- TypeScript errors ---
  {
    pattern: /TS\d+:/,
    title: 'TypeScript Compilation Error',
    explanation: 'TypeScript found a type problem in the code. TypeScript checks your code before it runs to catch mistakes early — like a spell-checker for code.',
    commonCauses: [
      'Wrong type assigned to a variable (e.g. string where number expected)',
      'Missing required property on an object',
      'Function called with wrong number of arguments',
    ],
    relatedLessonId: 'reading-typescript',
    relatedGlossaryTerms: ['typescript'],
    severity: 'error',
  },

  // --- Git errors ---
  {
    pattern: /fatal: not a git repository/i,
    title: 'Not a Git Repository',
    explanation: 'This folder isn\'t set up for version control yet. Git needs to be initialized before you can use features like commits and branches.',
    commonCauses: [
      'The project was created without "git init"',
      'You opened a parent folder instead of the project folder',
    ],
    suggestedFix: 'Run "git init" in the terminal to start tracking this project with Git.',
    relatedGlossaryTerms: ['git', 'repository'],
    severity: 'warning',
  },
  {
    pattern: /CONFLICT|merge conflict/i,
    title: 'Merge Conflict',
    explanation: 'Two people (or two branches) changed the same part of a file differently. Git doesn\'t know which version to keep, so it asks you to decide.',
    commonCauses: [
      'You and a teammate edited the same lines',
      'Merging a branch that diverged from yours',
    ],
    suggestedFix: 'Open the conflicting file, look for <<<< and >>>> markers, and choose which version to keep.',
    relatedGlossaryTerms: ['git', 'branch'],
    severity: 'warning',
  },

  // --- Network / fetch errors ---
  {
    pattern: /Failed to fetch|NetworkError|ERR_NETWORK/i,
    title: 'Network Error',
    explanation: 'The request couldn\'t reach the server at all. This is different from a server error — the problem is between your computer and the server.',
    commonCauses: [
      'No internet connection',
      'The server is completely down',
      'A proxy or VPN is blocking the request',
    ],
    severity: 'error',
  },
  {
    pattern: /CORS|Access-Control-Allow-Origin/i,
    title: 'Cross-Origin Request Blocked',
    explanation: 'The browser blocked a request to a different website for security. Browsers prevent websites from secretly talking to other servers without permission.',
    commonCauses: [
      'The API server doesn\'t allow requests from your app\'s URL',
      'Missing CORS headers on the server',
      'Using http:// when the server requires https://',
    ],
    severity: 'error',
  },

  // --- Process errors ---
  {
    pattern: /EACCES|permission denied/i,
    title: 'Permission Denied',
    explanation: 'The system blocked the operation because your user account doesn\'t have the right permissions. It\'s like trying to enter a room with a locked door.',
    commonCauses: [
      'Trying to write to a read-only file or folder',
      'Need administrator privileges for this action',
      'The file is locked by another program',
    ],
    severity: 'error',
  },
  {
    pattern: /ENOENT|no such file or directory/i,
    title: 'File or Folder Not Found',
    explanation: 'The code is trying to access a file or folder that doesn\'t exist at the specified location.',
    commonCauses: [
      'The file path has a typo',
      'The file was moved or deleted',
      'A relative path is being used from the wrong directory',
    ],
    severity: 'error',
  },
  {
    pattern: /EADDRINUSE/i,
    title: 'Port Already in Use',
    explanation: 'Another program is already using the network port this app needs. It\'s like two restaurants trying to open at the same address.',
    commonCauses: [
      'A previous instance of the app is still running',
      'Another development server is using the same port',
    ],
    suggestedFix: 'Stop the other process using the port, or change the port number in your config.',
    severity: 'error',
  },

  // --- NPM errors ---
  {
    pattern: /npm ERR!|npm warn/i,
    title: 'NPM Package Manager Error',
    explanation: 'The package manager (npm) ran into a problem while installing or managing your project\'s dependencies.',
    commonCauses: [
      'Conflicting package versions',
      'Corrupted node_modules folder',
      'Network issue while downloading packages',
    ],
    suggestedFix: 'Try deleting node_modules and running "npm install" again.',
    severity: 'error',
  },

  // --- Out of memory ---
  {
    pattern: /heap out of memory|ENOMEM|JavaScript heap/i,
    title: 'Out of Memory',
    explanation: 'The program used more memory than allowed. This can happen with very large files or infinite loops that keep creating data.',
    commonCauses: [
      'Processing a very large file',
      'An infinite loop is creating objects endlessly',
      'Too many packages or a memory leak',
    ],
    suggestedFix: 'Check for infinite loops, or increase the memory limit with: node --max-old-space-size=4096',
    severity: 'error',
  },
];
