#!/bin/bash
# ZenMoney Skill Installation Script for Claude Code (macOS/Linux)
# Installs the skill as a directory with executor.py (no direct MCP connection needed)
# Run with: bash install-skill.sh

set -e

echo "ZenMoney Skill Installer for Claude Code"
echo ""

CLAUDE_SKILLS_DIR="$HOME/.claude/skills"
SKILL_NAME="zenmoney"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_SOURCE_DIR="$SCRIPT_DIR/skill"
TARGET_DIR="$CLAUDE_SKILLS_DIR/$SKILL_NAME"
DIST_PATH="$SCRIPT_DIR/dist/index.js"

# Check if skill directory exists
if [ ! -d "$SKILL_SOURCE_DIR" ]; then
    echo "Error: skill/ directory not found. Run from the project root."
    exit 1
fi

# Check if MCP server is built
if [ ! -f "$DIST_PATH" ]; then
    echo "MCP server not built. Building..."
    cd "$SCRIPT_DIR" && npm install && npm run build
fi

# Check Python mcp package
if ! python3 -c "import mcp" 2>/dev/null; then
    echo "Installing Python mcp package..."
    pip3 install mcp
fi

# Create skills directory
mkdir -p "$CLAUDE_SKILLS_DIR"

# Handle existing installation
if [ -e "$TARGET_DIR" ] || [ -L "$TARGET_DIR" ]; then
    echo "Skill already installed at: $TARGET_DIR"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled"
        exit 0
    fi
    rm -rf "$TARGET_DIR"
fi

# Remove old single-file skill if present
OLD_SKILL="$CLAUDE_SKILLS_DIR/zenmoney.skill.md"
if [ -e "$OLD_SKILL" ] || [ -L "$OLD_SKILL" ]; then
    echo "Removing old single-file skill: $OLD_SKILL"
    rm -f "$OLD_SKILL"
fi

# Create skill directory
mkdir -p "$TARGET_DIR"

# Copy skill files
cp "$SKILL_SOURCE_DIR/SKILL.md" "$TARGET_DIR/"
cp "$SKILL_SOURCE_DIR/executor.py" "$TARGET_DIR/"
cp "$SKILL_SOURCE_DIR/package.json" "$TARGET_DIR/"
chmod +x "$TARGET_DIR/executor.py"

# Create mcp-config.json with absolute path to dist/index.js
cat > "$TARGET_DIR/mcp-config.json" << EOF
{
  "name": "zenmoney",
  "command": "node",
  "args": [
    "$DIST_PATH"
  ],
  "env": {
    "ZENMONEY_TOKEN": "YOUR_TOKEN_HERE"
  }
}
EOF

echo ""
echo "Skill installed at: $TARGET_DIR"
echo ""
echo "Next steps:"
echo "  1. Get your ZenMoney token:"
echo "     Option A: Copy from https://budgera.com/settings/export"
echo "     Option B: Run 'npm run auth' (requires CLIENT_ID/SECRET)"
echo ""
echo "  2. Set your token in: $TARGET_DIR/mcp-config.json"
echo "     Replace YOUR_TOKEN_HERE with your actual token"
echo ""
echo "  3. Restart Claude Code"
echo ""
echo "  4. Try: 'Show my ZenMoney accounts'"
echo ""
echo "Installation complete!"
