# Implementation Checklist & Troubleshooting

**Status:** Ready to implement  
**Last Updated:** November 11, 2025

---

## PHASE 1: SECURITY HARDENING ⏱️ Estimated: 2-4 hours

### 1.1 API Key Audit & Rotation

- [ ] **Step 1.1.1:** Backup current configuration
  ```bash
  mkdir -p ~/.claude/backups
  cp ~/.claude/claude_desktop_config.json ~/.claude/backups/claude_desktop_config.pre-security.$(date +%s).json
  chmod 600 ~/.claude/backups/claude_desktop_config.pre-security.*.json
  ```

- [ ] **Step 1.1.2:** List all API keys
  ```bash
  echo "=== API Keys in Config ===" 
  grep -E "(sk-|api_key|API_KEY|OPENAI)" ~/.claude/claude_desktop_config.json | head -20
  ```

- [ ] **Step 1.1.3:** Check backup files for keys
  ```bash
  echo "=== Backup files with API Keys ===" 
  grep -l "sk-\|api_key" ~/.claude/*.bak 2>/dev/null | wc -l
  ```

- [ ] **Step 1.1.4:** Document each key
  - [ ] Service name (OpenAI, Anthropic, etc.)
  - [ ] Key prefix (sk-proj-, sk-ant-, etc.)
  - [ ] Current status (active/unused)
  - [ ] Last rotation date

- [ ] **Step 1.1.5:** Rotate keys if needed
  - Visit service provider's API settings
  - Generate new key
  - Note: Keep old keys temporarily for testing
  - [ ] OpenAI: https://platform.openai.com/account/api-keys
  - [ ] Other services: [document as applicable]

- [ ] **Step 1.1.6:** Test with new keys
  ```bash
  # Test OpenAI connection
  OPENAI_API_KEY="sk-proj-new-key" node -e "
    const key = process.env.OPENAI_API_KEY;
    console.log('Key set:', key.substring(0, 20) + '...');
  "
  ```

**⏸️ CHECKPOINT:** All API keys audited and documented

---

### 1.2 Filesystem Access Restrictions

- [ ] **Step 1.2.1:** Review current config
  ```bash
  cat ~/.claude/claude_desktop_config.json | jq '.'
  ```

- [ ] **Step 1.2.2:** Back up config before editing
  ```bash
  cp ~/.claude/claude_desktop_config.json ~/.claude/backups/claude_desktop_config.pre-restrictions.json
  ```

- [ ] **Step 1.2.3:** Identify required directories for each MCP
  - [ ] auto-documenter: needs `/Users/cpconnor/projects`
  - [ ] openai-gpt-image: needs `/Users/cpconnor/projects` and `/tmp`
  - [ ] nanobanana-mcp: needs `/Users/cpconnor/projects`

- [ ] **Step 1.2.4:** Update config with allowedDirectories
  ```json
  {
    "mcpServers": {
      "auto-documenter": {
        "allowedDirectories": ["/Users/cpconnor/projects"]
      }
    }
  }
  ```
  See `SECURITY_HARDENING_GUIDE.md` for full template

- [ ] **Step 1.2.5:** Remove home directory-level access
  - Delete any entry that grants access to `/Users/cpconnor/`
  - Keep only specific project directories

- [ ] **Step 1.2.6:** Test each MCP
  - Close and restart Claude
  - Verify each MCP appears in Claude's tool list
  - Test one function from each MCP

**⏸️ CHECKPOINT:** Filesystem access restricted

---

### 1.3 Secure Backup Management

- [ ] **Step 1.3.1:** Create backup structure
  ```bash
  mkdir -p ~/.claude/backups/.archived
  chmod 700 ~/.claude/backups
  chmod 700 ~/.claude/backups/.archived
  ```

- [ ] **Step 1.3.2:** Identify old backups
  ```bash
  ls -lh ~/.claude/*.bak | awk '{print $6, $7, $8, $9, $10}'
  ```

- [ ] **Step 1.3.3:** Securely move old backups
  ```bash
  # Move backups older than 30 days
  find ~/.claude/*.bak -type f -mtime +30 -exec mv {} ~/.claude/backups/.archived/ \; 2>/dev/null || echo "No old backups to move"
  ```

