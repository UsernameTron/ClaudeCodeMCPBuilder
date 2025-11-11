# Claude Configuration Security Hardening Guide

**Created:** November 11, 2025  
**Priority:** 🔴 CRITICAL - Execute immediately

---

## Executive Summary

Your Claude configuration contains critical security vulnerabilities:
- **API Keys exposed in plain text** (11 locations including 10 backup files)
- **Overly broad filesystem access** to entire home directory
- **Inconsistent MCP path management** mixing src/ and dist/
- **Uncontrolled backup accumulation** (10+ old backup files)

This guide provides step-by-step remediation with minimal disruption.

---

## Phase 1: Security Hardening (CRITICAL)

### 1.1 API Key Audit & Rotation

#### Current State Assessment
```bash
# Step 1: Identify all API keys in your config
grep -r "sk-" ~/.claude/ 2>/dev/null | head -20
grep -r "api_key" ~/.claude/ 2>/dev/null | head -20
grep -r "OPENAI" ~/.claude/ 2>/dev/null | head -20
```

#### Action Items
- [ ] Document each API key location and service (OpenAI, Anthropic, etc.)
- [ ] Verify each key is currently in use by checking MCP configs
- [ ] For unused keys: delete immediately
- [ ] For keys exposed in backups: rotate the API key at the service provider
- [ ] For keys with unknown rotation date: rotate as precaution

#### Key Audit Template
```markdown
| Service | Key Identifier | Last Rotated | Status | Notes |
|---------|---|---|---|---|
| OpenAI | sk-proj-... | ? | ACTIVE | Used by openai-gpt-image |
| Anthropic | sk-ant-... | ? | CHECK | Verify usage |
```

---

### 1.2 Filesystem Access Restrictions

#### Current Configuration (INSECURE)
Your Claude config currently grants access to:
- `/Users/cpconnor/` (entire home directory)

#### Recommended Configuration (SECURE)
```json
{
  "mcpServers": {
    "auto-documenter": {
      "command": "node",
      "args": ["/Users/cpconnor/projects/MCP Building/claude-auto-documenter-v2/dist/index.js"],
      "allowedDirectories": [
        "/Users/cpconnor/projects",
        "/Users/cpconnor/Library/Mobile Documents/com~apple~CloudDocs/Work"
      ]
    },
    "openai-gpt-image": {
      "command": "node",
      "args": ["/Users/cpconnor/projects/MCP Building/openai-gpt-image-mcp/dist/index.js"],
      "allowedDirectories": [
        "/Users/cpconnor/projects",
        "/tmp"
      ]
    },
    "nanobanana-mcp": {
      "command": "node",
      "args": ["/Users/cpconnor/projects/MCP Building/nanobanana-mcp/dist/index.js"],
      "allowedDirectories": [
        "/Users/cpconnor/projects"
      ]
    }
  }
}
```

#### Implementation
1. Backup current config: `cp ~/.claude/claude_desktop_config.json ~/.claude/backups/claude_desktop_config.$(date +%Y%m%d_%H%M%S).json.secure`
2. Update each MCP server entry with `allowedDirectories`
3. Remove any home directory-level access
4. Test each MCP individually
5. Monitor for any access permission errors in the first 24 hours

---

### 1.3 Secure Backup Management

#### Current Problem
- 10 backup files in `~/.claude/` directory
- Backups contain sensitive API keys
- No backup rotation policy
- Backups likely included in cloud sync if enabled

#### Remediation Steps

**Step 1: Secure Old Backups (Immediate)**
```bash
# View existing backups
ls -lh ~/.claude/*.bak 2>/dev/null | wc -l

# Create secure backup directory
mkdir -p ~/.claude/backups/.archived
chmod 700 ~/.claude/backups/.archived

# Move backups older than 30 days
find ~/.claude/*.bak -type f -mtime +30 -exec mv {} ~/.claude/backups/.archived/ \;

# Securely delete very old backups (>90 days)
find ~/.claude/backups/.archived -type f -mtime +90 -exec shred -u {} \;
```

**Step 2: Implement Backup Rotation**
See `maintenance-scripts/backup-config.sh` for automated rotation.

**Step 3: Exclude Backups from Cloud Sync**
If you use iCloud/Dropbox:
```bash
# Remove cloud sync from Claude config directory
xattr -d com.apple.fileprovider.don'tevercare ~/.claude 2>/dev/null || true
```

---

## Phase 2: Configuration Optimization (HIGH)

### 2.1 Standardize MCP Paths

#### Current Inconsistency
```
auto-documenter:   src/index.js      ❌ Development path
openai-gpt-image:  dist/index.js     ✅ Production path
nanobanana-mcp:    dist/index.js     ✅ Production path
```

