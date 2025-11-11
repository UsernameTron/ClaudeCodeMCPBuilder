# MCP Setup Guide & Reference

**Last Updated:** November 11, 2025

---

## Overview: Your Three MCPs

| MCP | Purpose | Status | Build Path | Port/IPC |
|-----|---------|--------|-----------|----------|
| **auto-documenter** | Generate docs from code | Active | `dist/index.js` | Node IPC |
| **openai-gpt-image** | DALL-E image generation & editing | Active | `dist/index.js` | Node IPC |
| **nanobanana-mcp** | Integration server | Active | `dist/index.js` | Node IPC |

---

## Individual MCP Setup

### 1. auto-documenter-v2

**Path:** `/Users/cpconnor/projects/MCP Building/claude-auto-documenter-v2/`

#### Requirements
- Node.js 16+
- Environment: `CLI_PATH` (path to CLI tools)

#### Configuration
```json
{
  "auto-documenter": {
    "command": "node",
    "args": ["/Users/cpconnor/projects/MCP Building/claude-auto-documenter-v2/dist/index.js"],
    "env": {
      "CLI_PATH": "/usr/local/bin:/usr/bin"
    }
  }
}
```

#### Build & Test
```bash
cd "/Users/cpconnor/projects/MCP Building/claude-auto-documenter-v2"
npm run build
node dist/index.js --help
```

#### Features
- Automatic documentation generation
- Multiple format support
- CLI integration

---

### 2. openai-gpt-image-mcp

**Path:** `/Users/cpconnor/projects/MCP Building/openai-gpt-image-mcp/`

#### Requirements
- Node.js 16+
- OpenAI API Key (set as environment variable)

#### Configuration
```json
{
  "openai-gpt-image": {
    "command": "node",
    "args": ["/Users/cpconnor/projects/MCP Building/openai-gpt-image-mcp/dist/index.js"],
    "env": {
      "OPENAI_API_KEY": "${OPENAI_API_KEY}"
    }
  }
}
```

#### Build & Test
```bash
cd "/Users/cpconnor/projects/MCP Building/openai-gpt-image-mcp"
npm run build
node dist/index.js --help
```

#### Capabilities
- Generate images with DALL-E 3
- Edit existing images
- Vary image styles
- Support for high-resolution output

#### Known Limitations
- Requires valid OpenAI API key with DALL-E access
- Rate limited by OpenAI API
- Generated images subject to OpenAI usage policies

---

### 3. nanobanana-mcp

**Path:** `/Users/cpconnor/projects/MCP Building/nanobanana-mcp/`

#### Requirements
- Node.js 16+

#### Configuration
```json
{
  "nanobanana-mcp": {
    "command": "node",
    "args": ["/Users/cpconnor/projects/MCP Building/nanobanana-mcp/dist/index.js"]
  }
}
```

#### Build & Test
```bash
cd "/Users/cpconnor/projects/MCP Building/nanobanana-mcp"
npm run build
node dist/index.js --help
```

#### Features
- [Add specific features once reviewed]

---

## Environment Variables Reference

### Required Environment Variables

```bash
# OpenAI API Key (for openai-gpt-image MCP)
export OPENAI_API_KEY="sk-proj-your-key-here"

# Optional: Custom OpenAI base URL
export OPENAI_BASE_URL="https://api.openai.com/v1"
```

### Where to Set Them

#### Option 1: In Claude Desktop Config (Recommended)
```json
{
  "mcpServers": {
    "openai-gpt-image": {
      "env": {
        "OPENAI_API_KEY": "sk-proj-..."
      }
    }
  }
}
```

#### Option 2: System Environment
```bash
# Add to ~/.zshrc
export OPENAI_API_KEY="sk-proj-..."

# Then reload
source ~/.zshrc
```

#### Option 3: .env File (Per-MCP)
```bash
# In each MCP directory: .env
OPENAI_API_KEY=sk-proj-...
```

---

## Build & Deployment

### Building All MCPs

```bash
#!/bin/bash

MCPs=(
  "claude-auto-documenter-v2"
  "openai-gpt-image-mcp"
  "nanobanana-mcp"
)

BASE="/Users/cpconnor/projects/MCP Building"

for mcp in "${MCPs[@]}"; do
  echo "Building $mcp..."
  cd "$BASE/$mcp"
  npm run build || echo "❌ Build failed for $mcp"
done

echo "✅ All builds complete"
```

### Verification Checklist

After building, verify each MCP:

```bash
#!/bin/bash

MCPs=(
  "claude-auto-documenter-v2"
  "openai-gpt-image-mcp"
  "nanobanana-mcp"
)

BASE="/Users/cpconnor/projects/MCP Building"

for mcp in "${MCPs[@]}"; do
  path="$BASE/$mcp/dist/index.js"
  if [ -f "$path" ]; then
    echo "✅ $mcp: dist/index.js exists"
    # Try to run with --help
    if node "$path" --help > /dev/null 2>&1; then
      echo "   ✅ Executable"
    else
      echo "   ⚠️  May have issues - check build"
    fi
  else
    echo "❌ $mcp: dist/index.js NOT FOUND"
  fi
done
```

