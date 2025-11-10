# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This repository is a **complete MCP server development toolkit** that combines:

1. **Comprehensive MCP Documentation**: Full technical knowledge base for the Model Context Protocol (MCP) - an open standard that enables LLM applications to integrate with external tools and data sources
2. **Code Generation Tools**: CLI-based server generator with production-ready templates
3. **Example Servers**: Pre-configured examples demonstrating different MCP patterns
4. **Testing Utilities**: Test client and helpers for validating MCP implementations

The repository transforms MCP documentation into working code, allowing developers to quickly scaffold, test, and deploy MCP servers following Anthropic's best practices.

### What This Repository Contains

**Documentation:**
- Complete MCP specification (version 2025-06-18)
- Implementation patterns and best practices
- Protocol architecture and communication flows
- Server-side primitives (Resources, Prompts, Tools)
- Client-side features (Sampling, Roots, Elicitation)

**Code Generation:**
- Interactive CLI for creating new MCP servers
- Production-ready templates with security built-in
- Support for tools, resources, prompts, or mixed servers
- Automatic configuration generation

**Examples:**
- Weather server (tools-focused, external API integration)
- Filesystem server (resources-focused, security patterns)
- Database server (mixed, all three primitives)

**Testing:**
- MCP test client for integration testing
- Assertion helpers for common validation patterns
- Security testing utilities

## Repository Structure

```
MCP Building/
├── src/
│   ├── cli/
│   │   └── create-server.ts          # Interactive CLI for server generation
│   ├── generator/
│   │   ├── index.ts                  # Core generation logic
│   │   ├── types.ts                  # TypeScript interfaces
│   │   └── templates/                # Code generation templates
│   │       ├── server-index.ts       # Main server entry point template
│   │       ├── tools.ts              # Tools module template
│   │       ├── resources.ts          # Resources module template
│   │       ├── prompts.ts            # Prompts module template
│   │       ├── tests.ts              # Test file template
│   │       ├── readme.ts             # Generated README template
│   │       ├── package.ts            # package.json generator
│   │       └── tsconfig.ts           # tsconfig.json generator
│   ├── examples/
│   │   ├── index.ts                  # Example configurations export
│   │   ├── weather-server.ts         # Weather server example (tools)
│   │   ├── filesystem-server.ts      # Filesystem server example (resources)
│   │   └── database-server.ts        # Database server example (mixed)
│   └── testing/
│       ├── index.ts                  # Testing utilities export
│       ├── mcp-test-client.ts        # Test client implementation
│       └── test-helpers.ts           # Assertion and validation helpers
├── docs/
│   ├── ClaudeMCP.md                  # Primary MCP technical documentation
│   └── MCP Technical Knowledge Base.pdf  # PDF version with citations
├── dist/                             # Compiled TypeScript output
├── generated-servers/                # Output directory for generated servers
├── package.json                      # Project dependencies
├── tsconfig.json                     # TypeScript configuration
├── README.md                         # Repository overview
└── CLAUDE.md                         # This file - Claude Code guidance

```

## Key Documentation Files

### ClaudeMCP.md
The primary technical knowledge base containing:
- Protocol fundamentals and architecture
- Detailed component specifications
- JSON-RPC messaging patterns
- Security and trust model
- Implementation examples in TypeScript
- Best practices for each MCP feature

### MCP Technical Knowledge Base for Claude Code Generation.pdf
Comprehensive PDF documentation covering the same content with extensive citations and cross-references to official MCP documentation.

## Key Source Files

### Generator ([src/generator/](src/generator/))
- [index.ts](src/generator/index.ts:1) - Main generation logic with file creation, directory setup
- [types.ts](src/generator/types.ts:1) - TypeScript interfaces for configuration and definitions

### Templates ([src/generator/templates/](src/generator/templates/))
All templates generate production-ready code with:
- Security features (input validation, path sanitization, rate limiting)
- Error handling with actionable messages
- MCP spec compliance (2025-06-18)
- TypeScript strict mode
- Comprehensive documentation