#### Required Actions
- [ ] Verify all MCPs have built `dist/` directories
- [ ] Update auto-documenter config to use `dist/index.js`
- [ ] Test each MCP after path change
- [ ] Document why each uses its specific path

#### Verification Script
```bash
#!/bin/bash
for mcp in "auto-documenter" "openai-gpt-image" "nanobanana-mcp"; do
  path="/Users/cpconnor/projects/MCP Building/$mcp/dist/index.js"
  if [ -f "$path" ]; then
    echo "✅ $mcp: READY"
  else
    echo "❌ $mcp: MISSING - Run 'npm run build'"
  fi
done
```

### 2.2 Environment Variable Validation

#### Issue
`auto-documenter` CLI_PATH defined in config but not verified across all MCPs.

#### Solution
Create `env-verification.json`:
```json
{
  "auto-documenter": {
    "required": ["CLI_PATH"],
    "optional": []
  },
  "openai-gpt-image": {
    "required": ["OPENAI_API_KEY"],
    "optional": ["OPENAI_BASE_URL"]
  },
  "nanobanana-mcp": {
    "required": [],
    "optional": []
  }
}
```

---

## Phase 3: Organization & Documentation (MEDIUM)

### 3.1 New Directory Structure
```
~/.claude/
├── claude_desktop_config.json
├── config.json
├── developer_settings.json
├── backups/
│   ├── claude_desktop_config.2025-11-10.json
│   ├── config.2025-11-09.json
│   └── .archived/          # Files >30 days old
├── docs/
│   ├── SECURITY_GUIDE.md
│   ├── MCP_SETUP_GUIDE.md
│   └── TROUBLESHOOTING.md
├── logs/
│   └── mcp-errors.log
└── extensions-config/
    └── [extension settings]
```

### 3.2 Create Comprehensive Documentation

See included files:
- `CLAUDE_CONFIG_README.md` - Overview and quick reference
- `MCP_SETUP_GUIDE.md` - Detailed setup for each MCP
- `TROUBLESHOOTING.md` - Common issues and solutions

---

## Implementation Timeline

| Phase | Tasks | Duration | Risk |
|-------|-------|----------|------|
| **Phase 1** | API audit, restrict access, secure backups | 2-4 hours | HIGH - Test after each change |
| **Phase 2** | Path standardization, env validation | 1-2 hours | MEDIUM - Test MCPs after changes |
| **Phase 3** | Documentation, restructuring | 1-2 hours | LOW - No functional impact |
| **Phase 4** | Cache cleanup (if Claude is closed) | 30 min | LOW - Rebuilds on next launch |

---

## Rollback Procedures

### If Something Breaks

1. **Restore from backup:**
   ```bash
   cp ~/.claude/backups/claude_desktop_config.LATEST.json ~/.claude/claude_desktop_config.json
   ```

2. **Restart Claude Desktop**

3. **Check MCP status** in Claude settings

4. **Review logs:**
   ```bash
   tail -100 ~/.claude/logs/mcp-errors.log
   ```

---

## Next Steps

1. ✅ **READ** this entire document
2. ⏳ **START** Phase 1.1 (API Key Audit) - no system changes yet
3. ✅ **BACKUP** current configuration
4. ⏳ **EXECUTE** Phase 1.2-1.3 (Filesystem & Backups)
5. ✅ **TEST** each MCP after changes
6. ⏳ **IMPLEMENT** Phase 2 & 3

---

## Quick Reference: One-Time Commands

```bash
# Audit current config
cat ~/.claude/claude_desktop_config.json | grep -i "key\|secret\|api" | wc -l

# Backup before any changes
cp -r ~/.claude ~/.claude.backup.$(date +%Y%m%d_%H%M%S)

# List all backup files
find ~/.claude -name "*.bak" -o -name "*.backup" | sort

# Check which MCPs are configured
grep -o '"command": "[^"]*"' ~/.claude/claude_desktop_config.json

# Verify MCP executables exist
for f in ~/.claude/claude_desktop_config.json; do 
  grep '"args":' "$f" | grep -o '\[.*\]' | tr ',' '\n' | grep -o '/[^"]*'
done
```

---

## Support & Questions

If any MCP breaks after these changes:
1. Check the MCP's README.md for specific requirements
2. Verify the dist/ directory was built: `ls -la /path/to/mcp/dist/`
3. Test the MCP manually: `node /path/to/mcp/dist/index.js --help`
4. Review security changes - they may restrict needed filesystem access

---

**Last Updated:** November 11, 2025  
**Status:** Ready for implementation  
**Approval:** Review thoroughly before executing Phase 1
