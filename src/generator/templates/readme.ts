import type { ServerConfig } from '../types.js';

export function generateReadme(config: ServerConfig): string {
  return `# ${config.name}

${config.description}

## Overview

This MCP server was generated using MCP Builder, following Anthropic's Model Context Protocol specification (2025-06-18).

**Capabilities:**
${config.capabilities.tools ? '- ✅ **Tools** - Executable actions the LLM can invoke' : ''}
${config.capabilities.resources ? '- ✅ **Resources** - Data/content exposed for LLM context' : ''}
${config.capabilities.prompts ? '- ✅ **Prompts** - Reusable prompt templates' : ''}

**Features:**
${config.features.listChanged ? '- 🔄 Dynamic capability changes' : ''}
${config.features.subscribe ? '- 📡 Resource subscriptions (real-time updates)' : ''}
${config.features.structuredOutputs ? '- 📊 Structured outputs with schemas' : ''}

## Quick Start

### Installation

\`\`\`bash
# Install dependencies
npm install

# Build the server
npm run build

# Run the server
npm start
\`\`\`

### Development

\`\`\`bash
# Watch mode (auto-rebuild)
npm run watch

# Run with auto-restart
npm run dev

# Run tests
npm test
\`\`\`

## Configuration for Claude Desktop

To use this server with Claude Desktop, add it to your configuration:

**macOS/Linux:**
\`\`\`bash
code ~/Library/Application\\ Support/Claude/claude_desktop_config.json
\`\`\`

**Windows:**
\`\`\`bash
code %APPDATA%\\Claude\\claude_desktop_config.json
\`\`\`

**Add the server configuration:**
\`\`\`json
{
  "mcpServers": {
    "${config.name}": {
      "command": "node",
      "args": ["/absolute/path/to/${config.name}/dist/index.js"],
      "env": {
        "API_KEY": "your-api-key-if-needed"
      }
    }
  }
}
\`\`\`

**Important:** Use absolute paths, not relative paths.

### Restart Claude Desktop

After updating the configuration, restart Claude Desktop to load the server.

## Usage

${config.capabilities.tools ? `
### Tools

This server provides the following tools:

${config.includeExamples ? `
#### \`echo\`
Echoes back the input text - useful for testing.

**Parameters:**
- \`message\` (string, required): The message to echo back

**Example:**
\`\`\`json
{
  "name": "echo",
  "arguments": {
    "message": "Hello, MCP!"
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "echoed": "Hello, MCP!",
  "timestamp": "2025-01-10T12:00:00.000Z"
}
\`\`\`
` : '_(Add your tools here)_'}
` : ''}

${config.capabilities.resources ? `
### Resources

This server exposes the following resources:

${config.includeExamples ? `
#### \`server://info\`
Basic information about this MCP server.

**MIME Type:** \`application/json\`

**Content:**
\`\`\`json
{
  "name": "${config.name}",
  "version": "1.0.0",
  "uptime": 12345.67
}
\`\`\`
` : '_(Add your resources here)_'}

${config.features.subscribe ? `
#### Subscriptions

Clients can subscribe to resources for real-time updates:
\`\`\`typescript
// Subscribe to a resource
await client.request('resources/subscribe', { uri: 'server://info' });

// Receive notifications when resource changes
// notifications/resources/updated { uri: 'server://info' }
\`\`\`
` : ''}
` : ''}

${config.capabilities.prompts ? `
### Prompts

This server provides the following prompt templates:

${config.includeExamples ? `
#### \`analyze-data\`
Generate an analysis prompt for provided data.

**Arguments:**
- \`data\` (string, required): The data to analyze
- \`focus\` (string, optional): Analysis focus area

**Example:**
\`\`\`json
{
  "name": "analyze-data",
  "arguments": {
    "data": "Sales data: Q1: 100, Q2: 150, Q3: 120, Q4: 180",
    "focus": "trends"
  }
}
\`\`\`
` : '_(Add your prompts here)_'}
` : ''}

## Security

This server implements MCP security best practices:

${config.security.validateInputs ? '- ✅ Input validation against schemas' : ''}
${config.security.sanitizePaths ? '- ✅ Path sanitization (prevents directory traversal)' : ''}
${config.security.rateLimit ? '- ✅ Rate limiting' : ''}
- ✅ User approval required for all tool invocations
- ✅ Clear error messages without sensitive data

### Additional Security Considerations

1. **Environment Variables**: Store sensitive data (API keys, credentials) in environment variables
2. **Root Boundaries**: Respect client-provided roots for file operations
3. **Input Validation**: Always validate beyond schema (defense in depth)
4. **Error Handling**: Never leak internal paths or sensitive info in errors
5. **Audit Logging**: Consider logging tool invocations for security audits

## Development Guide

### Project Structure

\`\`\`
${config.name}/
├── src/
│   ├── index.ts           # Server entry point
${config.capabilities.tools ? '│   ├── tools/             # Tool implementations' : ''}
${config.capabilities.resources ? '│   ├── resources/         # Resource handlers' : ''}
${config.capabilities.prompts ? '│   └── prompts/           # Prompt templates' : ''}
├── tests/                 # Test files
├── dist/                  # Compiled output
└── package.json
\`\`\`

### Adding New ${config.capabilities.tools ? 'Tools' : config.capabilities.resources ? 'Resources' : 'Prompts'}

${config.capabilities.tools ? `
#### Adding a Tool

1. Define the tool in \`src/tools/index.ts\`:

\`\`\`typescript
const myTool = {
  name: 'my_tool',
  title: 'My Tool',
  description: 'What this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param: { type: 'string', description: 'Parameter description' }
    },
    required: ['param']
  },
  annotations: {
    readOnlyHint: true,  // No side effects
    openWorldHint: false  // Doesn't access external systems
  }
};
\`\`\`

2. Add to TOOLS array
3. Implement handler in \`callTool\` function
4. Rebuild: \`npm run build\`
` : ''}