### Examples ([src/examples/](src/examples/))
- [weather-server.ts](src/examples/weather-server.ts:1) - Demonstrates tools with external API integration
- [filesystem-server.ts](src/examples/filesystem-server.ts:1) - Demonstrates resources with security patterns
- [database-server.ts](src/examples/database-server.ts:1) - Demonstrates all three primitives (tools, resources, prompts)

### Testing ([src/testing/](src/testing/))
- [mcp-test-client.ts](src/testing/mcp-test-client.ts:1) - Full-featured test client for MCP servers
- [test-helpers.ts](src/testing/test-helpers.ts:1) - Assertions for tools, resources, prompts, security

## Available Examples

### Weather Server (Tools-Focused)
**Configuration:** [src/examples/weather-server.ts](src/examples/weather-server.ts:1)

Demonstrates:
- External API integration (OpenWeatherMap)
- Structured output schemas
- Rate limiting for API calls
- Error handling with actionable messages

**Tools:**
- `get_current_weather` - Real-time weather conditions
- `get_forecast` - Multi-day weather forecasts

**Best For:** Learning how to integrate external APIs and implement rate limiting

### Filesystem Server (Resources-Focused)
**Configuration:** [src/examples/filesystem-server.ts](src/examples/filesystem-server.ts:1)

Demonstrates:
- Path sanitization (prevents directory traversal)
- Root boundary enforcement
- Resource subscriptions (file watching)
- Pagination for large listings

**Resources:**
- `file:///{path}` - Read file contents
- `dir:///{path}` - List directory contents
- `file:///{path}/metadata` - File information

**Best For:** Learning security patterns and resource subscriptions

### Database Server (Mixed - All Primitives)
**Configuration:** [src/examples/database-server.ts](src/examples/database-server.ts:1)

Demonstrates:
- Tools for database operations
- Resources for schema inspection
- Prompts for SQL generation
- Integration of all three primitives

**Tools:**
- `execute_query` - Run SELECT queries
- `insert_data` - Insert records
- `update_data` - Update records

**Resources:**
- `db://schema` - Complete schema
- `db://tables` - Table list
- `db://table/{name}` - Table details

**Prompts:**
- `generate-sql` - Natural language to SQL
- `explain-query` - SQL explanation
- `optimize-query` - Query optimization

**Best For:** Understanding how to combine all MCP primitives

## Core MCP Architecture

### Three-Tier Model
1. **Host**: The LLM application (e.g., Claude Desktop) managing connections and enforcing user consent
2. **Client**: Connector maintaining 1:1 session with a server, handling message routing
3. **Server**: Standalone program exposing capabilities (resources, prompts, tools)

### Communication Protocol
- **Transport**: stdio (local) or HTTP with SSE (remote)
- **Format**: JSON-RPC 2.0
- **Version**: Date-based (2025-06-18)
- **Connection Lifecycle**: initialize → capabilities exchange → initialized notification

## MCP Feature Primitives

### Server-Side Features

#### Resources (Application-Controlled)
- **Purpose**: Expose read-only data/content as additional context for LLM
- **URI Format**: `[protocol]://[host]/[path]` (e.g., `file:///`, `postgres://`)
- **Content Types**: `text` (UTF-8) or `blob` (base64)
- **Key Methods**:
  - `resources/list` - List available resources with pagination support
  - `resources/read` - Retrieve resource content by URI
  - `resources/subscribe` - Subscribe to resource updates (optional)
- **Change Notifications**: `notifications/resources/updated`, `notifications/resources/list_changed`

#### Prompts (User-Controlled)
- **Purpose**: Pre-defined prompt templates/workflows triggered by users
- **Structure**: name, title, description, arguments[]
- **Key Methods**:
  - `prompts/list` - List available prompts
  - `prompts/get` - Get prompt content with arguments
- **Features**: Support dynamic arguments, embedded resource references, multi-turn sequences

#### Tools (Model-Controlled)
- **Purpose**: Executable actions the LLM can invoke (with user approval)
- **Schema**: name, title, description, inputSchema (JSON Schema), outputSchema (optional)
- **Key Methods**:
  - `tools/list` - List available tools
  - `tools/call` - Execute tool with arguments
- **Annotations**:
  - `readOnlyHint` - No side effects
  - `destructiveHint` - May perform destructive changes
  - `idempotentHint` - Multiple calls have no additional effect
  - `openWorldHint` - Interacts with external systems
