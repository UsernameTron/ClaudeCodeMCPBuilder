# ISPN Helpdesk Bridge MCP Server

Production-ready MCP server for seamless ElevenLabs agent handoffs to helpdesk tickets with intelligent deduplication and comprehensive error handling.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

---

## Overview

The ISPN Helpdesk Bridge MCP Server provides two independent server processes:

1. **HTTP API Server** - Webhook endpoints for ElevenLabs agent handoffs
2. **MCP Server** - Model Context Protocol tools for Claude Desktop integration

Both servers share core services (ticket deduplication, helpdesk integration, validation) while operating independently.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ISPN Helpdesk Bridge                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐         ┌──────────────────┐          │
│  │  HTTP API       │         │  MCP Server      │          │
│  │  Server         │         │  (stdio)         │          │
│  │  (Port 3000)    │         │                  │          │
│  └────────┬────────┘         └────────┬─────────┘          │
│           │                           │                      │
│           └───────────┬───────────────┘                      │
│                       │                                      │
│           ┌───────────▼───────────┐                         │
│           │   Shared Services     │                         │
│           ├───────────────────────┤                         │
│           │ • Ticket Store (TTL)  │                         │
│           │ • Idempotency Store   │                         │
│           │ • Helpdesk Client     │                         │
│           │ • Note Processor      │                         │
│           │ • Validators          │                         │
│           └───────────┬───────────┘                         │
│                       │                                      │
│           ┌───────────▼───────────┐                         │
│           │  Helpdesk System API  │                         │
│           └───────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

### HTTP API Server
- ✅ **Dual Authentication** - Shared token + HMAC signature validation
- ✅ **Rate Limiting** - 10 requests/second per client
- ✅ **Idempotency** - Duplicate request detection (15-minute window)
- ✅ **Replay Protection** - 5-minute timestamp window + signature deduplication
- ✅ **Health Endpoints** - Liveness (`/healthz`) and readiness (`/readyz`) probes
- ✅ **Structured Logging** - Pino with PII redaction
- ✅ **Graceful Shutdown** - Clean resource cleanup

### MCP Server
- ✅ **5 MCP Tools** - Complete helpdesk integration for Claude Desktop
- ✅ **Stdio Transport** - Standard MCP protocol implementation
- ✅ **Tool Definitions** - Zod schema validation for all tools
- ✅ **Error Handling** - Structured error responses
- ✅ **Request Logging** - Detailed tool execution logs

### Core Services
- ✅ **Ticket Deduplication** - Find existing tickets by oaKey or caller+category
- ✅ **4-Hour TTL Cache** - Automatic ticket cache expiration
- ✅ **Note Rendering** - 4-line formatted note generation
- ✅ **Input Validation** - Zod schemas with TypeScript type inference
- ✅ **E.164 Phone Validation** - libphonenumber-js integration
- ✅ **Category/Reason Inference** - Automatic classification from notes

---

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Clone repository
git clone https://github.com/yourorg/ispn-helpdesk-mcp.git
cd ispn-helpdesk-mcp

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Update with your configuration
```

### Configuration

**Required Environment Variables:**

```bash
# Authentication
AUTH_TOKEN=your-secret-token-here          # Generate with: openssl rand -hex 32
WEBHOOK_SECRET=your-webhook-secret-here    # Generate with: openssl rand -hex 32

# Helpdesk API
HELPDESK_API_URL=https://helpdesk.example.com/api/v1
HELPDESK_API_KEY=your-helpdesk-api-key-here
```

See [.env.example](.env.example) for all configuration options.

### Development

```bash
# Start HTTP API server (development mode)
npm run dev:http

# Start MCP server (development mode)
npm run dev:mcp

# Start both servers
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Type check
npm run type-check
```

### Production

```bash
# Build for production
npm run build

# Start HTTP API server
npm run start:http

# Start MCP server
npm run start:mcp
```

See [Deployment Guide](docs/DEPLOYMENT.md) for production deployment instructions.

---

## API Documentation

### HTTP Endpoints

#### Health Checks

**Liveness Probe:**
```http
GET /healthz
```

**Readiness Probe:**
```http
GET /readyz
```

#### OA Handoff

**Create or find ticket:**
```http
POST /ingest/oa-handoff
Content-Type: application/json
x-auth-token: your-token