- [ ] **Step 1.3.4:** Set up automatic rotation script
  ```bash
  chmod +x maintenance-scripts/backup-config.sh
  
  # Test dry-run first
  ./maintenance-scripts/backup-config.sh 5 false
  ```

- [ ] **Step 1.3.5:** Schedule backup rotation (cron)
  ```bash
  # Edit crontab
  crontab -e
  
  # Add weekly backup at 2 AM Sunday
  0 2 * * 0 /Users/cpconnor/projects/MCP\ Building/maintenance-scripts/backup-config.sh 5 false
  ```

- [ ] **Step 1.3.6:** Exclude from cloud sync (if applicable)
  ```bash
  # If Claude directory is cloud-synced, exclude backups
  ls ~/.claude/backups/.archived | head -5
  # Verify not in Dropbox/iCloud
  ```

**⏸️ CHECKPOINT:** Backups secured and rotation configured

---

## PHASE 2: CONFIGURATION OPTIMIZATION ⏱️ Estimated: 1-2 hours

### 2.1 Standardize MCP Paths

- [ ] **Step 2.1.1:** Verify all MCPs are built
  ```bash
  for mcp in "auto-documenter-v2" "openai-gpt-image-mcp" "nanobanana-mcp"; do
    path="/Users/cpconnor/projects/MCP Building/$mcp/dist/index.js"
    [ -f "$path" ] && echo "✅ $mcp" || echo "❌ $mcp - Run: npm run build"
  done
  ```

- [ ] **Step 2.1.2:** Build any missing dist/
  ```bash
  # For each MCP missing dist/
  cd "/Users/cpconnor/projects/MCP Building/[MCP_NAME]"
  npm run build
  ```

- [ ] **Step 2.1.3:** Update auto-documenter config
  - Change from: `src/index.js`
  - Change to: `dist/index.js`
  - In: `~/.claude/claude_desktop_config.json`

- [ ] **Step 2.1.4:** Verify config changes
  ```bash
  grep -n "index.js" ~/.claude/claude_desktop_config.json
  # Should show all MCPs using dist/index.js
  ```

- [ ] **Step 2.1.5:** Test MCPs after path change
  - Close Claude
  - Restart Claude
  - Verify all 3 MCPs appear
  - Test each one briefly

**⏸️ CHECKPOINT:** All MCPs standardized to dist/ paths

---

### 2.2 Environment Variables

- [ ] **Step 2.2.1:** Run verification script
  ```bash
  chmod +x maintenance-scripts/verify-mcps.sh
  ./maintenance-scripts/verify-mcps.sh true
  ```

- [ ] **Step 2.2.2:** Check for missing env vars
  ```bash
  echo "Checking environment variables..."
  echo "OPENAI_API_KEY: ${OPENAI_API_KEY:- NOT SET}"
  ```

- [ ] **Step 2.2.3:** Set required env vars in config
  - For openai-gpt-image: ensure OPENAI_API_KEY is set
  - For auto-documenter: verify CLI_PATH is correct
  
  ```json
  {
    "env": {
      "OPENAI_API_KEY": "sk-proj-...",
      "CLI_PATH": "/usr/local/bin:/usr/bin"
    }
  }
  ```

- [ ] **Step 2.2.4:** Document all env vars
  - See `env-verification.json` template in guide
  - For each MCP, list required and optional vars

**⏸️ CHECKPOINT:** Environment variables validated

---

## PHASE 3: ORGANIZATION & DOCUMENTATION ⏱️ Estimated: 1-2 hours

### 3.1 Documentation Setup

- [ ] **Step 3.1.1:** Create documentation directory
  ```bash
  mkdir -p ~/.claude/docs
  chmod 755 ~/.claude/docs
  ```

- [ ] **Step 3.1.2:** Add SECURITY_HARDENING_GUIDE.md to docs
  ```bash
  cp SECURITY_HARDENING_GUIDE.md ~/.claude/docs/
  cp MCP_SETUP_GUIDE.md ~/.claude/docs/
  ```

