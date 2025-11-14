# ISPN Helpdesk MCP - Read-Only Query Interface

**Claude Desktop integration for ISPN Helpdesk API queries**

This Model Context Protocol (MCP) server provides read-only access to ISPN Helpdesk data through Claude Desktop, enabling support staff to query customer information, tickets, and network details through natural language.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-purple.svg)](https://modelcontextprotocol.io/)

---

## Features

### 🔍 **Read-Only by Design**
- No data modification capabilities
- Safe for support staff access
- Complete audit trail through ISPN auth codes

### 👥 **Customer Queries**
- Look up customers by billing ID, phone, or email
- View full customer details with contacts and notes
- List customer ticket history

### 🎫 **Ticket & Escalation Queries**
- Search tickets by date range
- List escalations (open/closed)
- View escalation details

### 🌐 **Network Information**
- View DHCP reservations
- Query by customer, pool, or IP address

### ✅ **Verification Tools**
- Check username availability
- Verify mailbox existence
- List available ticket categories

---

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Claude Desktop installed
- ISPN API access credentials

### Installation

```bash
# Clone the repository
cd ispn-helpdesk-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration

1. **Get your ISPN auth code** from your administrator

2. **Configure Claude Desktop**

   Edit your Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

   Add the ISPN MCP configuration:

   ```json
   {
     "mcpServers": {
       "ispn-helpdesk": {
         "command": "node",
         "args": [
           "/absolute/path/to/ispn-helpdesk-mcp/dist/mcp-server.js"
         ],
         "env": {
           "ISPN_API_URL": "https://api.helpdesk.ispn.net/exec.pl",
           "ISPN_AUTH_CODE": "your-unique-auth-code-here",
           "LOG_LEVEL": "info"
         }
       }
     }
   }
   ```

3. **Restart Claude Desktop**

---

## Usage Examples

Once configured, interact with ISPN through Claude Desktop using natural language:

### Customer Lookup

```
You: "Look up customer with billing ID 12345"

Claude will use: ispn.customer.get_details
Returns: Full customer information including contact details
```

```
You: "Find customer with phone number 555-123-4567"

Claude will use: ispn.customer.lookup
Returns: Customer matched by phone number
```

```
You: "Search for customer email john@example.com"

Claude will use: ispn.customer.lookup
Returns: Customer information if email exists
```

### Ticket Queries

```
You: "Show me all tickets for customer 12345"

Claude will use: ispn.customer.list_tickets
Returns: List of all tickets for that customer
```

```
You: "Find all tickets created yesterday"

Claude will use: ispn.ticket.search
Returns: Tickets created in the specified date range
```

```
You: "List all open escalations from last week"

Claude will use: ispn.escalation.list
Returns: Open escalations in date range
```

### Account Verification

```
You: "Check if username jdoe exists"

Claude will use: ispn.account.check
Returns: Existence status and account type
```

```
You: "Is mailbox support@example.com active?"

Claude will use: ispn.account.check
Returns: Mailbox status and associated billing ID
```

### Category Lookups

```
You: "What ticket categories are available?"

Claude will use: ispn.query.list_categories
Returns: List of all services and categories
```

### Network Queries

```
You: "Show DHCP reservations for customer 12345"

Claude will use: ispn.dhcp.list
Returns: DHCP entries for that customer
```

---

## Available Tools

### Customer Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `ispn.customer.lookup` | Find customer by billid/phone/email | `billid`, `phone`, or `email` |
| `ispn.customer.get_details` | Get full customer information | `billid` (required) |
| `ispn.customer.list_tickets` | List customer's ticket history | `billid` (required), `limit`, `ticketid` |

### Ticket Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `ispn.ticket.search` | Search tickets by date range | `begin` (required), `end`, `hour` |
| `ispn.escalation.list` | List escalations by date/status | `begin` (required), `end`, `status`, `hour` |
| `ispn.escalation.get` | Get escalation details | `escid` (required) |

### Network Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `ispn.dhcp.list` | List DHCP reservations | `billid`, `pool`, `poolstatus`, `limit`, `ip` |

### Verification Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `ispn.query.list_categories` | List available categories | `refresh` |
| `ispn.account.check` | Check username/email existence | `username` or `email` |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│         Claude Desktop User                 │
└──────────────┬──────────────────────────────┘
               │ Natural Language
               ▼
┌─────────────────────────────────────────────┐
│         ISPN Helpdesk MCP Server            │
│                                             │
│  ┌─────────────────────────────────────┐  │
│  │  9 Read-Only Query Tools            │  │
│  ├─────────────────────────────────────┤  │
│  │  • Customer Lookup (3 tools)        │  │
│  │  • Ticket Queries (3 tools)         │  │
│  │  • Network Info (1 tool)            │  │
│  │  • Verification (2 tools)           │  │
│  └──────────────┬──────────────────────┘  │
│                 │                           │
│  ┌──────────────▼──────────────────────┐  │
│  │  ISPN Client & Utilities            │  │
│  ├─────────────────────────────────────┤  │
│  │  • XML/Text Response Parser         │  │
│  │  • Phone Number Normalizer          │  │
│  │  • Category Mapper (24h cache)      │  │
│  └──────────────┬──────────────────────┘  │
└─────────────────┼─────────────────────────┘
                  │ HTTPS GET/POST
                  ▼
┌─────────────────────────────────────────────┐
│     ISPN Helpdesk API (exec.pl)             │
│     https://api.helpdesk.ispn.net           │
└─────────────────────────────────────────────┘
```

---

## Security

### Authentication
- Each user has their own `ISPN_AUTH_CODE`
- Credentials configured per Claude Desktop instance
- No shared authentication tokens

### Read-Only Access
- **No write operations** - All tools are query-only
- Cannot create, modify, or delete any data
- Safe for support staff without elevated privileges

### Data Protection
- API credentials stored in Claude Desktop config (not version control)
- Recommended: `chmod 600` on config files
- Audit trail through individual ISPN auth codes

### Best Practices
1. Never commit `.env` files to version control
2. Each user should have unique ISPN auth code
3. Rotate auth codes quarterly or after security incidents
4. Monitor ISPN API logs for unusual query patterns

---

## Troubleshooting

### MCP Not Showing in Claude Desktop

**Issue**: Tools don't appear in Claude Desktop

**Solutions**:
1. Verify config path is correct for your OS
2. Ensure absolute path to `dist/mcp-server.js`
3. Check that `npm run build` completed successfully
4. Restart Claude Desktop completely (quit and reopen)
5. Check Claude Desktop logs for errors

### Authentication Errors

**Issue**: `ISPN API error: Unauthorized`

**Solutions**:
1. Verify `ISPN_AUTH_CODE` is correct
2. Contact ISPN administrator to validate auth code
3. Check that API URL is correct: `https://api.helpdesk.ispn.net/exec.pl`
4. Test auth code directly with curl:
   ```bash
   curl "https://api.helpdesk.ispn.net/exec.pl?auth=YOUR_CODE&cmd=listsupportsvc"
   ```

### Customer Not Found

**Issue**: Phone lookup returns no results

**Solutions**:
1. Phone lookup searches all customers (may be slow)
2. Try lookup by billing ID or email instead
3. Verify phone format matches ISPN database (10 digits)
4. Check that customer exists in ISPN system

### Empty Results

**Issue**: Queries return empty arrays

**Solutions**:
1. Verify customer/ticket exists in ISPN
2. Check date range format (YYYY-MM-DD)
3. Ensure billing ID is correct
4. Try broader search parameters

---

## Development

### Project Structure

```
ispn-helpdesk-mcp/
├── src/
│   ├── services/
│   │   ├── ispn-client.ts           # Main ISPN API client
│   │   └── category-mapper.ts       # Category caching service
│   ├── tools/
│   │   ├── ispn-customer-*.ts       # Customer query tools (3)
│   │   ├── ispn-ticket-*.ts         # Ticket query tools (2)
│   │   ├── ispn-escalation-*.ts     # Escalation tools (2)
│   │   ├── ispn-dhcp-list.ts        # Network query tool
│   │   ├── ispn-query-categories.ts # Metadata tool
│   │   └── ispn-account-check.ts    # Verification tool
│   ├── utils/
│   │   ├── ispn-parser.ts           # XML/text response parser
│   │   ├── phone-normalizer.ts      # Phone format converter
│   │   └── logger.ts                # Pino logger
│   └── mcp-server.ts                # MCP server entry point
├── dist/                            # Compiled JavaScript (gitignored)
├── .env.example                     # Environment template
└── package.json                     # Dependencies & scripts
```

### Building

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Development mode (auto-rebuild)
npm run dev:mcp

# Type checking
npm run type-check

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Test MCP connection
node dist/mcp-server.js
# Should start without errors, waiting for stdio input

# Test with MCP Inspector (if installed)
npx @modelcontextprotocol/inspector node dist/mcp-server.js
```

---

## API Reference

### ISPN API Format

The ISPN Helpdesk API uses CGI-style URL parameters:

```
https://api.helpdesk.ispn.net/exec.pl?auth=CODE&cmd=COMMAND&param=value
```

**Response Formats**:
- **Text**: `1; OK; Message` (success) or `0; Error message` (failure)
- **XML**: Structured data for list queries

**Example**:
```bash
# List categories
curl "https://api.helpdesk.ispn.net/exec.pl?auth=ABC123&cmd=listsupportcat"

# Get customer
curl "https://api.helpdesk.ispn.net/exec.pl?auth=ABC123&cmd=list&billid=999"
```

### Phone Number Formats

- **ISPN requires**: 10 digits (e.g., `1234567890`)
- **MCP accepts**: E.164 (e.g., `+11234567890`), formatted (e.g., `(123) 456-7890`)
- **Conversion**: Automatic via `phone-normalizer.ts`

### Date Formats

- **ISPN requires**: `YYYY-MM-DD` or `YYYY-MM-DD HH:MM:SS`
- **Examples**:
  - `2025-01-15` (date only)
  - `2025-01-15 14:30:00` (date and time)

---

## Changelog

### v2.0.0 - Read-Only ISPN Integration (Current)
- Replaced webhook-based architecture with direct ISPN API queries
- Added 9 read-only query tools for Claude Desktop
- Implemented XML/text response parsing
- Added phone number normalization
- Added category mapping with 24-hour cache
- Removed write operations (tickets, notes, customer management)

### v1.0.0 - ElevenLabs Webhook Integration (Legacy)
- HTTP API server for ElevenLabs webhooks
- 5 MCP tools for ticket creation and management
- Mock helpdesk client for development

---

## Support

### Documentation
- [ISPN API Documentation](./HelpdeskAPI.md)
- [MCP Protocol Docs](https://modelcontextprotocol.io/)
- [Claude Desktop Setup](https://claude.com/claude-code)

### Issues
- Report bugs via GitHub Issues
- Include Claude Desktop logs and error messages
- Provide anonymized query examples

### Contact
- Email: support@example.com
- ISPN Administrator: Contact for auth code requests

---

## License

ISC License - See [LICENSE](./LICENSE) file

---

## Acknowledgments

- Built with [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- Powered by [ISPN Helpdesk API](https://ispn.net/)
- Designed for [Claude Desktop](https://claude.com/)

---

**🎉 You're all set! Start querying ISPN Helpdesk through Claude Desktop.**