${config.capabilities.resources ? `
#### Adding a Resource

1. Define the resource in \`src/resources/index.ts\`:

\`\`\`typescript
const myResource = {
  uri: 'custom://my-resource',
  name: 'My Resource',
  description: 'What this resource contains',
  mimeType: 'application/json'
};
\`\`\`

2. Add to RESOURCES array
3. Implement handler in \`readResource\` function
4. Rebuild: \`npm run build\`
` : ''}

${config.capabilities.prompts ? `
#### Adding a Prompt

1. Define the prompt in \`src/prompts/index.ts\`:

\`\`\`typescript
const myPrompt = {
  name: 'my-prompt',
  title: 'My Prompt',
  description: 'What this prompt does',
  arguments: [
    { name: 'arg1', description: 'First argument', required: true }
  ]
};
\`\`\`

2. Add to PROMPTS array
3. Implement handler in \`getPrompt\` function
4. Rebuild: \`npm run build\`
` : ''}

### Testing

${config.includeTests ? `
\`\`\`bash
# Run all tests
npm test

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
\`\`\`
` : `
Create tests in the \`tests/\` directory and run with:
\`\`\`bash
npm test
\`\`\`
`}

## Troubleshooting

### Server Not Appearing in Claude

1. Check the configuration path is absolute, not relative
2. Verify the server builds without errors: \`npm run build\`
3. Check Claude Desktop logs for errors
4. Restart Claude Desktop after configuration changes

### Tool Invocation Fails

1. Check tool input schema matches what Claude is sending
2. Verify error handling returns proper \`isError: true\` format
3. Check server logs for detailed error messages

### Resources Not Loading

1. Verify URI format is correct
2. Check file paths are within allowed roots
3. Ensure MIME types are set correctly

## Documentation

- **MCP Specification**: https://modelcontextprotocol.io/specification/2025-06-18
- **Anthropic MCP Docs**: https://docs.anthropic.com/en/docs/mcp
- **MCP Builder Docs**: See \`docs/\` directory in builder repository

## Support

For issues specific to this server, check the logs in Claude Desktop.

For MCP protocol questions, refer to:
- [MCP GitHub Discussions](https://github.com/modelcontextprotocol/specification/discussions)
- [Official Documentation](https://modelcontextprotocol.io)

## License

MIT

---

**Generated by MCP Builder** - Following Anthropic Model Context Protocol best practices
`;
}
