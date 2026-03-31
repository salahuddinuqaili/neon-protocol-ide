"use client";

import React from 'react';
import { useIDEStore } from '../../store/useIDEStore';

const DEMO_FILES = [
  {
    name: 'Dashboard.tsx',
    path: 'demo-project/components/Dashboard.tsx',
    language: 'typescript',
    content: `// Main dashboard component
import React from 'react';

export function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Welcome to the App</h1>
      <UserList />
      <ActivityFeed />
    </div>
  );
}`,
  },
  {
    name: 'UserList.tsx',
    path: 'demo-project/components/UserList.tsx',
    language: 'typescript',
    content: `// Displays a list of users from the API
import React, { useEffect, useState } from 'react';

export function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);

  return (
    <ul>
      {users.map((u: any) => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}`,
  },
  {
    name: 'users.ts',
    path: 'demo-project/api/users.ts',
    language: 'typescript',
    content: `// API endpoint for user management
import { db } from '../store/database';

export async function getUsers() {
  return db.query('SELECT * FROM users');
}

export async function createUser(name: string, email: string) {
  return db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
}`,
  },
  {
    name: 'health.ts',
    path: 'demo-project/api/health.ts',
    language: 'typescript',
    content: `// Health check endpoint
export async function healthCheck() {
  return { status: 'ok', uptime: process.uptime() };
}`,
  },
  {
    name: 'database.ts',
    path: 'demo-project/store/database.ts',
    language: 'typescript',
    content: `// Database connection and query layer
export const db = {
  async query(sql: string, params?: any[]) {
    console.log('Executing:', sql, params);
    return [];
  },
  async close() {
    console.log('Connection closed');
  }
};`,
  },
  {
    name: 'app.ts',
    path: 'demo-project/app.ts',
    language: 'typescript',
    content: `// Application entry point
// Open the Blueprint view to see how these modules connect!

import { getUsers } from './api/users';
import { healthCheck } from './api/health';

async function main() {
  console.log(await healthCheck());
  console.log(await getUsers());
}

main();`,
  },
];

const WelcomeScreen: React.FC = () => {
  const { setOnboardingComplete, setProject, setView, recentProjects } = useIDEStore();

  const handleTryDemo = () => {
    setProject('demo-project', DEMO_FILES);
    setOnboardingComplete();
    setView('blueprint');
  };

  const handleSkip = () => {
    setOnboardingComplete();
  };

  return (
    <div className="absolute inset-0 z-[100] bg-background flex items-center justify-center">
      <div className="max-w-2xl w-full px-8">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="material-symbols-outlined text-4xl text-primary">architecture</span>
            <h1 className="text-3xl font-display font-bold text-text-main tracking-wide uppercase">
              Neon Protocol IDE
            </h1>
          </div>
          <p className="text-sm text-muted font-mono">
            See how your app is built, then change it — with AI to help you.
          </p>
        </div>

        {/* Feature Cards — beginner-friendly language */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-surface border border-muted/30 p-5 hover:border-primary hover:shadow-neon transition-all">
            <span className="material-symbols-outlined text-2xl text-primary mb-3 block">map</span>
            <h3 className="text-sm font-bold text-text-main mb-2 uppercase tracking-wide">Visual Map</h3>
            <p className="text-[11px] text-muted leading-relaxed">
              See your project as a visual diagram. Click any box to learn what it does and how it connects to other parts.
            </p>
          </div>
          <div className="bg-surface border border-muted/30 p-5 hover:border-primary hover:shadow-neon transition-all">
            <span className="material-symbols-outlined text-2xl text-primary mb-3 block">code</span>
            <h3 className="text-sm font-bold text-text-main mb-2 uppercase tracking-wide">Code Editor</h3>
            <p className="text-[11px] text-muted leading-relaxed">
              Read and edit the actual code files. Changes are highlighted so you always know what you've modified.
            </p>
          </div>
          <div className="bg-surface border border-muted/30 p-5 hover:border-primary hover:shadow-neon transition-all">
            <span className="material-symbols-outlined text-2xl text-accent-ai mb-3 block">smart_toy</span>
            <h3 className="text-sm font-bold text-text-main mb-2 uppercase tracking-wide">AI Assistant</h3>
            <p className="text-[11px] text-muted leading-relaxed">
              Ask questions about your code in plain English. The AI explains what things do and helps you make changes.
            </p>
          </div>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[10px] text-muted uppercase tracking-widest font-bold text-center mb-3">Recent Projects</h3>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {recentProjects.map(name => (
                <button
                  key={name}
                  onClick={handleSkip}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-muted/30 text-text-main text-xs font-mono hover:border-primary hover:shadow-neon transition-all"
                >
                  <span className="material-symbols-outlined text-sm text-primary">folder</span>
                  <span>{name}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-[9px] text-muted/50 mt-2 font-mono">Re-open from the sidebar file explorer</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleTryDemo}
            className="px-8 py-3 bg-primary text-background font-bold text-xs uppercase tracking-widest shadow-neon hover:bg-[#0cf1f1] transition-all"
          >
            Explore a Demo Project
          </button>
          <button
            onClick={handleSkip}
            className="px-6 py-2 text-muted text-xs font-mono hover:text-text-main transition-colors"
          >
            Skip — I'll open my own project
          </button>
        </div>

        <p className="text-center text-[10px] text-muted/30 mt-8 font-mono">
          Works best in Chrome or Edge
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
