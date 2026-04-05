import { Challenge } from '../types';

export const CHALLENGES: Challenge[] = [
  // --- Linked to lesson: 'what-is-a-function' ---
  {
    id: 'challenge-function-basics',
    lessonId: 'what-is-a-function',
    title: 'Write Your First Function',
    description: 'Create a function called "double" that takes a number and returns it multiplied by 2.',
    type: 'free-code',
    difficulty: 1,
    starterCode: '// Write your function below\n',
    language: 'typescript',
    hints: [
      'A function starts with the "function" keyword',
      'Use "return" to send a value back',
      'Multiply with the * operator',
    ],
    validation: {
      requiredSubstrings: ['function', 'return'],
      testFn: `
        try {
          const fn = new Function(code + '\\nreturn double(5);');
          const result = fn();
          if (result === 10) return { pass: true, message: 'Your function works!' };
          return { pass: false, message: 'double(5) should return 10, but got ' + result };
        } catch (e) {
          return { pass: false, message: 'Error: ' + e.message };
        }
      `,
    },
  },
  {
    id: 'challenge-predict-map',
    lessonId: 'what-is-a-function',
    title: 'Predict the Output',
    description: 'What does this code return?\n```\n[1, 2, 3].map(x => x + 10)\n```',
    type: 'predict-output',
    difficulty: 1,
    starterCode: '',
    language: 'typescript',
    hints: ['.map() runs the function on every item in the array'],
    validation: {
      choices: ['[10, 20, 30]', '[11, 12, 13]', '[1, 2, 3, 10]', 'Error'],
      correctChoice: 1,
    },
  },

  // --- Linked to lesson: 'components-and-reuse' ---
  {
    id: 'challenge-fix-component',
    lessonId: 'components-and-reuse',
    title: 'Fix the Broken Component',
    description: 'This React component has a bug — it tries to use a prop that was never destructured. Fix it so the greeting displays correctly.',
    type: 'fix-the-bug',
    difficulty: 2,
    starterCode: `function Greeting(props) {
  return <h1>Hello, {name}!</h1>;
}`,
    language: 'typescript',
    hints: [
      'Look at the function parameter — what is it called?',
      'The variable "name" is not defined anywhere',
      'You need to access name from the props object: props.name',
    ],
    validation: {
      requiredSubstrings: ['props.name'],
      forbiddenSubstrings: ['{name}!'],
    },
  },

  // --- Linked to lesson: 'how-data-flows' ---
  {
    id: 'challenge-fill-data-flow',
    lessonId: 'how-data-flows',
    title: 'Complete the Data Pipeline',
    description: 'Fill in the blanks to create a simple data transformation pipeline that filters even numbers and doubles them.',
    type: 'fill-in-the-blank',
    difficulty: 2,
    starterCode: `const numbers = [1, 2, 3, 4, 5, 6];

// Step 1: Filter to keep only even numbers
const evens = numbers.___(n => n % 2 === 0);

// Step 2: Double each even number
const doubled = evens.___(n => n * 2);

// Result should be [4, 8, 12]`,
    language: 'typescript',
    hints: [
      'To keep items that match a condition, use .filter()',
      'To transform each item, use .map()',
    ],
    validation: {
      requiredSubstrings: ['filter', 'map'],
      testFn: `
        try {
          const fn = new Function(code + '\\nreturn JSON.stringify(doubled);');
          const result = fn();
          if (result === '[4,8,12]') return { pass: true, message: 'The pipeline works!' };
          return { pass: false, message: 'Expected [4, 8, 12] but got ' + result };
        } catch (e) {
          return { pass: false, message: 'Error: ' + e.message };
        }
      `,
    },
  },
  {
    id: 'challenge-predict-data-flow',
    lessonId: 'how-data-flows',
    title: 'Trace the Data',
    description: 'What is the value of `result` after this code runs?\n```\nconst items = ["apple", "banana", "cherry"];\nconst result = items.filter(i => i.length > 5).length;\n```',
    type: 'predict-output',
    difficulty: 1,
    starterCode: '',
    language: 'typescript',
    hints: [
      '.filter() keeps items that match the condition',
      'Only "banana" (6) and "cherry" (6) have length > 5',
      '.length on an array returns how many items it has',
    ],
    validation: {
      choices: ['3', '2', '1', '0'],
      correctChoice: 1,
    },
  },
];