{
  "note": "Category: WiFi\nReason: CallerRequested\nSummary: Customer unable to connect\nConfidence: 0.85",
  "category": "WiFi",
  "escalationReason": "CallerRequested",
  "confidence": "0.85",
  "callerNumber": "+12345678900",
  "oaKey": "oa-12345",
  "source": "OutageAgent"
}
```

**Response:**
```json
{
  "status": "ok",
  "created": true,
  "ticketId": "TKT-1000",
  "ticketUrl": "https://helpdesk.example.com/tickets/1000",
  "category": "WiFi",
  "escalationReason": "CallerRequested",
  "confidence": "0.85",
  "echo": {
    "oaKey": "oa-12345",
    "callerNumber": "+12345678900"
  }
}
```

See [OpenAPI Specification](docs/openapi.yaml) for complete API documentation.

---

## MCP Tools Reference

### 1. helpdesk.create_ticket

Create a new helpdesk ticket (bypasses deduplication).

**Input:**
- `description` (required): Ticket description (10-1000 chars)
- `category` (required): Outage, WiFi, CGNAT, Wiring, EquipmentReturn, Unknown
- `escalationReason` (required): CallerRequested, TwoStepsNoResolve, OutOfScope, SafetyRisk, BillingOrAccount, Other
- `callerNumber` (optional): E.164 phone number
- `source` (optional): ATOM, OutageAgent, Other
- `metadata` (optional): Additional metadata object

**Output:**
```json
{
  "success": true,
  "ticketId": "TKT-1000",
  "ticketUrl": "https://helpdesk.example.com/tickets/1000",
  "category": "WiFi",
  "escalationReason": "TwoStepsNoResolve"
}
```

### 2. helpdesk.append_note

Append a note to an existing helpdesk ticket.

**Input:**
- `ticketId` (required): Ticket ID
- `note` (required): Note content (10-1000 chars)
- `author` (optional): Note author (defaults to "ISPN-Agent")

**Output:**
```json
{
  "success": true,
  "message": "Note appended successfully",
  "ticketId": "TKT-1000"
}
```

### 3. helpdesk.find_or_create_ticket

Find existing ticket or create new one (with deduplication).

**Input:**
- `description` (required): Ticket description (10-1000 chars)
- `category` (required): Ticket category
- `escalationReason` (required): Escalation reason
- `callerNumber` (optional): E.164 phone number (used for deduplication)
- `oaKey` (optional): Outage Agent key (used for deduplication)
- `source` (optional): Source system

**Output:**
```json
{
  "success": true,
  "created": false,
  "ticketId": "TKT-1000",
  "ticketUrl": "https://helpdesk.example.com/tickets/1000",
  "message": "Existing ticket found (deduplication)"
}
```

### 4. ingest.render_note

Render a 4-line formatted note from components.

**Input:**
- `category` (required): Category value
- `escalationReason` (required): Escalation reason value
- `summary` (required): Summary text (10-250 chars)
- `confidence` (required): Confidence score (0.0-1.0)

**Output:**
```json
{
  "success": true,
  "note": "Category: WiFi\nReason: TwoStepsNoResolve\nSummary: Test\nConfidence: 0.85",
  "charCount": 85,
  "lineCount": 4
}
```

### 5. ingest.oa_handoff

Complete OA handoff workflow (render note + find/create ticket).

**Input:**
- `note` (required): 4-line formatted note (≤350 chars)
- `category` (optional): Auto-inferred if missing
- `escalationReason` (optional): Auto-inferred if missing
- `confidence` (optional): Defaults to "0.0"
- `callerNumber` (optional): E.164 phone number
- `oaKey` (optional): Outage Agent key
- `source` (optional): Defaults to "OutageAgent"

**Output:**
```json
{
  "success": true,
  "created": true,
  "ticketId": "TKT-1003",
  "ticketUrl": "https://helpdesk.example.com/tickets/1003",
  "category": "WiFi",
  "escalationReason": "TwoStepsNoResolve",
  "confidence": "0.85",
  "echo": {
    "oaKey": "oa-12345",
    "callerNumber": "+12345678900"
  }
}
```

See [Integration Guide](docs/INTEGRATION.md) for setup instructions.

---

## Development

### Project Structure

```
ispn-helpdesk-mcp/
├── src/
│   ├── errors/           # Custom error classes
│   ├── middleware/       # Express middleware (auth, rate-limit, idempotency)
│   ├── routes/           # HTTP route handlers
│   ├── schemas/          # Zod validation schemas
│   ├── services/         # Core services (ticket-store, helpdesk-client, etc.)
│   ├── tools/            # MCP tool implementations
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── http-server.ts    # HTTP API server entry point
│   └── mcp-server.ts     # MCP server entry point
├── tests/
│   └── unit/             # Unit tests (96 tests, 100% passing)
├── docs/
│   ├── openapi.yaml      # OpenAPI 3.0 specification
│   ├── DEPLOYMENT.md     # Deployment guide
│   └── INTEGRATION.md    # Integration guide
├── dist/                 # Compiled JavaScript (generated)
├── .env.example          # Environment template
├── package.json          # NPM configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

