# Neon Protocol IDE

A visionary, agentic integrated development environment (IDE) that bridges the gap between high-level architectural design and low-level code implementation.

![Cybernetic Blueprint Theme](design_reference/design/global_architecture_map/screen.png)

## Core Philosophy: "Blueprint-First Development"

The Neon Protocol IDE is built on the premise that complex software should be understood visually and architecturally before diving into syntax. It provides three primary lenses:

1.  **Global Architecture Map:** A dynamic ReactFlow canvas to visualize system-wide nodes, services, and data flows.
2.  **Pro Code Editor:** A Monaco-powered editor for professional-grade development, linked directly to the visual map.
3.  **LLM Orchestration Hub:** A central hub for managing AI routing between local (Ollama) and cloud (OpenAI/Anthropic) models.

## Tech Stack

- **Frontend:** Next.js 14+, React, Tailwind CSS
- **Visuals:** ReactFlow
- **Editor:** Monaco Editor
- **AI Layer:** Ollama (Local), Vercel AI SDK
- **Desktop:** Electron.js

## Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- npm or yarn
- [Ollama](https://ollama.ai/) (for local AI features)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/neon-protocol-ide.git
   cd neon-protocol-ide
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Repository Structure

```text
/src
  /components
    /blueprint      <-- ReactFlow nodes/edges
    /editor         <-- Monaco Editor instance
    /copilot        <-- Chat bubbles & AI logic
    /orchestrator   <-- LLM routing UI
  /store            <-- Global IDE state (Zustand)
  /hooks            <-- useAI, useFileSystem hooks
  /app              <-- Next.js App Router
/public             <-- Static assets & icons
/data               <-- Local architecture schemas
```

## Contributing

We welcome contributions to the Neon Protocol! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