- [ ] **Step 3.1.3:** Create README in Claude config
  Create `~/.claude/docs/README.md` with:
  - Overview of your setup
  - List of all MCPs
  - Required API keys
  - Quick reference commands
  - Troubleshooting section

- [ ] **Step 3.1.4:** Create maintenance log template
  ```bash
  touch ~/.claude/docs/MAINTENANCE_LOG.md
  cat > ~/.claude/docs/MAINTENANCE_LOG.md << 'EOF'
  # Maintenance Log
  
  ## November 11, 2025
  - Security hardening phase completed
  - API keys rotated
  - Filesystem access restricted
  - Backup rotation configured
  
  ## Template Entry:
  ### Date: YYYY-MM-DD
  - [ ] Weekly verification run
  - [ ] API usage check
  - [ ] Log review
  - [ ] Any issues found
  EOF
  ```

### 3.2 Directory Restructuring

- [ ] **Step 3.2.1:** Create subdirectories
  ```bash
  mkdir -p ~/.claude/logs
  mkdir -p ~/.claude/extensions-config
  chmod 700 ~/.claude/logs
  chmod 755 ~/.claude/extensions-config
  ```

- [ ] **Step 3.2.2:** Move maintenance scripts
  ```bash
  mkdir -p ~/.claude/bin
  # You can optionally move scripts here for easier access
  chmod +x ~/.claude/bin/*.sh
  ```

- [ ] **Step 3.2.3:** Organize existing files
  - Keep `claude_desktop_config.json` in root
  - Keep `.claude/` system directory untouched
  - Move docs to `/docs/`
  - Move backups to `/backups/`

**⏸️ CHECKPOINT:** Documentation and structure organized

---

## PHASE 4: MAINTENANCE & MONITORING ⏱️ Estimated: 30 minutes

### 4.1 Set Up Maintenance Scripts

- [ ] **Step 4.1.1:** Make scripts executable
  ```bash
  chmod +x maintenance-scripts/*.sh
  ```

- [ ] **Step 4.1.2:** Test backup script (dry-run)
  ```bash
  ./maintenance-scripts/backup-config.sh 5 false
  ls ~/.claude/backups/
  ```

- [ ] **Step 4.1.3:** Test MCP verification
  ```bash
  ./maintenance-scripts/verify-mcps.sh true
  ```

- [ ] **Step 4.1.4:** Test cache cleanup (dry-run)
  ```bash
  ./maintenance-scripts/clean-cache.sh true
  # Don't actually clean yet - Claude might be running
  ```

### 4.2 Schedule Automated Tasks

- [ ] **Step 4.2.1:** Add backup to cron
  ```bash
  crontab -e
  # Add: 0 2 * * 0 /Users/cpconnor/projects/MCP\ Building/maintenance-scripts/backup-config.sh 5 false
  ```

- [ ] **Step 4.2.2:** Create weekly verification reminder
  - Set calendar reminder for weekly MCP check
  - Or create a cron job for automated verification

- [ ] **Step 4.2.3:** Document cache cleanup schedule
  - Cache cleanup should be done QUARTERLY
  - Close Claude first
  - Run: `./maintenance-scripts/clean-cache.sh`

**⏸️ CHECKPOINT:** Maintenance automated

---

## TESTING & VALIDATION

### Testing Checklist

- [ ] **Test 1: MCP Availability**
  - [ ] Open Claude
  - [ ] Verify auto-documenter appears
  - [ ] Verify openai-gpt-image appears
  - [ ] Verify nanobanana-mcp appears

- [ ] **Test 2: Security Restrictions**
  - [ ] Try to access file outside allowed directories
  - [ ] Verify access is denied (if restriction implemented)
  - [ ] Try to access within allowed directories
  - [ ] Verify access works

- [ ] **Test 3: Environment Variables**
  ```bash
  ./maintenance-scripts/verify-mcps.sh true
  ```
  - [ ] All MCPs show green checkmarks
  - [ ] No warnings about missing env vars

- [ ] **Test 4: API Functionality**
  - [ ] Test auto-documenter: Can it generate docs?
  - [ ] Test openai-gpt-image: Can it generate an image?
  - [ ] Test nanobanana-mcp: Does it respond?