### Technology Stack

- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.9
- **HTTP Framework:** Express 5.1
- **MCP SDK:** @modelcontextprotocol/sdk 1.21
- **Validation:** Zod 3.25
- **Logging:** Pino 10.1
- **Testing:** Vitest 4.0
- **Phone Validation:** libphonenumber-js 1.12

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run specific test file
npm test tests/unit/mcp-tools.test.ts
```

**Test Coverage:**
- 96 unit tests
- 100% passing
- Key areas: Tools (21 tests), Services (13 tests), Validators (20 tests), Note Processor (22 tests)

### Code Quality

```bash
# Type check
npm run type-check

# Lint (if configured)
npm run lint

# Build
npm run build

# Clean
npm run clean
```

---

## Deployment

### Quick Deploy (PM2)

```bash
# Build
npm run build

# Install PM2
npm install -g pm2

# Start services
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

### Docker (TODO)

```dockerfile
# Dockerfile (future enhancement)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
COPY .env.production ./.env
CMD ["node", "dist/http-server.js"]
```

See [Deployment Guide](docs/DEPLOYMENT.md) for complete deployment instructions including:
- Environment setup
- Process management (PM2, systemd)
- Reverse proxy (nginx)
- SSL/TLS configuration
- Monitoring and logging
- Scaling strategies

---

## Troubleshooting

### Common Issues

**Issue:** Authentication fails
- Verify `AUTH_TOKEN` in `.env` matches request header
- Check token is not quoted in `.env` file
- Ensure `.env` file is loaded (run `npm run dev:http` from project root)

**Issue:** MCP tools not showing in Claude Desktop
- Verify config path: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- Check absolute path in config points to `dist/mcp-server.js`
- Ensure `npm run build` completed successfully
- Restart Claude Desktop completely

**Issue:** Rate limit errors
- Default: 10 requests/second per client
- Configure `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` in `.env`
- Implement retry logic with exponential backoff

See [Integration Guide - Troubleshooting](docs/INTEGRATION.md#troubleshooting) for more solutions.

---

## Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes
4. **Test** your changes (`npm test`)
5. **Commit** your changes (`git commit -m 'Add amazing feature'`)
6. **Push** to the branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Code Style

- Use TypeScript strict mode
- Follow existing code formatting
- Add tests for new features
- Update documentation as needed
- Use conventional commit messages

---

## License

ISC License

Copyright (c) 2025

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

## Support

- **Documentation:** [docs/](docs/)
- **Issues:** https://github.com/yourorg/ispn-helpdesk-mcp/issues
- **Email:** support@example.com

---

## Roadmap

### Completed (v1.0.0)
- ✅ HTTP API server with webhooks
- ✅ MCP server with 5 tools
- ✅ Ticket deduplication
- ✅ Dual authentication (token + HMAC)
- ✅ Rate limiting and idempotency
- ✅ Comprehensive documentation

### Planned (v1.1.0)
- ⏳ Redis support for multi-instance deployments
- ⏳ Prometheus metrics endpoint
- ⏳ Docker and Kubernetes manifests
- ⏳ Real helpdesk client implementations (Zendesk, Freshdesk, etc.)
- ⏳ GraphQL API (optional)
- ⏳ WebSocket support for real-time updates

### Planned (v2.0.0)
- ⏳ Admin dashboard
- ⏳ Ticket analytics and reporting
- ⏳ Multi-tenant support
- ⏳ Advanced ML-based categorization

---

**Built with ❤️ for seamless agent-to-human handoffs**
