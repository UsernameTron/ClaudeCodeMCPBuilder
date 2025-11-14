# ISPN Helpdesk MCP Server

**Read-only query interface for ISPN Helpdesk with advanced analytics**

A Model Context Protocol (MCP) server providing natural language query access to ISPN Helpdesk data through Claude Desktop. Features 14 tools for customer lookup, ticket search, escalation tracking, network diagnostics, and operational analytics.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-purple.svg)](https://modelcontextprotocol.io/)

---

## What This Does

Ask Claude Desktop questions about your ISPN Helpdesk in natural language:

**Customer Support:**
```
"Look up customer with phone 555-123-4567"
"Show me all tickets for customer 999"
"What's the status of escalation 12345?"
```

**Daily Operations:**
```
"Good morning, how are we doing?"
"Show me open escalations from today"
"Which services need attention this week?"
```

**Analytics & Planning:**
```
"What's our ticket volume trend for the last month?"
"When are our peak times and how should I staff?"
"Which customers need proactive outreach?"
```

**Network Diagnostics:**
```
"What IP does customer 999 have?"
"Check DHCP pool Pool_A utilization"
```

---

## Features

### 14 MCP Tools

**Customer Tools (3):**
- Customer lookup by ID/phone/email
- Get full customer details
- List customer ticket history

**Ticket Tools (3):**
- Search tickets by date range
- List escalations (open/closed)
- Get escalation details

**Network Tools (1):**
- List DHCP reservations

**Verification Tools (2):**
- List categories and services
- Check account existence

**Analytics Tools (5):**
- Ticket volume analysis with trends
- Escalation performance metrics
- Service health dashboard
- Time pattern analysis (staffing optimization)
- Customer pattern detection (proactive support)

See [AVAILABLE_QUERIES.md](AVAILABLE_QUERIES.md) for complete query reference.

### Architecture

- **Read-Only:** No write operations to helpdesk
- **Stdio Transport:** Standard MCP protocol
- **Type-Safe:** Zod schema validation for all inputs
- **Structured Logging:** Pino with stderr output
- **Error Handling:** Graceful failures with detailed messages
- **Analytics Engine:** Statistical analysis and trend detection

See [DESIGN.md](DESIGN.md) for technical architecture.

---

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Claude Desktop app

### Installation

**1. Clone and install:**
```bash
git clone <repo-url>
cd ispn-helpdesk-mcp
npm install
```

**2. Build:**
```bash
npm run build
```

**3. Configure Claude Desktop:**

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "ispn-helpdesk": {
      "command": "node",
      "args": ["/absolute/path/to/ispn-helpdesk-mcp/dist/mcp-server.js"],
      "env": {
        "ISPN_API_URL": "https://api.helpdesk.ispn.net/exec.pl",
        "ISPN_AUTH_CODE": "your-auth-code-here"
      }
    }
  }
}
```

**4. Restart Claude Desktop**

That's it! The MCP server will start automatically when Claude Desktop launches.

---

## Configuration

### Environment Variables

Set in Claude Desktop config or `.env` file:

```bash
# Required
ISPN_API_URL=https://api.helpdesk.ispn.net/exec.pl
ISPN_AUTH_CODE=your-auth-code-here

# Optional (defaults shown)
NODE_ENV=production
LOG_LEVEL=info
```

### Getting Your Auth Code

Contact your ISPN administrator to obtain an API authentication code.

---

## Usage Examples

### Morning Standup

```
User: "Good morning, how are we doing?"

Claude: (Uses ispn_analytics_service_health)

📊 Service Health Dashboard - Nov 14, 2025 8:00 AM

OVERALL: ⚠️ NEEDS ATTENTION (Score: 68)

Services:
✅ Email (92) - 15 tickets, 1 escalation, 3.2hr avg resolution
✅ VoIP (88) - 8 tickets, 0 escalations
⚠️ Internet (65) - 28 tickets ↑, 4 escalations, 14.5hr avg
🔴 DHCP (42) - CRITICAL: 12 tickets, 8 escalations

Top Issues:
1. URGENT: DHCP Pool_A expansion needed
2. Internet escalations up 60% vs last week

Staffing: Recommend 8 techs for peak (10am-2pm)
```

### Customer Support

```
User: "Look up customer with phone 555-123-4567"

Claude: (Uses ispn_customer_lookup)
Found customer:
- Billing ID: 999
- Name: John Smith
- Email: jsmith@example.com
- Service: Fiber 1000
```

### Performance Review

```
User: "Show me ticket volume trends for the last month"