- [ ] **Test 5: Config Revert**
  - [ ] Rename current config
  - [ ] Restore from backup
  - [ ] Verify old config still works
  - [ ] Restore new config

---

## TROUBLESHOOTING

### MCP Not Appearing After Changes

**Symptoms:** MCP configured but not appearing in Claude

**Diagnosis:**
```bash
# 1. Check file exists
ls -la "/Users/cpconnor/projects/MCP Building/[MCP-NAME]/dist/index.js"

# 2. Check config syntax
cat ~/.claude/claude_desktop_config.json | jq '.mcpServers.[YOUR_MCP]'

# 3. Check permissions
file "/Users/cpconnor/projects/MCP Building/[MCP-NAME]/dist/index.js"

# 4. Test directly
node "/Users/cpconnor/projects/MCP Building/[MCP-NAME]/dist/index.js" --help
```

**Solutions:**
1. Run `npm run build` if dist/ is missing
2. Check for JSON syntax errors in config
3. Restart Claude completely (quit and reopen)
4. Check Claude Desktop logs: `~/.claude/logs/`

---

### "Access Denied" for File Operations

**Symptoms:** MCP can't read/write files it should access

**Causes:**
1. File is outside `allowedDirectories`
2. File permissions issue
3. Security restrictions too strict

**Fix:**
1. Check which directory MCP needs access to
2. Verify it's in `allowedDirectories`
3. Add if missing:
   ```json
   "allowedDirectories": ["/path/needed"]
   ```
4. Restart Claude

---

### API Key Errors

**Symptoms:** "Invalid API key" or "Unauthorized"

**Diagnosis:**
```bash
# Check if key is set
echo $OPENAI_API_KEY

# Verify key format
echo $OPENAI_API_KEY | grep "^sk-"

# Test key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json"
```

**Solutions:**
1. Verify key is set in Claude config
2. Rotate key if it might be compromised
3. Check key has required permissions (DALL-E for image MCP)
4. Test key manually to confirm validity

---

### Module Not Found Errors

**Symptoms:** "Cannot find module 'xyz'"

**Fix:**
```bash
cd "/Users/cpconnor/projects/MCP Building/[MCP-NAME]"
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### Script Permission Errors

**Symptoms:** "Permission denied" when running maintenance scripts

**Fix:**
```bash
chmod +x maintenance-scripts/*.sh
./maintenance-scripts/backup-config.sh
```

---

## Rollback Procedures

If something breaks and you need to revert:

```bash
# 1. Stop Claude
killall "Claude" 2>/dev/null || true

# 2. Restore from backup
cp ~/.claude/backups/claude_desktop_config.pre-security.*.json ~/.claude/claude_desktop_config.json

# 3. Restart Claude
open /Applications/Claude.app

# 4. Verify MCPs appear
# Check Claude's tool list
```

---

## Success Criteria

✅ **Phase 1 Complete When:**
- API keys are audited and documented
- Filesystem access restricted to specific directories
- Backups secured and rotated
- No config accessible from home directory

✅ **Phase 2 Complete When:**
- All MCPs use dist/index.js
- All required env vars are set
- MCP verification script passes

✅ **Phase 3 Complete When:**
- Documentation is written and accessible
- Directory structure is organized
- Maintenance scripts are executable

✅ **Phase 4 Complete When:**
- Backups run automatically
- All MCPs verify successfully
- Cache cleanup schedule is set

---

## Next Steps After Implementation

1. **Week 1:** Monitor logs for any issues
2. **Week 2:** Run full verification suite
3. **Week 3:** Review and archive logs
4. **Week 4:** Rotate API keys (if not already done)
5. **Monthly:** Review security posture

---

## Questions & Support

- See `SECURITY_HARDENING_GUIDE.md` for security details
- See `MCP_SETUP_GUIDE.md` for MCP troubleshooting
- Check `~/.claude/logs/` for error details
- Review documentation before asking for help

---

**Last Updated:** November 11, 2025  
**Status:** Ready to implement  
**Estimated Total Time:** 4-8 hours (over multiple sessions is recommended)
