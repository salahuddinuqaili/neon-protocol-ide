#!/bin/bash

# ==========================================
#   NEON PROTOCOL IDE - Mac Launcher
#   Double-click this file to start the IDE
# ==========================================

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}  NEON PROTOCOL IDE - Launcher${NC}"
echo -e "${CYAN}==========================================${NC}"
echo ""

# Navigate to script directory (handles double-click from Finder)
cd "$(dirname "$0")"

# --- CHECK FOR NODE.JS ---
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed.${NC}"
    echo ""

    if command -v brew &> /dev/null; then
        echo -e "${GREEN}Installing Node.js via Homebrew...${NC}"
        brew install node
    else
        echo -e "${YELLOW}Installing Homebrew first...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

        # Add Homebrew to PATH for Apple Silicon Macs
        if [ -f /opt/homebrew/bin/brew ]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi

        echo -e "${GREEN}Installing Node.js...${NC}"
        brew install node
    fi

    if ! command -v node &> /dev/null; then
        echo ""
        echo -e "${RED}Could not install Node.js automatically.${NC}"
        echo "Please install it from https://nodejs.org/ and run this script again."
        echo ""
        read -p "Press Enter to close..."
        exit 1
    fi
fi

echo -e "${GREEN}Node.js found:${NC} $(node --version)"
echo ""

# --- INSTALL DEPENDENCIES ---
echo "Installing dependencies..."
npm install --legacy-peer-deps --no-audit --no-fund 2>&1 | tail -3

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Retrying...${NC}"
    npm install --legacy-peer-deps 2>&1 | tail -3
    if [ $? -ne 0 ]; then
        echo -e "${RED}npm install failed.${NC}"
        read -p "Press Enter to close..."
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Starting on http://localhost:3001${NC}"
echo -e "${GREEN}  Opening in your browser...${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""

# Open browser after a short delay
(sleep 3 && open "http://localhost:3001") &

# Start the dev server
npm run dev
