# Quick Reference Card & Daily Troubleshooting

## ⚡ Quick Commands

### Status & Verification
```bash
# Quick health check of all MCPs
/Users/cpconnor/projects/MCP\ Building/maintenance-scripts/verify-mcps.sh false

# Check API key is set
echo "OpenAI Key: ${OPENAI_API_KEY:- NOT SET}"

# View current config MCPs
jq '.mcpServers | keys' ~/.claude/claude_desktop_config.json

# List recent backups
ls -lht ~/.claude/backups/*.json | head -5
```

### Maintenance Tasks
```bash
# Create new backup
/Users/cpconnor/projects/MCP\ Building/maintenance-scripts/backup-config.sh 5 false

# Test cache cleanup (dry-run)
/Users/cpconnor/projects/MCP\ Building/maintenance-scripts/clean-cache.sh true

# Restart Claude cleanly
killall "Claude" 2>/dev/null && sleep 2 && open /Applications/Claude.app
```

### Testing MCPs
```bash
# Test auto-documenter
node "/Users/cpconnor/projects/MCP Building/claude-auto-documenter-v2/dist/index.js" --help

# Test openai-gpt-image
node "/Users/cpconnor/projects/MCP Building/openai-gpt-image-mcp/dist/index.js" --help

# Test nanobanana-mcp
node "/Users/cpconnor/projects/MCP Building/nanobanana-mcp/dist/index.js" --help
```

---

## 🔧 Common Issues & Fast Fixes

### Issue: MCP Not Appearing
**Time to fix:** 2 minutes

```bash
# Step 1: Check dist/ exists
ls /Users/cpconnor/projects/MCP\ Building/*/dist/index.js

# Step 2: Rebuild if missing
cd "/Users/cpconnor/projects/MCP Building/[MCP-NAME]"
npm run build

# Step 3: Check config syntax
cat ~/.claude/claude_desktop_config.json | jq '.mcpServers'

# Step 4: Restart Claude
killall "Claude" && sleep 2 && open /Applications/Claude.app
```

### Issue: "Permission Denied" on Files
**Time to fix:** 1 minute

```bash
# Add directory to allowedDirectories in config
# Edit ~/.claude/claude_desktop_config.json
# Add to your MCP's section:
"allowedDirectories": ["/Users/cpconnor/projects"]
```

### Issue: API Key Invalid
**Time to fix:** 5 minutes

```bash
# 1. Verify key is set
echo $OPENAI_API_KEY

# 2. Test with curl
curl -s https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | head -20

# 3. If error: regenerate key at https://platform.openai.com/account/api-keys

# 4. Update config with new key
# Edit ~/.claude/claude_desktop_config.json
```

### Issue: Cache Taking Too Much Space
**Time to fix:** 10 minutes (requires Claude closed)

```bash
# 1. Close Claude
killall "Claude"

# 2. Check space used
du -sh ~/.claude/Cache ~/.claude/GPUCache ~/.claude/Code\ Cache 2>/dev/null

# 3. Clean cache
/Users/cpconnor/projects/MCP\ Building/maintenance-scripts/clean-cache.sh

# 4. Restart Claude
open /Applications/Claude.app
```

---

## 📋 Weekly Checklist

- [ ] Run verification: `./maintenance-scripts/verify-mcps.sh`
- [ ] Check error logs: `tail ~/.claude/logs/*.log`
- [ ] Review API usage (if using OpenAI)
- [ ] Backup config runs automatically

---

## 🗂️ Important File Locations

| File | Purpose | Path |
|------|---------|------|
| Main Config | Claude MCP configuration | `~/.claude/claude_desktop_config.json` |
| Security Guide | Security hardening steps | `/projects/MCP Building/SECURITY_HARDENING_GUIDE.md` |
| Setup Guide | MCP setup reference | `/projects/MCP Building/MCP_SETUP_GUIDE.md` |
| Implementation | Detailed checklist | `/projects/MCP Building/IMPLEMENTATION_CHECKLIST.md` |
| Backup Script | Auto backup rotation | `/projects/MCP Building/maintenance-scripts/backup-config.sh` |
| Verify Script | MCP health check | `/projects/MCP Building/maintenance-scripts/verify-mcps.sh` |
| Cache Cleanup | Safe cache cleaner | `/projects/MCP Building/maintenance-scripts/clean-cache.sh` |
| Backups | Config backups | `~/.claude/backups/` |
| Logs | System logs | `~/.claude/logs/` |

---

## 🚨 Emergency Restore

**Situation:** Claude crashed or config is corrupted

```bash
# Find most recent backup
ls -lt ~/.claude/backups/*.json | head -1

# Restore it
cp ~/.claude/backups/claude_desktop_config.NEWEST.json ~/.claude/claude_desktop_config.json

# Restart Claude
killall "Claude" && open /Applications/Claude.app
```

---

## 📊 Health Check Output

