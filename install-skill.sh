#!/bin/bash
# ZenMoney Skill Installation Script for Claude Code (macOS/Linux)
# Run with: bash install-skill.sh

set -e

echo "🚀 ZenMoney Skill Installer for Claude Code"
echo ""

# Determine Claude skills directory
CLAUDE_SKILLS_DIR="$HOME/.claude/skills"
SKILL_FILE="zenmoney.skill.md"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_PATH="$SCRIPT_DIR/$SKILL_FILE"
TARGET_PATH="$CLAUDE_SKILLS_DIR/$SKILL_FILE"

# Check if skill file exists
if [ ! -f "$SKILL_PATH" ]; then
    echo "❌ Error: $SKILL_FILE not found in current directory"
    exit 1
fi

# Create skills directory if it doesn't exist
if [ ! -d "$CLAUDE_SKILLS_DIR" ]; then
    echo "📁 Creating Claude skills directory: $CLAUDE_SKILLS_DIR"
    mkdir -p "$CLAUDE_SKILLS_DIR"
fi

# Check if skill already installed
if [ -e "$TARGET_PATH" ]; then
    echo "⚠️  Skill already installed at: $TARGET_PATH"
    read -p "Do you want to overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Installation cancelled"
        exit 0
    fi
    rm -f "$TARGET_PATH"
fi

# Create symbolic link
echo "🔗 Creating symbolic link..."
ln -s "$SKILL_PATH" "$TARGET_PATH"

echo "✅ Symbolic link created successfully!"
echo "   Target: $TARGET_PATH"
echo "   Source: $SKILL_PATH"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure MCP server is built: npm run build"
echo "   2. Authorize with ZenMoney: npm run auth"
echo "   3. Restart Claude Code"
echo "   4. Try: 'Покажи мои счета в ZenMoney'"
echo ""
echo "🎉 Installation complete!"