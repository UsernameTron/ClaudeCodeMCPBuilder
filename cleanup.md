OPTIMIZATION & CLEANUP PLAN
🔴 CRITICAL SECURITY ISSUES

API Keys Exposed in Plain Text

⚠️ IMMEDIATE ACTION REQUIRED: Your API keys are stored unencrypted in:

Main config file
10 backup files


Risk: If this directory is backed up to cloud services or accessed by malware, keys are compromised
Recommendation: Consider using environment variables or secure key management


Backup Files Contain Sensitive Data

All 10 backup files contain API keys (some placeholders, some real)
Recommendation: Secure deletion of old backups


Broad Filesystem Access

Home directory (/Users/cpconnor) access grants Claude extensive file system permissions
Recommendation: Restrict to specific project directories only



🟡 CONFIGURATION OPTIMIZATION

Backup File Management

   ISSUE: 10 backup files accumulating
   IMPACT: Cluttered directory, potential confusion
   ACTION: Retain only 3-5 most recent backups

MCP Path Consistency

   ISSUE: Mixed use of src/ and dist/ paths
   - auto-documenter: uses src/index.js
   - openai-gpt-image: uses dist/index.js  
   - nanobanana-mcp: uses dist/index.js
   
   RECOMMENDATION: Standardize to dist/ for production builds

Environment Variables Missing

   ISSUE: auto-documenter CLI_PATH added in config but not in all MCPs
   VERIFY: All required env vars are set for each MCP
🟢 ORGANIZATIONAL IMPROVEMENTS

Documentation

   CREATE: README.md in Claude config directory documenting:
   - Purpose of each MCP server
   - Required environment variables
   - Setup instructions
   - Troubleshooting guide

Directory Structure

   CREATE: Subdirectories for better organization:
   /Claude/
     /configs/         (backup configs here)
     /docs/           (documentation)
     /logs/           (if applicable)

MCP Projects Organization

   CURRENT: /Users/cpconnor/projects/MCP Building/
   
   VERIFY: All MCP projects are:
   - Built (dist/ folders exist)
   - Version controlled
   - Documented
🔵 CACHE & PERFORMANCE

Cache Cleanup Strategy

   RECOMMENDATION: Periodic cache clearing
   - GPUCache/
   - Code Cache/
   - DawnGraphiteCache/
   - DawnWebGPUCache/
   
   BENEFIT: Reduce disk usage, resolve potential corruption

Crash Reports

   CHECK: Crashpad directory for error patterns
   ACTION: Review and archive old crash reports

DETAILED CLEANUP PLAN
Phase 1: Security Hardening (Priority: CRITICAL)
Step 1.1: Audit API Keys

 Document all active API keys and their services
 Verify each key is necessary and actively used
 Consider rotating keys if security is uncertain

Step 1.2: Restrict Filesystem Access
jsonRECOMMENDED CONFIG:
{
  "allowed_directories": [
    "/Users/cpconnor/projects",
    "/Users/cpconnor/Library/Mobile Documents/com~apple~CloudDocs/Work",
    "/Users/cpconnor/auto-docs"
  ]
}
Remove home directory-level access unless specifically needed.
Step 1.3: Secure Backups

 Move backups to secure location outside Claude directory
 Delete backups older than 30 days
 Implement automated backup rotation (keep only 5 most recent)

Phase 2: Configuration Optimization (Priority: HIGH)
Step 2.1: Standardize MCP Paths
jsonPROPOSED CHANGES:
{
  "auto-documenter": {
    "args": [
      "/Users/cpconnor/projects/MCP Building/claude-auto-documenter-v2/dist/index.js"
    ]
  }
}
Step 2.2: Validate Environment Variables
Create a verification script:
bash# Verify all MCP servers have required env vars
# Check that paths exist
# Confirm API keys are set
```

**Step 2.3:** Document Current State
- [ ] Create `CLAUDE_CONFIG_README.md`
- [ ] List all MCPs with purpose and dependencies
- [ ] Document required environment variables
- [ ] Add troubleshooting section

### **Phase 3: Organization & Maintenance (Priority: MEDIUM)**

**Step 3.1:** Restructure Directory
```
/Claude/
  claude_desktop_config.json
  config.json
  developer_settings.json
  /backups/              # Move .bak files here
  /docs/                 # Documentation
    CLAUDE_CONFIG_README.md
    MCP_SETUP_GUIDE.md
  /extensions-config/    # Extension settings
  /.claude/             # Keep as-is
  [system directories]  # Keep as-is
Step 3.2: Create Maintenance Scripts
bash# backup-config.sh - Smart backup rotation
# clean-cache.sh - Clear cache directories safely
# verify-mcps.sh - Check MCP health
Step 3.3: Set Up Monitoring

 Create checklist for weekly config review
 Monitor MCP project updates
 Track API usage/limits

Phase 4: Cache & Performance (Priority: LOW)
Step 4.1: Cache Cleanup
bash# Safely clear caches (Claude must be closed)
rm -rf "Cache/"
rm -rf "Code Cache/"
rm -rf "GPUCache/"
# Let Claude rebuild on next launch
Step 4.2: Review System Files

 Check Crashpad for patterns
 Review Sentry logs if accessible
 Archive old session data