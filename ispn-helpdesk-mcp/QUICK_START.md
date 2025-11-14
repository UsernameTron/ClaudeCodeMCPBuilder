# ISPN Helpdesk MCP - Quick Start Guide

Get up and running with ISPN Helpdesk queries in Claude Desktop in 5 minutes.

---

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Claude Desktop installed
- ✅ ISPN auth code from administrator

---

## Step 1: Build the Project

```bash
cd ispn-helpdesk-mcp
npm install
npm run build
```

**Expected output**: Build completes successfully, creates `dist/` folder

---

## Step 2: Get Your ISPN Auth Code

Contact your ISPN administrator to request your personal auth code.

**Example**: `auth=abc123XYZ456`

You'll use just the code part: `abc123XYZ456`

---

## Step 3: Configure Claude Desktop

### Find your config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Edit the config file:

```json
{
  "mcpServers": {
    "ispn-helpdesk": {
      "command": "node",
      "args": [
        "/FULL/PATH/TO/ispn-helpdesk-mcp/dist/mcp-server.js"
      ],
      "env": {
        "ISPN_API_URL": "https://api.helpdesk.ispn.net/exec.pl",
        "ISPN_AUTH_CODE": "your-auth-code-here",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**⚠️ Important**: Use the **absolute path** to your `dist/mcp-server.js` file!

**Example paths**:
- macOS: `/Users/yourname/projects/ispn-helpdesk-mcp/dist/mcp-server.js`
- Windows: `C:\\Users\\yourname\\projects\\ispn-helpdesk-mcp\\dist\\mcp-server.js`
- Linux: `/home/yourname/projects/ispn-helpdesk-mcp/dist/mcp-server.js`

---

## Step 4: Restart Claude Desktop

**Important**: Fully quit and restart Claude Desktop (not just refresh).

- **macOS**: Quit Claude Desktop completely, then reopen
- **Windows**: Exit from system tray, then reopen
- **Linux**: Kill process and restart

---

## Step 5: Test It!

Open Claude Desktop and try these queries:

### Test 1: List Categories
```
What ticket categories are available in ISPN?
```

**Expected**: Claude will use `ispn.query.list_categories` and show you all available categories.

### Test 2: Customer Lookup
```
Look up customer with billing ID 999
```

**Expected**: Claude will use `ispn.customer.get_details` and return customer information (or "not found" if that ID doesn't exist).

### Test 3: Check Account
```
Check if email test@example.com exists in ISPN
```

**Expected**: Claude will use `ispn.account.check` and tell you if the mailbox exists.

---

## Common Queries You Can Try

### Customer Information
```
"Find customer with phone number 555-123-4567"
"Show me full details for customer 12345"
"List all tickets for customer 12345"
```

### Ticket Searches
```
"Find all tickets created yesterday"
"Show tickets from January 1 to January 15"
"List all open escalations from last week"
```

### Account Verification
```
"Does username jdoe exist?"
"Is mailbox support@company.com active?"
"Check if customer@example.com exists"
```

### Network Info
```
"Show DHCP reservations for customer 12345"
"List all DHCP reservations in pool ABC"
```

---

## Troubleshooting

### "Tool not found" error

**Problem**: Claude says it doesn't have access to ISPN tools

**Solution**:
1. Check that config file path is correct
2. Verify absolute path to `mcp-server.js` in config
3. Ensure `npm run build` completed successfully
4. Restart Claude Desktop (quit completely, not just refresh)

---

### "Authentication error"

**Problem**: API returns unauthorized or auth error

**Solution**:
1. Verify `ISPN_AUTH_CODE` in config is correct
2. Test auth code directly:
   ```bash
   curl "https://api.helpdesk.ispn.net/exec.pl?auth=YOUR_CODE&cmd=listsupportsvc"
   ```
3. Contact ISPN administrator if code is invalid

---

### "Customer not found"

**Problem**: Phone lookup returns no results

**Solution**:
1. Try lookup by billing ID instead (faster and more reliable)
2. Try lookup by email if mailbox is known
3. Verify customer exists in ISPN system
4. Check phone number format (should work with any format, but ISPN stores 10 digits)

---

### Build errors

**Problem**: `npm run build` fails

**Solution**:
1. Ensure Node.js 18+ is installed: `node --version`
2. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```
3. Check for TypeScript errors in terminal output

---

## Getting Help

### Check logs
```bash
# macOS/Linux
tail -f ~/Library/Logs/Claude/mcp*.log

# Windows
# Check: %APPDATA%\Claude\logs\
```

### Verify config
```bash
# macOS
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows
type %APPDATA%\Claude\claude_desktop_config.json

# Linux
cat ~/.config/Claude/claude_desktop_config.json
```

### Test MCP directly
```bash
node dist/mcp-server.js
# Should start without errors, waiting for input
# Press Ctrl+C to exit
```

---

## What You Can Do

### ✅ **Queries (Read-Only)**
- Look up customers
- Search tickets
- View escalations
- Check DHCP reservations
- Verify accounts
- List categories

### ❌ **NOT Available (By Design)**
- Create tickets
- Modify customer data
- Change service settings
- Update passwords
- Delete anything

This is intentional! The MCP is read-only for security.

---

## Tips for Best Results

1. **Be specific with billing IDs** - Fastest and most reliable
2. **Use date formats** - YYYY-MM-DD works best
3. **Phone lookups are slow** - Use billid or email when possible
4. **Categories are cached** - Add `refresh: true` to force update
5. **Ask naturally** - Claude understands context and converts to API calls

---

## Next Steps

- ✅ Read [ISPN_README.md](./ISPN_README.md) for comprehensive documentation
- ✅ Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details
- ✅ Explore [HelpdeskAPI.md](./HelpdeskAPI.md) for full ISPN API reference
- ✅ Train your team on common queries
- ✅ Document your organization's specific use cases

---

**🎉 You're ready to go! Start querying ISPN through Claude Desktop.**

For support, contact your ISPN administrator or technical team.