- **Error Handling**: Prefer `isError: true` in content over protocol-level errors

### Client-Side Features

#### Sampling
- **Purpose**: Server requests LLM completion from client
- **Status**: Not yet supported in Claude Desktop (as of mid-2025)
- **Method**: `sampling/createMessage`
- **Parameters**: messages, modelPreferences, systemPrompt, includeContext, maxTokens
- **Use Case**: Enable server-initiated AI reasoning mid-workflow

#### Roots
- **Purpose**: Client informs server about workspace boundaries
- **Method**: `roots/list`
- **Structure**: URI (typically `file:///` paths) and optional name
- **Security**: Servers should respect root boundaries, validate paths

#### Elicitation
- **Purpose**: Server prompts user for structured input during session
- **Status**: Newly introduced (2025-06-18), may evolve
- **Method**: `elicitation/create`
- **Schema**: Limited to flat objects with primitive types (string, number, boolean, enum)
- **Actions**: accept (with content), decline, cancel
- **Security**: NOT for passwords/tokens - use proper auth flows

## Implementation Patterns

### TypeScript Server Structure
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: {
    resources: { subscribe: true, listChanged: true },
    tools: { listChanged: true },
    prompts: {}
  }}
);

// Register handlers
server.setRequestHandler(ListToolsRequestSchema, async () => { ... });
server.setRequestHandler(CallToolRequestSchema, async (request) => { ... });

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Tool Definition Pattern
```typescript
{
  name: "tool_name",
  title: "Human Friendly Title",
  description: "Clear description for LLM and user",
  inputSchema: {
    type: "object",
    properties: {
      param: { type: "string", description: "Parameter description" }
    },
    required: ["param"]
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  }
}
```

### Error Handling Pattern
```typescript
try {
  const result = await performOperation();
  return { content: [{ type: "text", text: result }] };
} catch (error) {
  return {
    isError: true,
    content: [{
      type: "text",
      text: `Error: ${error.message}\n\nPossible fixes:\n1. Check X\n2. Verify Y`
    }]
  };
}
```

## Security Best Practices

### Input Validation
- Validate all parameters against schema
- Sanitize paths to prevent directory traversal
- Use parameterized queries for SQL
- Implement rate limiting

### User Consent
- Resources: User explicitly selects which to include
- Tools: Require user approval for each invocation
- Sampling: User approves prompt and response
- Elicitation: User decides whether to provide info

### Access Control
- Enforce root boundaries for file operations
- Validate resource URIs server-side
- Implement least privilege principle
- Audit log all tool invocations

## Quick Start: Creating an MCP Server

### Using the Generator (Recommended)

**Interactive Mode:**
```bash
npm install
npm run build
npm run create-server
```

The CLI will guide you through:
1. Server name and description
2. Type selection (tools, resources, prompts, or mixed)
3. Feature configuration (subscriptions, rate limiting, etc.)
4. Security settings (input validation, path sanitization)
5. Whether to include examples and tests

**Command-Line Mode:**
```bash
npm run create-server -- \
  --name my-weather-server \
  --type tools \
  --description "Weather data and forecasts"
```

**Using Example Configurations:**
```typescript
import { generateServer } from './generator/index.js';
import { weatherServerConfig } from './examples/weather-server.js';

await generateServer(weatherServerConfig);
```

### Project Structure

After generation, you'll have:
```
my-server/
├── src/
│   ├── index.ts           # Server entry point
│   ├── tools/             # Tool implementations (if tools enabled)
│   ├── resources/         # Resource handlers (if resources enabled)
│   └── prompts/           # Prompt templates (if prompts enabled)
├── tests/                 # Test files (if tests enabled)
├── dist/                  # Compiled output
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # Usage documentation
```

### Development Workflow

**Build and Run:**
```bash
cd my-server
npm install
npm run build
npm start
```

**Development Mode:**
```bash
npm run dev        # Auto-rebuild and restart on changes
```

**Testing:**
```bash
npm test           # Run unit tests
npx @modelcontextprotocol/inspector node dist/index.js  # Interactive testing
```

## Common Development Tasks

### Working with Generated Servers

