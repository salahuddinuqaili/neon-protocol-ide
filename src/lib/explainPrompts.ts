export type ExplainMode = 'explain' | 'line' | 'simplify' | 'ask';

export function buildExplainPrompt(
  code: string,
  mode: ExplainMode,
  fileName: string,
  language: string
): string {
  const fileContext = `The user is working in "${fileName}" (${language}).`;

  switch (mode) {
    case 'explain':
      return `${fileContext}\n\nExplain this code to someone who is new to programming. Use simple language, a real-world analogy, and break it down line by line:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    case 'line':
      return `${fileContext}\n\nExplain what this single line of code does and why it matters. Keep it to 2-3 sentences, use simple language:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    case 'simplify':
      return `${fileContext}\n\nRewrite this code to be simpler and easier to understand. Show the simplified version, then explain what you changed and why:\n\n\`\`\`${language}\n${code}\n\`\`\``;

    case 'ask':
      return `${fileContext}\n\nThe user selected this code and wants to ask about it:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nWhat would you like to know about this code?`;
  }
}
