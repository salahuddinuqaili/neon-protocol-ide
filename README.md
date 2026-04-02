# Neon Protocol IDE

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.1.8-green.svg)](package.json)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-brightgreen.svg)](https://nodejs.org/)

An agentic integrated development environment (IDE) that bridges the gap between high-level architectural design and low-level code implementation.

![Cybernetic Blueprint Theme](design_reference/design/global_architecture_map/screen.png)

## Core Philosophy: "Blueprint-First Development"

The Neon Protocol IDE is built on the premise that complex software should be understood visually and architecturally before diving into syntax. It provides several primary lenses:

1.  **Global Architecture Map:** A dynamic ReactFlow canvas to visualize system-wide nodes, services, and data flows.
2.  **Pro Code Editor:** A Monaco-powered editor for professional-grade development, linked directly to the visual map.
3.  **LLM Orchestration Hub:** A central hub for managing AI routing between local (Ollama) and cloud (OpenAI/Anthropic) models.
4.  **Local Project Explorer:** Direct local file system integration via the **File System Access API**, allowing you to open, edit, and save files on your disk.
5.  **Dynamic Architecture Discovery:** Automatically scan and categorize your codebase into high-level architectural nodes on the visual map.

## Key Features

-   **Visual Mapping (ReactFlow):** Drag, drop, and connect architectural nodes (services, databases, APIs) dynamically.
-   **Pro Code Engine (Monaco):** Full-featured editor with IntelliSense, syntax highlighting, and multi-file tab management.
-   **Multi-Provider AI Routing:** Manage and route prompts between local (**Ollama**) and cloud (**OpenAI/Anthropic**) models.
-   **Local File System Access:** Direct integration via the **File System Access API**, allowing you to work on your local files securely.
-   **Dynamic Architecture Discovery:** Automatically scan and categorize your codebase into high-level architectural nodes.
-   **Cross-Platform Desktop App:** Available as a standalone application for Windows, macOS, and Linux via Electron.

## Tech Stack

- **Frontend:** Next.js 14+, React, Tailwind CSS
- **Visuals:** ReactFlow
- **Editor:** Monaco Editor
- **AI Layer:** Ollama (Local), Vercel AI SDK
- **Desktop:** Electron.js

## Getting Started (One-Click Setup)

The Neon Protocol IDE includes a automated setup script that will check for Node.js, install it if missing, and set up all dependencies for you.

### Windows
1. Download or clone this repository.
2. Double-click the **`start.bat`** file in the root directory.
3. Follow any on-screen prompts.

### macOS
1. Download or clone this repository.
2. Open a terminal in the folder and run:
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

## Development Setup (Manual)

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

## Building the Desktop App

To package the Neon Protocol IDE as a standalone desktop application:

1.  **Build for current OS:**
    ```bash
    npm run electron-build
    ```
2.  **Platform-specific builds:**
    ```bash
    npm run electron-build:win   # Windows
    npm run electron-build:mac   # macOS
    npm run electron-build:all   # Windows & macOS
    ```

## Roadmap

We are continuously evolving! Key milestones on our roadmap include:

-   [ ] **Real-time Architectural Linting:** Flag inconsistencies between code and the architectural blueprint.
-   [ ] **Contextual AI Copilot:** Enhance the copilot to ingest the entire architectural schema for design-aware suggestions.
-   [ ] **Plugin Architecture:** Enable community-contributed node types, themes, and LLM connectors.
-   [ ] **Automated GitHub Actions:** CI/CD pipelines for automated testing and binary distribution.

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

## Credits

This app was created using:
- **Google Stitch**
- **Junie**
- **Claude Code**
