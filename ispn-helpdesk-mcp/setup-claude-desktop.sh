#!/bin/bash

# ISPN Helpdesk MCP - Claude Desktop Setup Script
# This script configures Claude Desktop to use the ISPN Helpdesk MCP

set -e

echo "🚀 ISPN Helpdesk MCP - Claude Desktop Setup"
echo "==========================================="
echo ""

# Detect OS and set config path
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_DIR="$HOME/Library/Application Support/Claude"
    CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
    echo "📍 Detected: macOS"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    CONFIG_DIR="$APPDATA/Claude"
    CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
    echo "📍 Detected: Windows"
else
    CONFIG_DIR="$HOME/.config/Claude"
    CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
    echo "📍 Detected: Linux"
fi

echo "📁 Config file location: $CONFIG_FILE"
echo ""

# Create config directory if it doesn't exist
if [ ! -d "$CONFIG_DIR" ]; then
    echo "📂 Creating config directory..."
    mkdir -p "$CONFIG_DIR"
fi

# Get absolute path to this script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MCP_SERVER_PATH="$SCRIPT_DIR/dist/mcp-server.js"

echo "🔍 Checking MCP server build..."
if [ ! -f "$MCP_SERVER_PATH" ]; then
    echo "❌ Error: MCP server not built yet!"
    echo "   Run: npm run build"
    exit 1
fi
echo "✅ MCP server found: $MCP_SERVER_PATH"
echo ""

# Backup existing config if it exists
if [ -f "$CONFIG_FILE" ]; then
    BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Backing up existing config to:"
    echo "   $BACKUP_FILE"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    
    # Check if config already has ispn-helpdesk
    if grep -q '"ispn-helpdesk"' "$CONFIG_FILE"; then
        echo ""
        echo "⚠️  WARNING: Config already contains 'ispn-helpdesk' server!"
        echo "   Backup created. You may want to merge manually."
        echo ""
        read -p "Continue and overwrite? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Setup cancelled"
            exit 1
        fi
    fi
fi

# Create new config with ISPN MCP
echo "📝 Writing Claude Desktop config..."
cat > "$CONFIG_FILE" << CONFIGEOF
{
  "mcpServers": {
    "ispn-helpdesk": {
      "command": "node",
      "args": [
        "$MCP_SERVER_PATH"
      ],
      "env": {
        "ISPN_API_URL": "https://api.helpdesk.ispn.net/exec.pl",
        "ISPN_AUTH_CODE": "697cecca59efe086653ae1c4194497f43d231f01",
        "LOG_LEVEL": "info"
      }
    }
  }
}
CONFIGEOF

echo "✅ Configuration written successfully!"
echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. ⚠️  Restart Claude Desktop (quit completely and reopen)"
echo "2. 🧪 Test with: 'What ticket categories are available in ISPN?'"
echo "3. 📊 Try: 'Look up customer with billing ID 999'"
echo ""
echo "📚 For more help, see QUICK_START.md"
echo ""
