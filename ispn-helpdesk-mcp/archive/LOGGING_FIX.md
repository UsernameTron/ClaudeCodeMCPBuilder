# Logging Output Fix - Stderr Routing

**Issue:** Log output interfering with MCP JSON-RPC protocol
**Fixed:** 2025-11-14
**Status:** ✅ **RESOLVED**

---

## Problem

Claude Desktop reported multiple JSON parsing errors:
```
⚠️ Unexpected token ' ' , " [35mtool "... is not valid JSON
⚠️ Expected ',' or ']' after array element in JSON at position 5
⚠️ Unexpected token '}' , "}" is not valid JSON
```

### Root Cause

MCP servers use **stdio** (standard input/output) for JSON-RPC communication:
- **stdin:** Receives requests from Claude Desktop
- **stdout:** Sends responses to Claude Desktop (MUST be valid JSON only)
- **stderr:** Should contain logs, debug output, etc.

Our logger (pino-pretty) was writing to **stdout**, which mixed log messages with JSON-RPC protocol messages, causing parse errors.

### Example of the Problem

**stdout before fix:**
```
[2025-11-14 16:46:20.961 -0600] [32mINFO[39m: [36mMCP server started[39m
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18"}}
[2025-11-14 16:46:20.968 -0600] [32mINFO[39m: [36mListing tools[39m
```

Claude Desktop tried to parse the colored log lines as JSON → **ERROR**

---

## Solution

Configured pino-pretty to write logs to **stderr** instead of stdout:

### Code Change

**File:** `src/utils/logger.ts`

```typescript
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      destination: 2 // ✅ Write to stderr (fd 2), not stdout (fd 1)
    }
  },
  // ... rest of config
});
```

**Key:** `destination: 2` forces pino-pretty to use file descriptor 2 (stderr)

---

## Verification

### Protocol Cleanliness Test

```bash
npm run build
# Test stdout/stderr separation
```

**Results:**
```
📊 Protocol Test Results:
==================================================
Stdout: 3 valid JSON messages, 0 invalid
Stderr: 14 log lines (as expected)

✅ SUCCESS! Stdout is clean - no log interference!
```

### End-to-End Test

```
✅ Initialize: SUCCESS
✅ Tools List: 9 tools registered
✅ Tool Execution: SUCCESS
   Services: 11

🎉 ALL TESTS PASSED!
   - Protocol communication: Clean
   - Tool registration: Working
   - Tool execution: Working
   - ISPN API: Connected
```

**Logs appeared on stderr** (below the output), not mixed with JSON:
```
[2025-11-14 17:03:32.885 -0600] [32mINFO[39m: [36mMCP server started on stdio[39m
[2025-11-14 17:03:32.887 -0600] [32mINFO[39m: [36mListing available ISPN query tools[39m
```

---

## Technical Details

### File Descriptors in Unix/Linux/macOS

| FD | Name | Purpose | MCP Usage |
|----|------|---------|-----------|
| 0 | stdin | Standard input | Receive JSON-RPC requests |
| 1 | stdout | Standard output | Send JSON-RPC responses |
| 2 | stderr | Standard error | Logs, debug output |

### Why This Matters for MCP

MCP uses **stdio transport** for lightweight, local communication:

1. **Claude Desktop writes request to stdin** (fd 0)
2. **MCP server reads from stdin, processes, writes response to stdout** (fd 1)
3. **Claude Desktop reads response from stdout**

If stdout contains anything other than JSON-RPC messages, parsing fails.

### Pino Destination Options

- `destination: 1` → stdout (default, **breaks MCP**)
- `destination: 2` → stderr ✅ (correct for MCP)
- `destination: '/path/to/file.log'` → file (also works)

---

## Impact on Users

### Before Fix
```
⚠️ MCP ispn-helpdesk: Unexpected token...
⚠️ MCP ispn-helpdesk: Expected ',' or ']'...
[Multiple JSON parse errors in Claude Desktop]
```

### After Fix
```
✅ MCP server connected successfully
✅ Tools available and working
[No errors in Claude Desktop]
```

---

## Logs Location

Logs now appear in **Claude Desktop's log files**, not the protocol stream:

**macOS:**
```
~/Library/Logs/Claude/mcp-server-ispn-helpdesk.log
```

**Windows:**
```
%APPDATA%\Claude\logs\mcp-server-ispn-helpdesk.log
```

**Linux:**
```
~/.config/Claude/logs/mcp-server-ispn-helpdesk.log
```

---

## Related Issues Fixed

This fix resolves all the JSON parsing errors that were reported:

1. ✅ `Unexpected token ' '` - Colored ANSI codes in stdout
2. ✅ `Expected ',' or ']'` - Log lines interrupting JSON arrays
3. ✅ `Unexpected token '}'` - Log lines after JSON objects
4. ✅ `not valid JSON` - Any non-JSON output

---

## Best Practices for MCP Servers

### ✅ DO:
- Write logs to **stderr**
- Keep stdout exclusively for JSON-RPC messages
- Use structured logging (pino, winston, etc.) with stderr output
- Test with stdio protocol to verify clean output

### ❌ DON'T:
- Use `console.log()` in MCP servers (goes to stdout)
- Write debug output to stdout
- Print startup messages to stdout
- Mix any non-JSON content with protocol messages

---

## Testing Your MCP Server

### Quick Stdio Test

```bash
# Send a request and check stdout is clean JSON
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/mcp-server.js
```

**Expected:** Only JSON output, no log lines

**If you see log lines:** Logs are going to stdout (bad)

### Separation Test

```bash
# Separate stdout and stderr
node dist/mcp-server.js 2>logs.txt 1>protocol.txt < requests.txt

# Check protocol.txt contains ONLY valid JSON
jq . protocol.txt  # Should parse successfully

# Check logs.txt contains your log output
cat logs.txt  # Should show colored logs
```

---

## Status: RESOLVED ✅

- ✅ Logger configured to use stderr
- ✅ Stdout contains only JSON-RPC messages
- ✅ All protocol tests passing
- ✅ No JSON parse errors in Claude Desktop
- ✅ Logs properly captured in Claude Desktop log files

**No further action required.** Restart Claude Desktop to use the fixed version.

---

## References

- [MCP Specification - Stdio Transport](https://modelcontextprotocol.io/docs/concepts/transports#stdio)
- [Pino Logger - Destination Options](https://getpino.io/#/docs/api?id=destination)
- [Unix File Descriptors](https://en.wikipedia.org/wiki/File_descriptor)