Claude: (Uses ispn_analytics_ticket_volume)

📈 Ticket Volume Analysis - Last 30 Days

Total: 1,247 tickets (+12% vs previous month) ↑
Daily Average: 41.6 tickets
Trend: INCREASING

By Service:
- Internet: 456 tickets (36.6%) - trending UP
- Email: 312 tickets (25.0%) - stable
- VoIP: 289 tickets (23.2%) - trending DOWN
- Other: 190 tickets (15.2%)

Recommendation: Monitor Internet trend - investigate root cause
```

---

## Development

### Project Structure

```
ispn-helpdesk-mcp/
├── src/
│   ├── services/          # ISPN API client, category mapper
│   ├── tools/             # 14 MCP tool implementations
│   ├── utils/             # Analytics helpers, logging, phone normalization
│   ├── mcp-server.ts      # MCP server entry point
│   └── types.d.ts         # TypeScript definitions
├── dist/                  # Compiled JavaScript (generated by build)
├── archive/               # Historical documentation
├── package.json
├── tsconfig.json
├── README.md              # This file
├── AVAILABLE_QUERIES.md   # Complete query reference
└── DESIGN.md              # Architecture and design
```

### Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode (rebuild on changes)
npm run watch

# Type check
npm run type-check

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Manual testing with MCP inspector
npx @modelcontextprotocol/inspector node dist/mcp-server.js

# Test individual tool
# (Use Claude Desktop or MCP inspector)
```

---

## Troubleshooting

### MCP Server Not Starting

**Check logs:**
```bash
tail -f ~/Library/Logs/Claude/mcp-server-ispn-helpdesk.log
```

**Common issues:**
- Missing `ISPN_API_URL` or `ISPN_AUTH_CODE` in config
- Incorrect absolute path in Claude Desktop config
- Build failed (`npm run build` not executed)
- Node.js version < 18

### Tools Not Appearing

**Verify configuration:**
1. Restart Claude Desktop completely (Quit and reopen)
2. Check config path: `~/Library/Application Support/Claude/claude_desktop_config.json`
3. Ensure path points to `dist/mcp-server.js` (not `src/`)
4. Run `npm run build` again

### API Connection Errors

**Check authentication:**
- Verify `ISPN_AUTH_CODE` is correct
- Test API manually:
  ```bash
  curl "https://api.helpdesk.ispn.net/exec.pl?auth=YOUR_CODE&cmd=listsupportsvc"
  ```
- Check network connectivity to ISPN API

### Slow Queries

**Analytics tools process large datasets:**
- 7-30 day ranges: 2-5 seconds
- 90+ day ranges: 5-10 seconds
- Consider smaller date ranges for faster results
- Future enhancement: Add caching layer

---

## API Reference

See [AVAILABLE_QUERIES.md](AVAILABLE_QUERIES.md) for:
- Complete list of 14 tools
- Parameter documentation
- Example queries
- Use case guides

See [DESIGN.md](DESIGN.md) for:
- Technical architecture
- Data flow diagrams
- Implementation details

---

## What's Not Included

This is a **read-only query interface**. It does not:
- ❌ Create or modify tickets
- ❌ Update customer information
- ❌ Change escalation status
- ❌ Modify DHCP reservations
- ❌ Track individual agent performance (ISPN doesn't store this)

For write operations, use the ISPN Helpdesk interface directly.

---

## Technology Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.9
- **MCP SDK:** @modelcontextprotocol/sdk 1.0+
- **Validation:** Zod 3.25
- **Logging:** Pino 10.1
- **HTTP Client:** Axios 1.8
- **XML Parsing:** fast-xml-parser 5.0

---

## Support

**Documentation:**
- [README.md](README.md) - This file
- [AVAILABLE_QUERIES.md](AVAILABLE_QUERIES.md) - Query reference
- [DESIGN.md](DESIGN.md) - Technical documentation
- [archive/](archive/) - Historical implementation docs

**Logs:**
- macOS: `~/Library/Logs/Claude/mcp-server-ispn-helpdesk.log`
- Windows: `%APPDATA%\Claude\logs\mcp-server-ispn-helpdesk.log`

**Issues:**
- Check logs first
- Verify configuration
- Test API connectivity

---

## Version History

**v1.0.0** (2025-11-14)
- Initial release
- 9 read-only query tools
- 5 analytics tools
- Full Claude Desktop integration
- Comprehensive documentation

---

## License

ISC License - See LICENSE file for details

---

**Transform your ISPN Helpdesk data into actionable insights with natural language queries.**
