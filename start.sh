#!/bin/bash

# --- COLOR DEFINITIONS FOR BETTER READABILITY ---
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}--- NEON PROTOCOL IDE: BEGINNER-FRIENDLY SETUP (macOS) ---${NC}"

# --- CHECK FOR NODE.JS ---
echo -e "${YELLOW}Checking for Node.js (the 'engine' that runs the IDE)...${NC}"
if ! command -v node &> /dev/null
then
    echo -e "${RED}Node.js is NOT installed!${NC}"
    echo -e "${CYAN}Don't worry, I'll try to install it for you. This might ask for your password.${NC}"
    
    if command -v brew &> /dev/null
    then
        echo -e "${GREEN}Homebrew found. Installing Node.js via Homebrew...${NC}"
        brew install node
    else
        echo -e "${YELLOW}Homebrew not found. Downloading the official Node.js installer...${NC}"
        curl -L https://nodejs.org/dist/v20.11.1/node-v20.11.1.pkg -o node-v20.11.1.pkg
        echo -e "${CYAN}Running installer. Please follow the on-screen prompts if any.${NC}"
        sudo installer -pkg node-v20.11.1.pkg -target /
        rm node-v20.11.1.pkg
    fi
    
    if ! command -v node &> /dev/null
    then
        echo -e "${RED}Automatic installation failed.${NC}"
        echo -e "Please visit https://nodejs.org/ and download the 'LTS' version manually."
        exit 1
    fi
fi

# --- INSTALL DEPENDENCIES ---
echo -e "${GREEN}Node.js found! Installing the project dependencies...${NC}"
echo -e "${CYAN}This is like gathering all the tools needed to build the IDE.${NC}"
# Use npm.cmd on Windows via WSL, but for native Mac it's just npm
npm install --legacy-peer-deps --no-audit --no-fund

if [ $? -ne 0 ]; then
    echo -e "${RED}An error occurred while installing tools. Try running 'npm install' manually.${NC}"
    exit 1
fi

# --- START THE APP ---
echo -e "${GREEN}Everything is ready!${NC}"
echo -e "${CYAN}Starting the Neon Protocol IDE on port 3001...${NC}"
echo -e "${YELLOW}Once it starts, open your browser to: http://localhost:3001${NC}"
echo -e "${YELLOW}If you want the desktop window, run 'npm run electron-dev' in a new terminal tab.${NC}"

npm run dev