---

## Troubleshooting

### MCP Not Appearing in Claude

**Symptoms:** MCP configured but not available in Claude Desktop

**Diagnosis:**
```bash
# Check if dist/index.js exists
ls -la "/Users/cpconnor/projects/MCP Building/[mcp-name]/dist/index.js"

# Check if file has execution permissions
file "/Users/cpconnor/projects/MCP Building/[mcp-name]/dist/index.js"

# Try running it directly
node "/Users/cpconnor/projects/MCP Building/[mcp-name]/dist/index.js" --help
```

**Solutions:**
1. Ensure `npm run build` completed successfully
2. Check that paths in config match actual file locations
3. Restart Claude Desktop after config changes
4. Check Claude Desktop logs: `~/.claude/logs/`

### API Key Errors

**Symptoms:** "Invalid API key" or "Unauthorized" when using openai-gpt-image

**Diagnosis:**
```bash
# Verify API key is set
echo $OPENAI_API_KEY

# Test API key directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Solutions:**
1. Verify API key is valid and has DALL-E access
2. Check key is not expired/rotated
3. Confirm key is set in Claude config or environment
4. Test key permissions at openai.com/account/api-keys

### Module Not Found Errors

**Symptoms:** "Cannot find module" or "MODULE_NOT_FOUND"

**Diagnosis:**
```bash
cd "/Users/cpconnor/projects/MCP Building/[mcp-name]"
npm ls
npm list --all 2>&1 | head -20
```

**Solutions:**
1. Run `npm install` in the MCP directory
2. Delete node_modules and package-lock.json, then reinstall
3. Check that TypeScript compilation worked: `ls dist/`
4. Verify tsconfig.json is correct

---

## Maintenance Tasks

### Weekly Checklist
- [ ] Verify all MCPs are responding
- [ ] Check API usage (OpenAI dashboard)
- [ ] Review error logs in ~/.claude/logs/
- [ ] Backup config: `cp ~/.claude/claude_desktop_config.json ~/.claude/backups/`

### Monthly Checklist
- [ ] Review and rotate API keys if needed
- [ ] Update MCP dependencies: `npm update`
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Archive old log files

### When Adding New Features
1. Make changes in src/
2. Run `npm run build` to generate dist/
3. Test MCP locally
4. Restart Claude Desktop
5. Test in Claude
6. Commit to version control

---

## Version Control

All MCPs should be version controlled:

```bash
cd "/Users/cpconnor/projects/MCP Building/[mcp-name]"
git status
git log --oneline | head -10
```

Recommended commits before major changes:
```bash
git commit -m "Before security hardening - backup"
```

---

## Performance Monitoring

### Check MCP Resource Usage

```bash
# Monitor running processes
ps aux | grep node | grep -v grep

# Check memory/CPU for MCPs
lsof -p [PID]
```

### Optimization Tips
- Close MCPs not currently in use
- Monitor API costs if using paid services
- Clear caches periodically
- Review error logs for inefficiencies

---

## Security Best Practices

### API Key Management
- ✅ Use environment variables, NOT hardcoded in config
- ✅ Rotate keys quarterly or after exposure
- ✅ Use separate keys for different environments (dev/prod)
- ✅ Audit API usage regularly
- ❌ Never commit API keys to version control

### Filesystem Access
- ✅ Restrict MCPs to necessary directories only
- ✅ Use allowedDirectories in config
- ✅ Review permissions regularly
- ❌ Don't grant home directory access unless required

### Monitoring
- ✅ Check error logs after updates
- ✅ Monitor API costs
- ✅ Review resource usage
- ❌ Ignore warnings in logs

---

## Quick Commands Reference

```bash
# Build single MCP
cd "/Users/cpconnor/projects/MCP Building/openai-gpt-image-mcp" && npm run build

# Test MCP
node "/Users/cpconnor/projects/MCP Building/openai-gpt-image-mcp/dist/index.js" --help

# View config
cat ~/.claude/claude_desktop_config.json | jq '.mcpServers'

# Restart Claude (from CLI)
killall "Claude Desktop" || true
open "/Applications/Claude.app"

# Check for issues
grep -r "error" ~/.claude/logs/ | tail -20

# Backup config
cp ~/.claude/claude_desktop_config.json ~/.claude/backups/claude_desktop_config.backup.$(date +%s).json
```

---

## Support Resources

- **OpenAI API Docs:** https://platform.openai.com/docs
- **Node.js Docs:** https://nodejs.org/docs
- **MCP Specification:** [Check repository README]
- **Claude Help:** https://support.anthropic.com

---

**Keep this guide updated as your MCPs evolve and new features are added.**
