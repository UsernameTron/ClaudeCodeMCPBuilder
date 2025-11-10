# MCP Builder - Model Context Protocol Server Generator

A comprehensive development environment for creating MCP (Model Context Protocol) servers based on Anthropic's official specifications and best practices.

## Overview

This repository provides:
- 📚 **Complete MCP Documentation** - Technical knowledge base and specifications
- 🛠️ **Server Generator** - CLI tool to scaffold new MCP servers
- 📋 **Reference Templates** - Production-ready templates for tools, resources, and prompts
- 🎯 **Example Servers** - Working examples demonstrating MCP patterns
- ✅ **Best Practices** - Security, testing, and deployment guidelines from official docs

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Create Your First MCP Server

```bash
# Interactive server creation
npm run create-server

# Or with CLI arguments
npm run create-server -- --name my-weather-server --type tools
```

This will generate a complete MCP server with:
- TypeScript project structure
- SDK integration
- Example tool/resource/prompt implementations
- Testing setup
- Configuration for Claude Desktop

## Project Structure

```
mcp-builder/
├── docs/                       # MCP documentation
│   ├── ClaudeMCP.md           # Comprehensive technical guide
│   └── CLAUDE.md              # Claude Code integration guide
├── src/
│   ├── cli/                   # Command-line interface
│   │   └── create-server.ts   # Server generator CLI
│   ├── generator/             # Code generation logic
│   │   ├── index.ts           # Main generator
│   │   ├── templates/         # Code templates
│   │   └── validators.ts      # Input validation
│   ├── templates/             # MCP component templates
│   │   ├── tools/             # Tool templates
│   │   ├── resources/         # Resource templates
│   │   └── prompts/           # Prompt templates
│   └── examples/              # Reference implementations
│       ├── weather-server/    # Weather API example
│       ├── filesystem-server/ # File operations example
│       └── database-server/   # Database integration example
├── generated-servers/         # Your generated servers go here
└── tests/                     # Test utilities and examples
```

## Features

### 1. Interactive Server Generator

The CLI guides you through creating a new MCP server:

```bash
npm run create-server
```

**Prompts:**
- Server name and description
- Server type (tools, resources, prompts, or mixed)
- Capabilities to include
- Security settings
- Testing preferences

**Generated Output:**
- Complete TypeScript project
- Package.json with dependencies
- Server entry point with SDK setup
- Example implementations
- README with usage instructions
- Claude Desktop configuration snippet

### 2. Component Templates

Pre-built templates for all MCP primitives:

#### Tools Template
```typescript
// Generated tool with full schema and error handling
{
  name: "your_tool",
  title: "Your Tool",
  description: "Tool description for LLM",
  inputSchema: { /* JSON Schema */ },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  }
}
```

#### Resources Template
```typescript
// Resource handler with pagination and subscriptions
resources/list → { resources: [...] }
resources/read → { contents: [...] }
resources/subscribe → subscription management
```

#### Prompts Template
```typescript
// Prompt with dynamic arguments and multi-turn support
prompts/get → { messages: [...] }
```

### 3. Example Servers

Complete, working example implementations:

**Weather Server** - Demonstrates:
- External API integration
- Tool implementation
- Error handling
- Rate limiting

**Filesystem Server** - Demonstrates:
- Resource implementation
- Security (path validation)
- Root boundary enforcement
- File watching/subscriptions

**Database Server** - Demonstrates:
- SQL tool with parameterization
- Resource templates (URI patterns)
- Schema introspection
- Connection pooling

### 4. Development Utilities

**Testing Helpers:**
```typescript
// Test your MCP server
import { MCPTestClient } from './tests/utils';

const client = new MCPTestClient();
await client.connect(yourServer);
const tools = await client.listTools();
const result = await client.callTool('your_tool', { args });
```

**Validation Tools:**
```typescript
// Validate your server implementation
import { validateServer } from './tests/validators';

const issues = validateServer(yourServer);
// Returns array of compliance issues
```

## Usage Examples

### Creating a Simple Tool Server

```bash
npm run create-server -- --name calculator --type tools
```

This generates a server with example tools and handles:
- Input validation
- Error responses
- User approval flow
- Claude Desktop integration

### Creating a Resource Server

```bash
npm run create-server -- --name knowledge-base --type resources
```

Generates a server that:
- Exposes documents as resources
- Implements pagination
- Supports resource subscriptions
- Handles binary content

### Creating a Full-Featured Server

```bash
npm run create-server -- --name enterprise-integration --type mixed
```

Creates a server with:
- Multiple tools
- Resource endpoints
- Prompt templates
- Complete capability set

## Configuration for Claude Desktop

After generating a server, add it to Claude Desktop:

**macOS:**
```bash
# Edit configuration
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Add your server:**
```json
{
  "mcpServers": {
    "your-server-name": {
      "command": "node",
      "args": ["/absolute/path/to/your-server/dist/index.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

**Restart Claude Desktop** to load the server.

## Best Practices (from Official Docs)

### Security
✅ Validate all inputs against schemas
✅ Sanitize paths to prevent traversal
✅ Use parameterized queries for SQL
✅ Implement rate limiting
✅ Audit log all tool invocations
✅ Enforce root boundaries

### Error Handling
✅ Use `isError: true` in tool responses
✅ Provide actionable error messages
✅ Include suggested fixes in errors
✅ Handle timeouts gracefully
✅ Never leak sensitive info in errors

### Performance
✅ Keep tool responses < 4KB typically
✅ Implement pagination for large lists
✅ Use resource subscriptions for updates
✅ Cache when appropriate
✅ Consider context budget

### User Experience
✅ Clear tool descriptions for LLM
✅ Meaningful annotations
✅ Helpful prompt templates
✅ Good error recovery paths

## Testing Your Server

```bash
# Run tests
npm test

# Test with MCP Inspector (if installed globally)
npx @modelcontextprotocol/inspector node dist/index.js
```

## Documentation Reference

All patterns and implementations in this builder are based on:
- [Official MCP Specification](https://modelcontextprotocol.io/specification/2025-06-18)
- [Anthropic MCP Documentation](https://docs.anthropic.com/en/docs/mcp)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)

**Included Documentation:**
- `docs/ClaudeMCP.md` - Complete technical knowledge base
- `docs/CLAUDE.md` - Claude Code integration guide

## Contributing

When adding new templates or examples:
1. Follow the patterns in existing templates
2. Include comprehensive error handling
3. Add JSDoc comments
4. Update this README
5. Add tests for new functionality

## Support

For MCP protocol questions, refer to:
- Documentation in `docs/`
- [Official MCP Site](https://modelcontextprotocol.io)
- [MCP GitHub Discussions](https://github.com/modelcontextprotocol/specification/discussions)

## License

MIT

---

**Built with ❤️ based on Anthropic's Model Context Protocol**