### What "✅ All Good" Looks Like

```
✅ auto-documenter: File exists
✅ auto-documenter: Build artifacts exist
✅ auto-documenter: package.json found
✅ auto-documenter: Node.js is available
✅ auto-documenter: Dependencies installed
✅ auto-documenter: Configured in claude_desktop_config.json
```

### What "⚠️ Needs Attention" Looks Like

```
⚠️ openai-gpt-image: Environment variable OPENAI_API_KEY is NOT set
❌ nanobanana-mcp: File NOT found - [path]
```

---

## 🔐 Security Checklist

- [ ] API keys NOT hardcoded in config (use env vars)
- [ ] Filesystem access restricted to specific directories
- [ ] Backups not included in cloud sync
- [ ] Old backups securely deleted
- [ ] Backup script runs automatically
- [ ] Monthly key rotation schedule

---

## 📞 Before Contacting Support

1. **Run verification:**
   ```bash
   ./maintenance-scripts/verify-mcps.sh true
   ```

2. **Check logs:**
   ```bash
   tail -50 ~/.claude/logs/*.log
   ```

3. **Try restart:**
   ```bash
   killall "Claude" && sleep 2 && open /Applications/Claude.app
   ```

4. **Check configuration:**
   ```bash
   cat ~/.claude/claude_desktop_config.json | jq '.mcpServers'
   ```

5. **Run individual test:**
   ```bash
   node "/Users/cpconnor/projects/MCP Building/[MCP]/dist/index.js" --help
   ```

---

## 📈 Performance Monitoring

### View MCP Resource Usage
```bash
# See what processes are running
ps aux | grep node | grep -v grep

# Check disk space
df -h ~/.claude
du -sh ~/.claude/*

# Check memory usage
top -l 1 | grep node
```

---

## 🎯 Success Indicators

✅ **MCPs Working:**
- All 3 appear in Claude's tool menu
- Each can be called and responds quickly
- No errors in logs

✅ **Security Good:**
- No API keys in plain text in config
- Filesystem access restricted
- Automated backups running

✅ **Maintenance Smooth:**
- Weekly verification passes
- No old backups accumulating
- Logs are reviewed regularly

---

## 🔄 30-Day Maintenance Cycle

### Week 1
- [ ] Implement security hardening
- [ ] Update all MCPs to dist/ paths
- [ ] Test everything thoroughly

### Week 2
- [ ] Run first automated backup
- [ ] Verify backup rotation works
- [ ] Check error logs

### Week 3
- [ ] Review and archive old logs
- [ ] Document any issues
- [ ] Test rollback procedure

### Week 4
- [ ] Run cache cleanup (if needed)
- [ ] Review API usage/costs
- [ ] Plan next security audit

---

## 🎓 Learning Resources

- **MCP Documentation:** Check README in each project
- **Node.js Debugging:** `node --inspect-brk dist/index.js`
- **Claude Troubleshooting:** Check Anthropic support
- **OpenAI API:** https://platform.openai.com/docs

---

## ⏰ Time Estimates

| Task | Time | Frequency |
|------|------|-----------|
| Security hardening (full) | 4-8 hours | One-time |
| MCP verification | 5 minutes | Weekly |
| Backup creation | <1 minute | Automatic |
| Cache cleanup | 10 minutes | Quarterly |
| API key rotation | 30 minutes | Quarterly |
| Log review | 10 minutes | Monthly |

---

## 💡 Pro Tips

1. **Always backup before editing config**
   ```bash
   cp ~/.claude/claude_desktop_config.json ~/.claude/backups/backup.$(date +%s).json
   ```

2. **Use `jq` for config viewing**
   ```bash
   cat ~/.claude/claude_desktop_config.json | jq '.'
   ```

3. **Set up a maintenance reminder**
   - Weekly: Run verification script
   - Monthly: Review logs and API usage
   - Quarterly: Rotate keys and clean cache

4. **Keep scripts easily accessible**
   ```bash
   alias verify-mcps='/Users/cpconnor/projects/MCP\ Building/maintenance-scripts/verify-mcps.sh'
   alias backup-config='/Users/cpconnor/projects/MCP\ Building/maintenance-scripts/backup-config.sh'
   ```

5. **Monitor API costs**
   - Set up OpenAI usage alerts
   - Review bill monthly
   - Check for unusual spikes

---

## 📝 Maintenance Log Template

```markdown
## [DATE]
- [ ] Ran MCP verification
  - Result: [PASS/WARN/FAIL]
  - Issues: [list any]
- [ ] Checked error logs
  - Errors: [list any]
- [ ] Verified API usage
  - Usage: [stats]
- [ ] Notes: [any observations]
```

---

**Last Updated:** November 11, 2025  
**For detailed guides, see:**
- `SECURITY_HARDENING_GUIDE.md`
- `MCP_SETUP_GUIDE.md`
- `IMPLEMENTATION_CHECKLIST.md`