#### Adding a New Tool to Generated Server
1. Open `src/tools/index.ts`
2. Add tool definition to `TOOLS` array
3. Add handler case in `callTool` function
4. Rebuild: `npm run build`
5. Test with MCP Inspector

Example:
```typescript
// Add to TOOLS array
const myTool = {
  name: 'my_tool',
  title: 'My Tool',
  description: 'What this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'Input parameter' }
    },
    required: ['input']
  }
};

// Add handler
async function handleMyTool(args: any) {
  // Validate input
  if (!args.input || typeof args.input !== 'string') {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: input must be a non-empty string' }]
    };
  }

  // Process
  const result = processInput(args.input);

  // Return
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
  };
}
```

#### Adding a New Resource to Generated Server
1. Open `src/resources/index.ts`
2. Add resource to `RESOURCES` array
3. Add handler case in `readResource` function
4. Update `listResources` if needed
5. Rebuild and test

#### Adding a New Prompt to Generated Server
1. Open `src/prompts/index.ts`
2. Add prompt to `PROMPTS` array
3. Add handler case in `getPrompt` function
4. Define prompt message generation logic
5. Rebuild and test

### Modifying Templates

Templates are in [src/generator/templates/](src/generator/templates/):
- [server-index.ts](src/generator/templates/server-index.ts) - Main server entry point
- [tools.ts](src/generator/templates/tools.ts) - Tools module template
- [resources.ts](src/generator/templates/resources.ts) - Resources module template
- [prompts.ts](src/generator/templates/prompts.ts) - Prompts module template
- [tests.ts](src/generator/templates/tests.ts) - Test file template
- [readme.ts](src/generator/templates/readme.ts) - Generated server README

After modifying templates:
1. Rebuild the generator: `npm run build`
2. Generate a new server to test changes
3. Verify the generated code compiles and runs

### Testing Your Server

**Using the Test Client:**
```typescript
import { createTestClient } from './testing/index.js';

const client = await createTestClient({
  serverPath: './my-server/dist/index.js'
});

// Test tools
const tools = await client.listTools();
const result = await client.callTool('my_tool', { input: 'test' });

// Test resources
const resources = await client.listResources();
const data = await client.readResource('my://resource');

await client.close();
```

**Using Test Helpers:**
```typescript
import { assertNotError, assertHasTool, testServer } from './testing/index.js';

await testServer('./my-server/dist/index.js', async (client) => {
  const tools = await client.listTools();
  assertHasTool(tools, 'my_tool');

  const result = await client.callTool('my_tool', { input: 'test' });
  assertNotError(result);
});
```

## Protocol Version and Compatibility

- **Current Version**: 2025-06-18
- **Versioning**: Date-based for clarity
- **Capability Negotiation**: Features are opt-in; declare support during initialization
- **Deprecations**:
  - SSE standalone transport (deprecated late 2024)
  - JSON-RPC batching (removed)

## Testing Approach

### Unit Tests
- Test tool logic with valid and invalid inputs
- Verify schema validation
- Test error handling paths
- Security tests (injection, traversal)

### Integration Tests
- Full MCP flow with SDK client
- Test initialization handshake
- Verify tool execution and responses
- Test resource subscriptions and notifications

### Agent Simulation
- Multi-step workflows combining tools
- Resource usage patterns
- Error recovery scenarios

## Important Caveats

1. **Tool Response Size**: Keep typical responses < 4KB, max < 100KB to avoid context overflow
2. **Pagination**: Implement for large resource/tool lists
3. **Error Messages**: Make them actionable for LLM to adjust strategy
4. **Schema Descriptions**: Critical for LLM understanding - be explicit and detailed
5. **Annotations**: Hints only, not security controls - validate server-side
6. **Roots**: Always respect boundaries, validate all paths
7. **Sampling**: Not yet in Claude Desktop - design with future support in mind
8. **Elicitation**: New feature, may evolve - feature flag if needed

## Reference Documentation

All specifications are sourced from official Anthropic MCP documentation at:
- https://modelcontextprotocol.io/specification/2025-06-18
- https://docs.anthropic.com/en/docs/mcp

The comprehensive technical knowledge base in this repository provides detailed citations and cross-references to official sources for every protocol feature and pattern.
