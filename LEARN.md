# 🎓 Learn: The Neon Protocol IDE (Beginner's Guide)

Welcome to the **Neon Protocol IDE**! This guide is designed for people who are just starting their journey into coding and architectural design.

## 🚀 What is this project?

Most people think coding is just about typing lines of text. But real software development is about **Architecture**—designing how different parts of a system talk to each other.

The Neon Protocol IDE helps you:
1.  **Visualize:** See your app as a map of connected components.
2.  **Architect:** Design the flow of data before you write a single line.
3.  **Code:** Build the logic inside a professional editor that's linked to your map.

---

## 🏗️ How it works (The "Brain" of the App)

The app is built using **React** and **Next.js**. Here is a breakdown of the core parts for learners:

### 1. The "State" (Zustand)
Imagine the IDE has a memory. It needs to remember which file you're looking at and which part of the map you clicked. We use a tool called **Zustand** to manage this memory.
*   **File:** `src/store/useIDEStore.ts`
*   **Concept:** This is a "Central Source of Truth." If the Map changes, the Code Editor knows instantly because they both look at this central memory.

### 2. The "Global Map" (ReactFlow)
We use a library called **ReactFlow** to draw the nodes and connections.
*   **File:** `src/components/blueprint/BlueprintCanvas.tsx`
*   **Concept:** Each "box" on the screen is a **Node**. Each "line" is an **Edge**. This turns your project into a living diagram.

### 3. The "Pro Editor" (Monaco)
We use the **Monaco Editor**—the same engine that powers VS Code!
*   **File:** `src/components/editor/ProCodeEditor.tsx`
*   **Concept:** This is where the magic happens. It handles syntax highlighting (making code colorful) and lets you edit files on your computer.

### 4. The "Agentic" AI (Ollama)
The IDE can talk to AI models running on your own computer.
*   **File:** `src/components/orchestrator/OrchestrationHub.tsx`
*   **Concept:** Instead of just sending your code to a website, the IDE understands your **Architecture**. When you ask for help, it knows you're working on the "Gateway" or the "Database" automatically.

---

## 🛠️ Key Technologies to Learn
If you want to understand how this app was built, here is a "Learning Path" of technologies we used:

1.  **TypeScript:** Like JavaScript, but with "Types" to catch errors early.
2.  **Tailwind CSS:** A fast way to style the app using small, descriptive classes (e.g., `text-neon-cyan`).
3.  **Next.js App Router:** The modern way to structure web applications.
4.  **Electron:** The tool that turns this website into a downloadable desktop app for Windows and Mac.

---

## 💡 Pro Tip for Beginners
Open the `src` folder and look for comments starting with `// 🎓 LEARNER TIP:`. These will explain exactly what the code is doing in plain English.

**Happy Coding! 🚀**
