# Expert-MCP-Builder: Comprehensive Technical Guide

## Executive Summary

This guide provides a complete technical blueprint for mastering the Model Context Protocol (MCP) and building custom skills that extend Claude's capabilities. Based on authoritative documentation analysis, this document covers protocol fundamentals, implementation patterns, testing strategies, and enterprise-scale deployment considerations.

---

## 1. Protocol & Ecosystem Foundations

### 1.1 What is the Model Context Protocol (MCP)?

**Definition**: MCP is an open standard that enables Large Language Model (LLM) applications to integrate with external tools and data sources in a unified, secure manner.[^1][^2]

**Architecture Overview**:

```
┌─────────────────────────────────────────────┐
│            HOST APPLICATION                  │
│         (Claude Desktop, IDE, etc.)          │
│  ┌────────────────────────────────────┐    │
│  │     CLIENT 1    │    CLIENT 2      │    │
│  │   (MCP Client)  │  (MCP Client)    │    │
│  └────────┬────────┴────────┬─────────┘    │
└───────────┼─────────────────┼───────────────┘
            │                 │
      JSON-RPC over          │
      stdio/HTTP             │
            │                 │
┌───────────▼─────┐  ┌───────▼──────────┐
│   MCP SERVER 1  │  │   MCP SERVER 2   │
│  (Filesystem)   │  │   (Database)     │
└─────────────────┘  └──────────────────┘
```

**Core Components**:[^3][^4]

1. **Host**: The LLM application container (e.g., Claude Desktop) that manages connections, enforces user consent, aggregates context across servers

2. **Client**: A connector maintaining a 1:1 session with a specific server, handling message routing and isolation

3. **Server**: A standalone program offering capabilities (resources, prompts, tools) to the client

**Design Goals**:[^5]
- **Modularity**: "USB-C for AI" - consistent interface for various integrations
- **Security**: User-in-the-loop for all data sharing and tool execution
- **Isolation**: Servers operate independently, cannot access each other's data
- **Extensibility**: Opt-in features via capability negotiation

### 1.2 MCP Communication Protocol

**Transport Layers**:[^6][^7]

| Transport | Use Case | Connection Method |
|-----------|----------|-------------------|
| **stdio** | Local servers | JSON-RPC via stdin/stdout pipes |
| **HTTP (Streamable)** | Remote servers | HTTP POST with SSE for streaming |

**Connection Lifecycle**:[^8]

```json
1. CLIENT → SERVER: initialize
{
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "sampling": {},
      "roots": {"listChanged": true}
    },
    "clientInfo": {"name": "claude-desktop", "version": "1.0.0"}
  }
}

2. SERVER → CLIENT: initialize response
{
  "result": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "resources": {"subscribe": true, "listChanged": true},
      "tools": {"listChanged": true},
      "prompts": {}
    },
    "serverInfo": {"name": "my-server", "version": "1.0.0"}
  }
}

3. CLIENT → SERVER: initialized notification
{
  "method": "notifications/initialized"
}
```

**Key Protocol Features**:[^9][^10]
- **Bidirectional**: Both client and server can initiate requests
- **Capability Negotiation**: Features are opt-in; unsupported features won't be used
- **Version Management**: Date-based versioning (e.g., "2025-06-18")
- **Standard Error Codes**: JSON-RPC codes + MCP-specific codes (e.g., -32002 for resource not found)

### 1.3 Server-Side Primitives

#### **Resources** (Application-Controlled)[^11][^12]

**Purpose**: Expose data/content that can be used as additional context for the LLM

**Key Characteristics**:
- Read-only data identified by URI (e.g., `file:///path/to/file`, `postgres://table/row`)
- Two content types: `text` (UTF-8) or `blob` (base64)
- User explicitly selects which resources to include in context

**API Methods**:
```typescript
// List available resources
resources/list → { resources: Resource[] }

// Read resource content
resources/read(uri) → { contents: ResourceContent[] }

// Subscribe to updates (optional)
resources/subscribe(uri)
notifications/resources/updated(uri)
```

#### **Prompts** (User-Controlled)[^13][^14]

**Purpose**: Pre-defined prompt templates that guide LLM interactions

**Key Characteristics**:
- User explicitly triggers prompts (like slash commands)
- Can include multiple messages with alternating roles
- Support dynamic arguments and embedded resource references

**API Methods**:
```typescript
// List available prompts
prompts/list → { prompts: Prompt[] }

// Get prompt content with arguments
prompts/get(name, arguments) → { messages: Message[] }
```

#### **Tools** (Model-Controlled)[^15][^16]

**Purpose**: Executable actions the LLM can invoke (with user approval)

**Key Characteristics**:
- LLM decides when to use tools based on conversation context
- Requires user approval (human-in-the-loop)
- Input/output defined by JSON Schema
- Annotations indicate behavior (readOnly, destructive, idempotent, openWorld)

**API Methods**:
```typescript
// List available tools
tools/list → { tools: Tool[] }

// Execute tool
tools/call(name, arguments) → { content: Content[], isError: boolean }
```

### 1.4 Client-Side Primitives

#### **Sampling**[^17][^18]
**Purpose**: Server requests LLM completion from client

**Use Case**: Server needs AI reasoning mid-workflow (e.g., analyze code before committing)

**Note**: Not yet supported in Claude Desktop (as of mid-2025)[^19]

#### **Roots**[^20][^21]
**Purpose**: Client informs server about workspace boundaries

**Use Case**: Define project directories, limit file access scope

**Security**: Servers should respect root boundaries to prevent unauthorized access

#### **Elicitation**[^22][^23]
**Purpose**: Server prompts user for structured input during session

**Use Case**: Ask for configuration values, API keys, user preferences

**Constraints**: Limited JSON Schema (flat objects with primitive types only)

---

## 2. The mcp-builder Repository & Skills Architecture

### 2.1 Relationship to MCP Ecosystem

Based on the technical knowledge base, the **mcp-builder repository** appears to be an example/template system for creating custom MCP skills. While not explicitly detailed in the provided PDFs, the context suggests:

**Skills vs. MCP Servers**:
- **MCP Server**: The runtime process implementing the protocol
- **Skill**: A packaged unit of functionality (tools + resources + prompts) that a server can provide
- **mcp-builder**: Likely a scaffolding/templating system for creating new skills

**Typical Repository Structure** (inferred from best practices):
```
mcp-builder/
├── SKILL.md                    # Skill documentation template
├── skills/
│   ├── example/
│   │   ├── SKILL.md           # Skill-specific docs
│   │   ├── manifest.json      # Metadata
│   │   ├── server/
│   │   │   ├── index.ts       # Main server entry
│   │   │   ├── tools/         # Tool implementations
│   │   │   ├── resources/     # Resource handlers
│   │   │   └── prompts/       # Prompt definitions
│   │   └── tests/
│   │       └── integration.test.ts
│   └── ...
├── templates/
│   ├── python/
│   └── typescript/
└── scripts/
    ├── create-skill.sh
    └── validate-skill.sh
```

### 2.2 Key Files and Mapping

#### **SKILL.md**
**Purpose**: Human-readable documentation for the skill

**Typical Contents**:
```markdown
# Skill Name

## Description
What this skill does and when Claude should use it

## Trigger Patterns
- User asks "X"
- User wants to "Y"

## Tools
### tool_name
- **Description**: What the tool does
- **When to Use**: Specific scenarios
- **When NOT to Use**: Anti-patterns
- **Parameters**: Input schema explanation
- **Returns**: Output format
- **Error Handling**: Common failure modes

## Resources
### resource_name
- **URI Pattern**: file:///, https://, etc.
- **Content Type**: text/plain, application/json
- **Use Case**: When to read this resource

## Examples
- Example 1: User query → Tool call → Result
```

#### **manifest.json** (for Desktop Extensions)
```json
{
  "name": "skill-name",
  "version": "1.0.0",
  "description": "Skill description",
  "type": "node",  // or "python", "binary"
  "command": "node",
  "args": ["server/index.js"],
  "env": {},
  "config": {
    "apiKey": {
      "description": "API key for service",
      "type": "string",
      "sensitive": true,
      "required": false
    }
  }
}
```

#### **Tool Registration** (TypeScript example)
```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-skill", version: "1.0.0" },
  { capabilities: { tools: { listChanged: true } } }
);

// Register tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_files",
        title: "Search Files",
        description: "Search for files matching a pattern",
        inputSchema: {
          type: "object",
          properties: {
            pattern: {
              type: "string",
              description: "Glob pattern to search for"
            },
            path: {
              type: "string",
              description: "Base directory to search in"
            }
          },
          required: ["pattern"]
        },
        annotations: {
          title: "Search Files",
          readOnlyHint: true,
          openWorldHint: false
        }
      }
    ]
  };
});

// Register tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "search_files") {
    try {
      const results = await searchFiles(args.pattern, args.path);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`
          }
        ]
      };
    }
  }
  
  throw new Error(`Unknown tool: ${name}`);
});
```

### 2.3 Naming Conventions & Best Practices

#### **Tool Names**[^24]
- **Format**: `snake_case` (e.g., `read_file`, `search_database`)
- **Clarity**: Action-oriented verbs + object (e.g., `create_pull_request`, not `pr`)
- **Namespacing**: Avoid collisions with `server__tool` pattern in multi-server setups

#### **Resource URIs**[^25]
- **Schemes**: `file://`, `https://`, custom schemes (e.g., `postgres://`, `api://`)
- **Structure**: `[protocol]://[host]/[path]`
- **Custom Schemes**: Must conform to URI standards

#### **Error Handling Patterns**[^26][^27]

**Protocol-Level Errors** (JSON-RPC):
```json
{
  "error": {
    "code": -32601,  // Method not found
    "message": "Tool 'unknown_tool' does not exist"
  }
}
```

**Tool Execution Errors** (In-Content):
```json
{
  "isError": true,
  "content": [
    {
      "type": "text",
      "text": "Failed to connect to database: Connection timeout"
    }
  ]
}
```

**Best Practice**: Use in-content errors for recoverable failures so the LLM can react appropriately.[^28]

---

## 3. Design and Implementation Best Practices

### 3.1 Design Principles for MCP Skills

#### **Principle 1: Workflow-Oriented Tools**

**Rationale**: Tools should map to complete user tasks, not low-level operations.

**Example**:
- ✅ GOOD: `create_pull_request(title, body, branch)` - Complete workflow
- ❌ BAD: `git_add()`, `git_commit()`, `git_push()` - Too granular

#### **Principle 2: Context-Budget Awareness**[^29]

**Rationale**: Resources consume LLM context window; be selective.

**Guidelines**:
- Implement pagination for large resource lists
- Use `text` excerpts rather than full files when possible
- Prefer tool calls that fetch on-demand over pre-loading all resources

#### **Principle 3: Clear Error Messages**[^30]

**Rationale**: LLM needs to understand failures to adjust strategy.

**Pattern**:
```typescript
try {
  // operation
} catch (error) {
  return {
    isError: true,
    content: [{
      type: "text",
      text: `Failed to execute: ${error.message}\n\n` +
            `Possible fixes:\n` +
            `1. Check that the API key is valid\n` +
            `2. Verify the resource exists\n` +
            `3. Ensure you have permission`
    }]
  };
}
```

#### **Principle 4: Security-First Design**[^31][^32]

**Mandatory Practices**:
1. **Input Validation**: Validate all parameters against schema + additional constraints
2. **Path Sanitization**: Prevent directory traversal (`../../../etc/passwd`)
3. **Least Privilege**: Only request permissions needed
4. **Rate Limiting**: Prevent abuse/runaway LLM calls
5. **Audit Logging**: Log all tool invocations for compliance

### 3.2 Tool vs. Resource vs. Prompt Decision Matrix

| Feature | Use When | Don't Use When | Example |
|---------|----------|----------------|---------|
| **Tool** | Need to perform an action or fetch data dynamically | Data is static or user should control inclusion | `send_email`, `run_query`, `search_web` |
| **Resource** | Exposing static/semi-static data user controls | Data needs real-time computation | `file:///project/README.md`, `logs://recent` |
| **Prompt** | Providing reusable LLM instruction templates | Tool should auto-run without user trigger | "Analyze Code Quality", "Generate Commit Message" |

### 3.3 Schema Design for Maximum LLM Interpretability

#### **Input Schema Best Practices**[^33]

```typescript
{
  name: "analyze_code",
  inputSchema: {
    type: "object",
    properties: {
      code: {
        type: "string",
        description: "The code to analyze. Should be complete, valid syntax.",
        minLength: 1
      },
      language: {
        type: "string",
        description: "Programming language (e.g., 'python', 'typescript')",
        enum: ["python", "typescript", "javascript", "go", "rust"],
        default: "python"
      },
      checks: {
        type: "array",
        description: "Types of analysis to perform",
        items: {
          type: "string",
          enum: ["security", "performance", "style", "bugs"]
        },
        default: ["bugs", "security"]
      }
    },
    required: ["code"]
  }
}
```

**Key Elements**:
- **Rich descriptions**: Explain format, constraints, examples
- **Enums**: Limit choices to valid options
- **Defaults**: Reduce required parameters
- **Types**: Use specific types (not just `string` for everything)

#### **Output Schema Best Practices**[^34]

```typescript
{
  outputSchema: {
    type: "object",
    properties: {
      issues: {
        type: "array",
        items: {
          type: "object",
          properties: {
            severity: { type: "string", enum: ["error", "warning", "info"] },
            message: { type: "string" },
            line: { type: "number" },
            suggestion: { type: "string" }
          },
          required: ["severity", "message"]
        }
      },
      summary: { type: "string" }
    },
    required: ["issues", "summary"]
  }
}
```

**Benefits**:
- Client can validate responses
- LLM knows exact format to expect
- Enables programmatic parsing

---

## 4. Testing, Validation, and Deployment

### 4.1 Testing Strategies

#### **Unit Testing: Tool Logic**

```typescript
// tests/tools/search-files.test.ts
import { searchFiles } from '../../server/tools/search-files';

describe('searchFiles', () => {
  it('should find matching files', async () => {
    const result = await searchFiles('*.ts', '/test/fixtures');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toMatch(/\.ts$/);
  });

  it('should handle invalid patterns gracefully', async () => {
    const result = await searchFiles('[invalid', '/test/fixtures');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Invalid pattern');
  });

  it('should respect path boundaries (security)', async () => {
    const result = await searchFiles('*', '/test/../../../etc');
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Access denied');
  });
});
```

#### **Integration Testing: Full MCP Flow**

```typescript
// tests/integration/mcp-server.test.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

describe('MCP Server Integration', () => {
  let client: Client;

  beforeAll(async () => {
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['dist/server/index.js']
    });

    client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );

    await client.connect(transport);
  });

  it('should initialize and list tools', async () => {
    const tools = await client.listTools();
    expect(tools.tools).toHaveLength(3);
    expect(tools.tools[0].name).toBe('search_files');
  });

  it('should execute tool and return valid response', async () => {
    const result = await client.callTool({
      name: 'search_files',
      arguments: { pattern: '*.ts', path: '/test/fixtures' }
    });

    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.isError).toBeFalsy();
  });

  afterAll(async () => {
    await client.close();
  });
});
```

#### **Schema Validation Testing**

```typescript
import Ajv from 'ajv';

const ajv = new Ajv();

describe('Tool Schemas', () => {
  it('should have valid input schemas', () => {
    const tools = getToolDefinitions();
    
    tools.forEach(tool => {
      const valid = ajv.validateSchema(tool.inputSchema);
      expect(valid).toBe(true);
    });
  });

  it('should validate sample inputs against schema', () => {
    const sampleInput = { pattern: '*.ts', path: '/test' };
    const schema = getToolSchema('search_files').inputSchema;
    
    const validate = ajv.compile(schema);
    const valid = validate(sampleInput);
    
    expect(valid).toBe(true);
  });
});
```

#### **Simulating Agent Usage**

```typescript
// tests/e2e/agent-simulation.test.ts
describe('Agent Workflow Simulation', () => {
  it('should handle multi-step workflow', async () => {
    // Simulate agent behavior
    
    // Step 1: List files
    const listResult = await callTool('list_files', { path: '/project' });
    expect(listResult.isError).toBe(false);
    
    // Step 2: Read specific file
    const fileContent = await callTool('read_file', { 
      path: '/project/src/index.ts' 
    });
    
    // Step 3: Analyze code
    const analysis = await callTool('analyze_code', {
      code: fileContent.content[0].text,
      language: 'typescript'
    });
    
    expect(analysis.isError).toBe(false);
    expect(JSON.parse(analysis.content[0].text)).toHaveProperty('issues');
  });
});
```

### 4.2 Validation Checklist

**Schema Completeness**:
- [ ] All tools have `inputSchema` defined
- [ ] All `required` fields are documented
- [ ] All enums have complete value sets
- [ ] `outputSchema` defined for structured tools
- [ ] Descriptions are clear and examples provided

**Error Handling**:
- [ ] All expected errors return `isError: true`
- [ ] Error messages are actionable (suggest fixes)
- [ ] Validation errors caught before execution
- [ ] Timeout/rate-limit handling implemented
- [ ] Partial failure handling (e.g., batch operations)

**Security**:
- [ ] Input sanitization for all user-provided values
- [ ] Path traversal prevention (validate against roots)
- [ ] Authentication/authorization checks
- [ ] Sensitive data not logged
- [ ] Rate limiting implemented
- [ ] Audit trail for destructive operations

**Context Optimization**:
- [ ] Resources use excerpts/summaries when possible
- [ ] Pagination implemented for large lists
- [ ] Tool responses are concise (< 4KB typical)
- [ ] Binary data base64-encoded appropriately

**Documentation**:
- [ ] SKILL.md complete with trigger patterns
- [ ] Examples cover common use cases
- [ ] Anti-patterns documented ("When NOT to Use")
- [ ] Error scenarios documented

### 4.3 Deployment Considerations

#### **Local vs. Production**

| Aspect | Local Development | Production |
|--------|-------------------|------------|
| **Transport** | stdio | HTTP with TLS |
| **Authentication** | None (trusted local) | OAuth/API keys |
| **Concurrency** | Single user | Multi-client support |
| **Monitoring** | Console logs | Structured logging + metrics |
| **Error Handling** | Stack traces OK | Sanitized errors only |

#### **Configuration Management**

**Local (Claude Desktop)**:[^35]
```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "my-skill": {
      "command": "node",
      "args": ["/absolute/path/to/server/index.js"],
      "env": {
        "API_KEY": "from-env-or-config"
      }
    }
  }
}
```

**Production (Remote MCP Server)**:
```typescript
// server.ts
import express from 'express';
import { createMCPHttpHandler } from '@modelcontextprotocol/sdk/server/http.js';

const app = express();

app.post('/mcp', authenticateRequest, createMCPHttpHandler(server));

app.listen(3000, () => {
  console.log('MCP server listening on port 3000');
});
```

#### **Security for Production**[^36][^37]

1. **Authentication**:
```typescript
function authenticateRequest(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = decodeToken(token);
  next();
}
```

2. **Rate Limiting**:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/mcp', limiter);
```

3. **Input Validation**:
```typescript
function validateToolInput(tool: Tool, args: any): ValidationResult {
  // Validate against inputSchema
  const ajv = new Ajv();
  const validate = ajv.compile(tool.inputSchema);
  
  if (!validate(args)) {
    return {
      valid: false,
      errors: validate.errors
    };
  }
  
  // Additional business logic validation
  if (tool.name === 'read_file') {
    if (args.path.includes('..')) {
      return {
        valid: false,
        errors: ['Path traversal detected']
      };
    }
  }
  
  return { valid: true };
}
```

### 4.4 Monitoring & Analytics

#### **Metrics to Track**

```typescript
// monitoring.ts
export class MCPMetrics {
  private metrics = {
    toolInvocations: new Counter('mcp_tool_calls_total', 'labels: [tool_name, status]'),
    toolDuration: new Histogram('mcp_tool_duration_seconds', 'labels: [tool_name]'),
    resourceReads: new Counter('mcp_resource_reads_total', 'labels: [resource_uri]'),
    errors: new Counter('mcp_errors_total', 'labels: [error_type]')
  };

  async trackToolCall(name: string, fn: () => Promise<any>) {
    const start = Date.now();
    
    try {
      const result = await fn();
      this.metrics.toolInvocations.inc({ tool_name: name, status: 'success' });
      this.metrics.toolDuration.observe({ tool_name: name }, (Date.now() - start) / 1000);
      return result;
    } catch (error) {
      this.metrics.toolInvocations.inc({ tool_name: name, status: 'error' });
      this.metrics.errors.inc({ error_type: error.constructor.name });
      throw error;
    }
  }
}
```

#### **Structured Logging**

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'mcp-skill' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.info('Tool invoked', {
  tool: 'search_files',
  user: req.user.id,
  arguments: { pattern: '*.ts' },
  duration: 123
});
```

#### **Feedback Loop for Skill Refinement**

1. **Usage Analytics**: Which tools are most/least used?
2. **Error Rate**: Which tools fail most often?
3. **User Corrections**: When does user fix LLM's tool usage?
4. **Performance**: Which tools are slowest?

**Action Plan**:
- High error rate → Improve error messages or tool logic
- Low usage → Better documentation or trigger patterns
- Slow performance → Optimize or add caching
- Frequent corrections → Refine tool description/schema

---

## 5. Integration & Field Use Cases

### 5.1 Integrating Skills into Claude

#### **Step 1: Install Desktop Extension (.dxt)**[^38]

```bash
# Option A: From Extension Directory (in Claude Desktop)
# Settings → Extensions → Browse Directory → Install

# Option B: Direct Installation
# Double-click the .dxt file → Claude Desktop opens → Click "Install"
```

#### **Step 2: Configure Extension**[^39]

```
# Claude Desktop will prompt for required configuration
# Example: API Key, Database Connection String, etc.

# These are stored encrypted in macOS Keychain
# Located at: Keychain Access → login → "Claude Desktop - {extension_name}"
```

#### **Step 3: Verify Installation**

```bash
# Check configuration file
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Should show:
{
  "mcpServers": {
    "my-skill": {
      "command": "node",
      "args": ["/path/to/server"],
      "env": { ... }
    }
  }
}

# Restart Claude Desktop
# Tools should now appear in the tools menu (hammer icon)
```

#### **Step 4: Enable Tools for Use**[^40]

In Claude Code:
```bash
# Allow specific tool
claude --allowedTools mcp__my-skill__search_files

# Allow all tools from a server
claude --allowedTools 'mcp__my-skill__*'
```

In Claude Desktop:
- User approval required for each tool invocation
- No pre-approval mechanism (human-in-the-loop by design)

### 5.2 Real-World Use Cases

#### **Use Case 1: Enterprise Data Warehouse Integration**

**Scenario**: Enable Claude to query company's data warehouse for business intelligence

**Implementation**:
```typescript
// Tools
- query_warehouse(sql: string, limit: number)
- get_table_schema(table: string)
- get_available_tables()

// Resources
- resource://schemas/sales
- resource://schemas/customers

// Security
- SQL injection prevention (parameterized queries)
- Row-level security (user permissions)
- Query cost limits (prevent expensive operations)
```

**Trigger Patterns**:
- "What were our Q4 sales?"
- "Show me top customers by revenue"
- "Analyze customer churn trends"

**Risk Mitigation**:
- Read-only database user
- Query timeout (30s max)
- Rate limiting (10 queries/minute)
- Audit logging of all queries

#### **Use Case 2: Business Workflow Automation**

**Scenario**: Automate approval workflows, document generation, notifications

**Implementation**:
```typescript
// Tools
- create_approval_request(title, description, approvers)
- get_approval_status(request_id)
- generate_contract(template, variables)
- send_notification(recipients, message, channel)

// Prompts
- "Create NDA from Template"
- "Quarterly Review Report"

// Resources (templates)
- resource://templates/nda
- resource://templates/employment-agreement
```

**Workflow Example**:
1. User: "Create an NDA for John Doe at Acme Corp"
2. Claude fills NDA template using `generate_contract`
3. Claude creates approval request with `create_approval_request`
4. Claude sends notification to legal team
5. User reviews generated document before sending

#### **Use Case 3: Domain-Specific AI Agent (Legal Research)**

**Scenario**: Legal research assistant with access to case law database

**Implementation**:
```typescript
// Tools
- search_cases(query, jurisdiction, date_range)
- get_case_details(case_id)
- cite_check(document)

// Resources
- resource://cases/recent (last 30 days of cases)
- resource://statutes/{jurisdiction}

// Prompts
- "Research Precedent"
- "Draft Motion to Dismiss"
```

**Specialized Features**:
- Citation verification
- Jurisdiction-aware search
- Parallel citation finding
- Shepardizing (case validity checking)

**Trust & Safety**:
- Always cite sources (case IDs)
- Flag outdated/overturned cases
- Require human review for legal advice

### 5.3 Risks and Mitigation Strategies

#### **Risk 1: Tool Misuse / Unintended Actions**[^41]

**Example**: LLM calls `delete_file` tool when user intended read-only operation

**Mitigation**:
1. **Annotations**: Mark destructive tools with `destructiveHint: true`
2. **UI Warnings**: Claude Desktop shows warning for destructive operations
3. **Confirmation Required**: User must explicitly approve destructive actions
4. **Undo/Backup**: Implement backups before destructive operations
5. **Tool Naming**: Clear names (`delete_file_permanently` vs. `remove_file_safely`)

#### **Risk 2: Context Overflow**[^42]

**Example**: Loading too many resources exhausts context window

**Mitigation**:
1. **Pagination**: Limit resource list size (max 20 per request)
2. **Summaries**: Provide resource summaries instead of full content
3. **On-Demand**: Use tools to fetch data instead of pre-loading resources
4. **Context Budget Tracking**: Monitor token usage, warn when approaching limit

#### **Risk 3: Security Vulnerabilities**

**Examples**:
- Path traversal: `read_file("../../../etc/passwd")`
- SQL injection: `query("users WHERE id = '1 OR 1=1'")`
- Command injection: `run_script("script.sh; rm -rf /")`

**Mitigation**:[^43][^44]
1. **Input Validation**:
```typescript
function sanitizePath(path: string, roots: string[]): string {
  const normalized = path.resolve(path);
  
  // Check against allowed roots
  const allowed = roots.some(root => normalized.startsWith(root));
  
  if (!allowed) {
    throw new Error('Access denied: path outside allowed roots');
  }
  
  return normalized;
}
```

2. **Parameterized Queries**:
```typescript
function queryDatabase(sql: string, params: any[]) {
  // Use prepared statements
  return db.prepare(sql).all(...params);
}
```

3. **Sandboxing**: Run code execution tools in isolated containers

4. **Principle of Least Privilege**: Servers should only have permissions they need

---

## 6. Step-by-Step Blueprint: Building a Custom Skill

### 6.1 Example Domain: GitHub Repository Management

**Skill Name**: `github-repo-manager`

**Capabilities**:
- Search repositories
- Read file contents
- Create issues
- List pull requests
- Code search across repositories

### 6.2 Implementation Blueprint

#### **Step 1: Project Setup**

```bash
# Create project structure
mkdir github-repo-manager
cd github-repo-manager

# Initialize project
npm init -y
npm install @modelcontextprotocol/sdk
npm install --save-dev typescript @types/node ts-node

# Install domain-specific dependencies
npm install @octokit/rest

# TypeScript configuration
npx tsc --init
```

**Project Structure**:
```
github-repo-manager/
├── package.json
├── tsconfig.json
├── SKILL.md
├── src/
│   ├── index.ts              # Server entry point
│   ├── tools/
│   │   ├── search-repos.ts
│   │   ├── read-file.ts
│   │   ├── create-issue.ts
│   │   ├── list-prs.ts
│   │   └── search-code.ts
│   ├── resources/
│   │   └── repo-info.ts
│   ├── prompts/
│   │   └── code-review.ts
│   └── utils/
│       ├── github-client.ts
│       └── validators.ts
├── tests/
│   ├── unit/
│   └── integration/
└── dist/                     # Compiled output
```

#### **Step 2: Define SKILL.md**

```markdown
# GitHub Repository Manager

## Description
Provides Claude with capabilities to interact with GitHub repositories: search code, read files, manage issues and pull requests.

## When to Use
- User wants to search across their GitHub repositories
- User needs to read code from a specific repository
- User wants to create issues or review pull requests
- User asks about repository structure or recent changes

## When NOT to Use
- User wants to push code changes (use git directly)
- User needs organization-level admin operations
- User wants to analyze private repositories without authentication

## Tools

### search_repositories
Search for GitHub repositories by keyword, language, or owner.

**When to Use**: User asks "find repositories about X" or "search for JavaScript projects"

**Parameters**:
- `query` (string, required): Search query (supports GitHub search syntax)
- `language` (string, optional): Filter by programming language
- `sort` (enum, optional): Sort order (stars, forks, updated)
- `limit` (number, optional): Maximum results (default: 10, max: 50)

**Returns**: List of repositories with name, description, stars, language

**Errors**:
- Authentication error → Check GitHub token
- Rate limit exceeded → Wait or upgrade plan

### read_file
Read contents of a file from a GitHub repository.

**When to Use**: User asks to see specific file contents

**Parameters**:
- `owner` (string, required): Repository owner
- `repo` (string, required): Repository name
- `path` (string, required): File path within repository
- `ref` (string, optional): Branch/tag/commit (default: main)

**Returns**: File contents as text

**Security Note**: Respects repository permissions (public repos only without token)

[Additional tools documented similarly...]

## Examples

### Example 1: Search and Read
**User**: "Find popular Python data science repositories and show me their README"

**Tool Sequence**:
1. `search_repositories(query: "data science", language: "python", sort: "stars", limit: 5)`
2. For each result: `read_file(owner: {owner}, repo: {repo}, path: "README.md")`

### Example 2: Issue Creation
**User**: "Create a bug report for the login issue in myapp repository"

**Tool Sequence**:
1. `create_issue(owner: "me", repo: "myapp", title: "Login button not responsive", body: "...", labels: ["bug"])`
```

#### **Step 3: Implement Server Entry Point**

```typescript
// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

import { registerTools, handleToolCall } from "./tools/index.js";
import { registerResources, handleResourceRead } from "./resources/index.js";
import { registerPrompts, handlePromptGet } from "./prompts/index.js";

// Initialize server
const server = new Server(
  {
    name: "github-repo-manager",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: { listChanged: false },
      resources: { subscribe: false, listChanged: false },
      prompts: { listChanged: false }
    },
  }
);

// Register handlers
server.setRequestHandler(ListToolsRequestSchema, registerTools);
server.setRequestHandler(CallToolRequestSchema, handleToolCall);
server.setRequestHandler(ListResourcesRequestSchema, registerResources);
server.setRequestHandler(ReadResourceRequestSchema, handleResourceRead);
server.setRequestHandler(ListPromptsRequestSchema, registerPrompts);
server.setRequestHandler(GetPromptRequestSchema, handlePromptGet);

// Error handling
server.onerror = (error) => {
  console.error("[MCP Error]", error);
};

process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GitHub Repository Manager MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

#### **Step 4: Implement Tools**

```typescript
// src/tools/search-repos.ts
import { Octokit } from "@octokit/rest";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const searchReposTool: Tool = {
  name: "search_repositories",
  title: "Search GitHub Repositories",
  description: "Search for GitHub repositories by keyword, language, or other criteria",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query (supports GitHub search syntax: 'stars:>1000 language:python')"
      },
      language: {
        type: "string",
        description: "Filter by programming language (e.g., 'python', 'javascript')"
      },
      sort: {
        type: "string",
        enum: ["stars", "forks", "updated"],
        description: "Sort order for results"
      },
      limit: {
        type: "number",
        description: "Maximum number of results (default: 10, max: 50)",
        minimum: 1,
        maximum: 50,
        default: 10
      }
    },
    required: ["query"]
  },
  annotations: {
    title: "Search Repositories",
    readOnlyHint: true,
    openWorldHint: true
  }
};

export async function searchRepositories(args: any, octokit: Octokit) {
  try {
    // Build search query
    let searchQuery = args.query;
    if (args.language) {
      searchQuery += ` language:${args.language}`;
    }
    
    // Execute search
    const response = await octokit.search.repos({
      q: searchQuery,
      sort: args.sort,
      per_page: args.limit || 10
    });
    
    // Format results
    const results = response.data.items.map(repo => ({
      name: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      url: repo.html_url,
      updated: repo.updated_at
    }));
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ repositories: results, count: results.length }, null, 2)
        }
      ]
    };
    
  } catch (error) {
    if (error.status === 403) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "GitHub API rate limit exceeded. Please wait or authenticate with a token."
        }]
      };
    }
    
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Search failed: ${error.message}`
      }]
    };
  }
}
```

```typescript
// src/tools/read-file.ts
export const readFileTool: Tool = {
  name: "read_file",
  title: "Read File from Repository",
  description: "Read the contents of a file from a GitHub repository",
  inputSchema: {
    type: "object",
    properties: {
      owner: {
        type: "string",
        description: "Repository owner (username or organization)"
      },
      repo: {
        type: "string",
        description: "Repository name"
      },
      path: {
        type: "string",
        description: "Path to the file within the repository"
      },
      ref: {
        type: "string",
        description: "Branch, tag, or commit SHA (default: repository default branch)"
      }
    },
    required: ["owner", "repo", "path"]
  },
  annotations: {
    title: "Read File",
    readOnlyHint: true,
    openWorldHint: true
  }
};

export async function readFile(args: any, octokit: Octokit) {
  try {
    const response = await octokit.repos.getContent({
      owner: args.owner,
      repo: args.repo,
      path: args.path,
      ref: args.ref
    });
    
    if (Array.isArray(response.data)) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Path "${args.path}" is a directory. Please specify a file path.`
        }]
      };
    }
    
    // Decode base64 content
    const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
    
    return {
      content: [
        {
          type: "text",
          text: `File: ${args.owner}/${args.repo}/${args.path}\n\n${content}`
        }
      ]
    };
    
  } catch (error) {
    if (error.status === 404) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `File not found: ${args.owner}/${args.repo}/${args.path}`
        }]
      };
    }
    
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Failed to read file: ${error.message}`
      }]
    };
  }
}
```

```typescript
// src/tools/index.ts
import { Octokit } from "@octokit/rest";
import { searchReposTool, searchRepositories } from "./search-repos.js";
import { readFileTool, readFile } from "./read-file.js";
// ... other tools

// Initialize GitHub client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export async function registerTools() {
  return {
    tools: [
      searchReposTool,
      readFileTool,
      // ... other tools
    ]
  };
}

export async function handleToolCall(request: any) {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case "search_repositories":
      return await searchRepositories(args, octokit);
    
    case "read_file":
      return await readFile(args, octokit);
    
    // ... other tools
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

#### **Step 5: Implement Resources**

```typescript
// src/resources/index.ts
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function registerResources() {
  return {
    resources: [
      {
        uri: "github://user/repos",
        name: "My Repositories",
        title: "List of User's Repositories",
        description: "All repositories owned by the authenticated user",
        mimeType: "application/json"
      },
      {
        uri: "github://user/starred",
        name: "Starred Repositories",
        title: "Repositories Starred by User",
        description: "Repositories the user has starred",
        mimeType: "application/json"
      }
    ]
  };
}

export async function handleResourceRead(request: any) {
  const { uri } = request.params;
  
  if (uri === "github://user/repos") {
    const repos = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: "updated"
    });
    
    const repoList = repos.data.map(repo => ({
      name: repo.full_name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      updated: repo.updated_at
    }));
    
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ repositories: repoList }, null, 2)
        }
      ]
    };
  }
  
  throw new Error(`Resource not found: ${uri}`);
}
```

#### **Step 6: Implement Prompts**

```typescript
// src/prompts/code-review.ts
import { Prompt } from "@modelcontextprotocol/sdk/types.js";

export const codeReviewPrompt: Prompt = {
  name: "code_review",
  title: "Code Review Assistant",
  description: "Generate a comprehensive code review for a pull request",
  arguments: [
    {
      name: "repo",
      description: "Repository name (owner/repo format)",
      required: true
    },
    {
      name: "pr_number",
      description: "Pull request number",
      required: true
    }
  ]
};

export async function getCodeReviewPrompt(args: any) {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please review pull request #${args.pr_number} in ${args.repo}.

Instructions:
1. Use the read_file tool to examine the changed files
2. Look for:
   - Code quality issues
   - Security vulnerabilities
   - Performance concerns
   - Style inconsistencies
   - Missing tests or documentation
3. Provide actionable feedback with specific line references
4. Highlight what was done well
5. Suggest improvements where needed

Be constructive and thorough in your review.`
        }
      }
    ]
  };
}
```

#### **Step 7: Create Tests**

```typescript
// tests/unit/search-repos.test.ts
import { searchRepositories } from '../../src/tools/search-repos';

describe('searchRepositories', () => {
  it('should search for repositories', async () => {
    const mockOctokit = {
      search: {
        repos: jest.fn().mockResolvedValue({
          data: {
            items: [
              {
                full_name: 'user/repo',
                description: 'Test repo',
                stargazers_count: 100,
                forks_count: 10,
                language: 'TypeScript',
                html_url: 'https://github.com/user/repo',
                updated_at: '2025-01-01'
              }
            ]
          }
        })
      }
    };
    
    const result = await searchRepositories(
      { query: 'test', limit: 10 },
      mockOctokit as any
    );
    
    expect(result.content[0].type).toBe('text');
    expect(JSON.parse(result.content[0].text).repositories).toHaveLength(1);
  });

  it('should handle rate limit errors', async () => {
    const mockOctokit = {
      search: {
        repos: jest.fn().mockRejectedValue({ status: 403 })
      }
    };
    
    const result = await searchRepositories(
      { query: 'test' },
      mockOctokit as any
    );
    
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rate limit');
  });
});
```

#### **Step 8: Build & Package**

```bash
# Compile TypeScript
npm run build

# Test
npm test

# Package as Desktop Extension (if creating .dxt)
# Create manifest.json
```

```json
// manifest.json
{
  "name": "github-repo-manager",
  "version": "1.0.0",
  "description": "GitHub repository management tools for Claude",
  "type": "node",
  "command": "node",
  "args": ["dist/index.js"],
  "config": {
    "githubToken": {
      "description": "GitHub Personal Access Token (for private repos and higher rate limits)",
      "type": "string",
      "sensitive": true,
      "required": false
    }
  }
}
```

```bash
# Create .dxt package
zip -r github-repo-manager.dxt dist/ manifest.json SKILL.md package.json
```

#### **Step 9: Local Testing**

```bash
# Test stdio communication directly
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{}}}' | node dist/index.js

# Install in Claude Desktop
# Copy to config
cat >> ~/Library/Application\ Support/Claude/claude_desktop_config.json << EOF
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["$PWD/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your-token-here"
      }
    }
  }
}
EOF

# Restart Claude Desktop
```

---

## 7. Quality Checklist

### Pre-Deployment Checklist

#### Schema Completeness
- [ ] All tools have complete `inputSchema` with descriptions
- [ ] All required parameters are clearly marked
- [ ] Enums are used for limited choice parameters
- [ ] Optional parameters have sensible defaults
- [ ] `outputSchema` defined for tools returning structured data
- [ ] All schemas validated with JSON Schema validator

#### Error Handling
- [ ] All tool calls wrapped in try-catch
- [ ] Errors return `isError: true` with descriptive messages
- [ ] Error messages suggest possible fixes
- [ ] Rate limiting errors handled gracefully
- [ ] Timeout handling implemented
- [ ] Partial failure handling for batch operations
- [ ] Network errors handled with retry logic

#### Security
- [ ] Input validation for all parameters
- [ ] Path sanitization (prevent traversal)
- [ ] SQL parameterization (prevent injection)
- [ ] Authentication required for sensitive operations
- [ ] Rate limiting implemented
- [ ] Audit logging for all tool calls
- [ ] Sensitive data not logged
- [ ] User permissions checked before operations

#### Context Optimization
- [ ] Tool responses concise (< 4KB typical, < 100KB max)
- [ ] Resources provide summaries/excerpts when possible
- [ ] Pagination implemented for large result sets
- [ ] Binary data properly base64-encoded
- [ ] File size limits enforced

#### Documentation
- [ ] SKILL.md complete with:
  - Clear description
  - Trigger patterns (when to use)
  - Anti-patterns (when NOT to use)
  - Tool descriptions with parameters
  - Usage examples
  - Error scenarios
- [ ] README with installation instructions
- [ ] API reference generated from schemas
- [ ] Changelog maintained

#### Testing
- [ ] Unit tests for all tool logic (>80% coverage)
- [ ] Integration tests for MCP protocol flow
- [ ] Schema validation tests
- [ ] Error handling tests
- [ ] Security tests (injection, traversal, etc.)
- [ ] Performance tests (latency, throughput)
- [ ] End-to-end agent simulation tests

#### Performance
- [ ] Tool response time < 5s (typical)
- [ ] Tool response time < 30s (maximum)
- [ ] Resource read time < 2s
- [ ] Memory usage reasonable (< 500MB per server)
- [ ] No memory leaks (long-running tests pass)

#### Compatibility
- [ ] Works on macOS (tested)
- [ ] Works on Windows (tested)
- [ ] Works on Linux (tested)
- [ ] Node.js version compatibility documented
- [ ] Python version compatibility documented (if applicable)

---

## 8. Common Pitfalls & Mitigation

### Pitfall 1: Overly Granular Tools

**Problem**: Creating too many low-level tools (e.g., `git_add`, `git_commit`, `git_push` separately)

**Consequence**: LLM struggles to orchestrate multi-step workflows; increased error rates

**Solution**:[^45]
```typescript
// ❌ BAD: Too granular
tools: [
  "git_add",
  "git_commit", 
  "git_push",
  "git_create_branch"
]

// ✅ GOOD: Workflow-oriented
tools: [
  "commit_and_push",  // Combines add, commit, push
  "create_pull_request"  // Creates branch + commits + opens PR
]
```

### Pitfall 2: Insufficient Error Context

**Problem**: Generic error messages like "Failed to execute"

**Consequence**: LLM cannot adjust strategy; user frustrated

**Solution**:
```typescript
// ❌ BAD
catch (error) {
  return { isError: true, content: [{ type: "text", text: "Failed" }] };
}

// ✅ GOOD
catch (error) {
  return {
    isError: true,
    content: [{
      type: "text",
      text: `Failed to ${operation}: ${error.message}\n\n` +
            `Possible causes:\n` +
            `1. API key expired - regenerate token\n` +
            `2. Resource not found - verify name\n` +
            `3. Insufficient permissions - check access level\n\n` +
            `Current context: ${JSON.stringify(context)}`
    }]
  };
}
```

### Pitfall 3: Not Respecting Roots Boundaries

**Problem**: File operations access paths outside declared roots

**Consequence**: Security vulnerability; unexpected behavior

**Solution**:[^46]
```typescript
// ❌ BAD: No validation
function readFile(path: string) {
  return fs.readFileSync(path, 'utf-8');
}

// ✅ GOOD: Validate against roots
function readFile(path: string, roots: string[]) {
  const normalized = path.resolve(path);
  const allowed = roots.some(root => normalized.startsWith(root));
  
  if (!allowed) {
    throw new Error(`Access denied: ${path} is outside allowed roots`);
  }
  
  return fs.readFileSync(normalized, 'utf-8');
}
```

### Pitfall 4: Forgetting Capability Negotiation

**Problem**: Using features without checking if declared

**Consequence**: Protocol errors; tools don't appear

**Solution**:[^47]
```typescript
// ❌ BAD: Assume sampling is available
async function needsLLM() {
  return await client.sampling.createMessage(...);
}

// ✅ GOOD: Check capability first
async function needsLLM() {
  if (!clientCapabilities.sampling) {
    return { error: "LLM sampling not supported by this client" };
  }
  return await client.sampling.createMessage(...);
}
```

### Pitfall 5: Not Handling Concurrent Requests

**Problem**: Server has mutable state, doesn't handle parallel tool calls

**Consequence**: Race conditions, data corruption

**Solution**:
```typescript
// ❌ BAD: Mutable shared state
let currentOperation = null;

async function executeTool(name, args) {
  currentOperation = { name, args };  // Race condition!
  const result = await doWork();
  currentOperation = null;
  return result;
}

// ✅ GOOD: Stateless or proper synchronization
async function executeTool(name, args) {
  const operation = { name, args };  // Local state
  const result = await doWork(operation);
  return result;
}
```

### Pitfall 6: Excessive Resource Pre-Loading

**Problem**: Listing all files in resource/list, overwhelming context

**Consequence**: Context overflow; slow performance

**Solution**:[^48]
```typescript
// ❌ BAD: Return everything
resources/list → { resources: [10000 files] }

// ✅ GOOD: Paginate and summarize
resources/list → { 
  resources: [20 most recent files],
  nextCursor: "page2",
  total: 10000
}
```

### Pitfall 7: Ignoring Rate Limits

**Problem**: No rate limiting on expensive operations

**Consequence**: API costs explode; service degradation

**Solution**:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // 100 requests per window
  message: "Too many requests, please try again later"
});

app.use('/mcp', limiter);
```

### Pitfall 8: Hard-Coding Configuration

**Problem**: API keys, URLs in source code

**Consequence**: Security risk; inflexible deployment

**Solution**:[^49]
```typescript
// ❌ BAD
const API_KEY = "sk-1234567890";

// ✅ GOOD: Environment variables
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable required");
}

// ✅ BETTER: Extension manifest config
manifest.json:
{
  "config": {
    "apiKey": {
      "type": "string",
      "sensitive": true,
      "required": true
    }
  }
}
```

---

## 9. Scaling & Governance

### 9.1 Managing Hundreds of Skills

#### **Discovery & Registry**

**Challenge**: Users need to find relevant skills among hundreds

**Solution**: Centralized Skill Registry

```typescript
// skill-registry.ts
interface SkillMetadata {
  id: string;
  name: string;
  description: string;
  category: string[];  // ["development", "productivity", etc.]
  tags: string[];
  version: string;
  author: string;
  downloads: number;
  rating: number;
  lastUpdated: string;
}

class SkillRegistry {
  async search(query: string, filters: any): Promise<SkillMetadata[]> {
    // Full-text search + filtering
    return await db.skills.search({
      query,
      categories: filters.categories,
      minRating: filters.minRating
    });
  }

  async getPopular(limit: number): Promise<SkillMetadata[]> {
    return await db.skills.find().sort({ downloads: -1 }).limit(limit);
  }

  async getByCategory(category: string): Promise<SkillMetadata[]> {
    return await db.skills.find({ category });
  }
}
```

**UI Integration**:
- Browse by category (Dev Tools, Data Science, Business, etc.)
- Search by keywords
- Filter by rating, popularity, recent updates
- "Recommended for You" based on usage patterns

#### **Versioning Strategy**

**Semantic Versioning**: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (incompatible schema changes)
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

**Compatibility Matrix**:
```json
{
  "skill": "github-manager",
  "version": "2.1.0",
  "compatibility": {
    "mcpProtocol": ">=2025-06-18",
    "claudeDesktop": ">=1.5.0",
    "node": ">=18.0.0"
  }
}
```

**Deprecation Process**:
1. **Announce** (v2.0.0): Mark feature as deprecated in docs
2. **Warn** (v2.1.0): Tool returns warning when used
3. **Remove** (v3.0.0): Feature removed in next major version

#### **Dependency Management**

**Problem**: Skill A depends on Skill B

**Solution**: Declare dependencies in manifest

```json
{
  "name": "advanced-git",
  "dependencies": {
    "github-manager": "^2.0.0",
    "file-system": "^1.5.0"
  }
}
```

**Installation**: Dependency resolver ensures all required skills installed

### 9.2 Governance & Quality Control

#### **Submission Process**

1. **Developer submits** skill to registry
2. **Automated checks**:
   - Schema validation
   - Security scan (static analysis)
   - License verification
   - Dependency audit
3. **Manual review** (for featured/promoted skills):
   - Code quality
   - Documentation completeness
   - Test coverage
4. **Approval** → Published to registry

#### **Quality Badges**

```
✓ Verified Publisher
✓ High Test Coverage (>80%)
✓ Security Scanned
✓ Recently Updated
✓ Popular (>10K downloads)
```

#### **Security Scanning**

**Automated Checks**:
- Dependency vulnerabilities (npm audit, safety)
- Static analysis (ESLint, Bandit)
- License compliance
- Secrets detection (no hardcoded keys)

**Manual Review**:
- Privilege escalation attempts
- Suspicious network activity
- Data exfiltration patterns

#### **User Reporting & Feedback**

**Feedback Loop**:
```typescript
interface SkillFeedback {
  skillId: string;
  userId: string;
  rating: number;  // 1-5 stars
  comment: string;
  category: "bug" | "feature-request" | "security" | "praise";
  timestamp: Date;
}

// Aggregate metrics
{
  "totalRatings": 1523,
  "averageRating": 4.7,
  "commonIssues": [
    "Rate limiting too aggressive",
    "Needs better error messages"
  ]
}
```

**Response SLA**:
- Critical security issues: 24 hours
- Major bugs: 7 days
- Feature requests: Triage in 30 days

### 9.3 Maintenance Strategy

#### **Automated Monitoring**

```typescript
// monitoring.ts
const metrics = {
  toolCallRate: new Gauge('mcp_tool_calls_per_minute'),
  errorRate: new Gauge('mcp_error_rate'),
  p95Latency: new Histogram('mcp_tool_latency_p95'),
  activeUsers: new Gauge('mcp_active_users')
};

// Alert rules
if (errorRate > 5%) {
  alert("High error rate detected");
}

if (p95Latency > 10000) {  // 10 seconds
  alert("High latency detected");
}
```

**Dashboards**:
- Usage trends (calls/day, users/day)
- Error breakdown (by tool, by error type)
- Performance metrics (latency, throughput)
- User satisfaction (ratings, feedback)

#### **Deprecation & Sunset**

**Process**:
1. **Announce** (t=0): Deprecation notice in docs + in-app warning
2. **Grace Period** (t+90 days): Skill continues to work, warnings shown
3. **Disable** (t+180 days): Skill stops working, users must upgrade

**Migration Support**:
- Provide migration guide to replacement skill
- Auto-suggest replacement in deprecation warning
- Offer one-click migration for common cases

#### **Continuous Improvement**

**Feedback Integration**:
1. Collect usage analytics + user feedback
2. Identify top issues/feature requests
3. Prioritize based on impact (users affected × severity)
4. Implement + release
5. Measure improvement

**A/B Testing**:
- Test schema improvements (better descriptions)
- Test workflow optimizations (combined vs. separate tools)
- Measure: success rate, user satisfaction, time to completion

---

## 10. Code Templates & Stubs

### 10.1 Minimal Server Template (TypeScript)

```typescript
// minimal-server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// Initialize server
const server = new Server(
  { name: "my-skill", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Define tools
const TOOLS = [
  {
    name: "example_tool",
    description: "Example tool that does something useful",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string", description: "Input parameter" }
      },
      required: ["input"]
    }
  }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "example_tool") {
    return {
      content: [{
        type: "text",
        text: `Processed: ${args.input}`
      }]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
```

### 10.2 Minimal Server Template (Python)

```python
# minimal_server.py
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

app = Server("my-skill")

TOOLS = [
    Tool(
        name="example_tool",
        description="Example tool that does something useful",
        inputSchema={
            "type": "object",
            "properties": {
                "input": {
                    "type": "string",
                    "description": "Input parameter"
                }
            },
            "required": ["input"]
        }
    )
]

@app.list_tools()
async def list_tools():
    return TOOLS

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "example_tool":
        return [TextContent(
            type="text",
            text=f"Processed: {arguments['input']}"
        )]
    
    raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    stdio_server(app)
```

### 10.3 Tool Template with Error Handling

```typescript
// tool-template.ts
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const myTool: Tool = {
  name: "my_tool",
  title: "My Tool",
  description: "Clear description of what this tool does",
  inputSchema: {
    type: "object",
    properties: {
      // Define parameters here
      param1: {
        type: "string",
        description: "Description of param1"
      }
    },
    required: ["param1"]
  },
  annotations: {
    title: "My Tool",
    readOnlyHint: true,  // true if no side effects
    openWorldHint: false  // true if interacts with external systems
  }
};

export async function executeTool(args: any) {
  // Validate inputs
  if (!args.param1) {
    return {
      isError: true,
      content: [{
        type: "text",
        text: "Missing required parameter: param1"
      }]
    };
  }

  try {
    // Perform operation
    const result = await doWork(args.param1);
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
    
  } catch (error) {
    // Handle specific errors
    if (error instanceof NetworkError) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Network error: ${error.message}\n\n` +
                `Please check your internet connection and try again.`
        }]
      };
    }
    
    if (error instanceof AuthenticationError) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Authentication failed: ${error.message}\n\n` +
                `Please verify your API key is valid and has not expired.`
        }]
      };
    }
    
    // Generic error
    return {
      isError: true,
      content: [{
        type: "text",
        text: `Unexpected error: ${error.message}`
      }]
    };
  }
}
```

### 10.4 Resource Template

```typescript
// resource-template.ts
import { Resource } from "@modelcontextprotocol/sdk/types.js";

export async function listResources() {
  return {
    resources: [
      {
        uri: "myscheme://resource/path",
        name: "Resource Name",
        title: "Human Readable Title",
        description: "What this resource contains",
        mimeType: "application/json"
      }
    ]
  };
}

export async function readResource(uri: string) {
  if (uri === "myscheme://resource/path") {
    const data = await fetchData();
    
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(data, null, 2)
      }]
    };
  }
  
  throw new Error(`Resource not found: ${uri}`);
}
```

### 10.5 Test Template

```typescript
// tool.test.ts
import { executeTool } from './my-tool';

describe('my_tool', () => {
  describe('success cases', () => {
    it('should process valid input', async () => {
      const result = await executeTool({ param1: 'test' });
      
      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('test');
    });
  });

  describe('error cases', () => {
    it('should reject missing parameters', async () => {
      const result = await executeTool({});
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Missing required parameter');
    });

    it('should handle network errors gracefully', async () => {
      // Mock network failure
      jest.spyOn(global, 'fetch').mockRejectedValue(new NetworkError());
      
      const result = await executeTool({ param1: 'test' });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Network error');
    });
  });

  describe('security', () => {
    it('should reject path traversal attempts', async () => {
      const result = await executeTool({ param1: '../../../etc/passwd' });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Access denied');
    });
  });
});
```

---

## 11. Summary & Recommendations

### Key Takeaways

1. **MCP is a standardized protocol** for extending LLMs with external capabilities in a secure, modular way
2. **Skills are packaged units** of tools, resources, and prompts that servers provide to Claude
3. **Security is paramount**: User consent, input validation, sandboxing are non-negotiable
4. **Workflow-oriented design**: Tools should map to complete user tasks, not low-level operations
5. **Error handling matters**: Provide actionable error messages so LLM can adapt
6. **Testing is essential**: Unit tests, integration tests, security tests, agent simulations
7. **Governance enables scale**: Registry, versioning, quality control for hundreds of skills

### Recommended Next Steps

**For Individual Developers**:
1. Start with the minimal server template
2. Implement 2-3 tools solving a specific problem domain
3. Write comprehensive tests (aim for >80% coverage)
4. Create thorough SKILL.md documentation
5. Test locally with Claude Desktop
6. Submit to community registry

**For Enterprise Teams**:
1. Establish skill development standards (this blueprint)
2. Create internal skill registry with governance process
3. Build CI/CD pipeline for skill deployment
4. Implement monitoring & analytics
5. Train team on security best practices
6. Start with 3-5 pilot skills, iterate based on feedback

**For the Ecosystem**:
1. Contribute example skills to open source
2. Share lessons learned (blog posts, talks)
3. Improve tooling (better SDKs, testing frameworks)
4. Build discovery mechanisms (skill search, recommendations)
5. Establish security standards (certification program)

---

## References

[^1]: MCP Technical Knowledge Base, "Introduction - Model Context Protocol"
[^2]: MCP Technical Knowledge Base, "What is MCP?"
[^3]: MCP Technical Knowledge Base, "Core Components"
[^4]: MCP Technical Knowledge Base, "Core architecture"
[^5]: MCP Technical Knowledge Base, "Design Goals"
[^6]: MCP Technical Knowledge Base, "Transports - Model Context Protocol"
[^7]: MCP Technical Knowledge Base, "Standard I/O (stdio)"
[^8]: MCP Technical Knowledge Base, "Connection Lifecycle"
[^9]: MCP Technical Knowledge Base, "JSON-RPC Messaging"
[^10]: MCP Technical Knowledge Base, "Bidirectional"
[^11]: MCP Technical Knowledge Base, "Resources (Server Feature)"
[^12]: MCP Technical Knowledge Base, "What are Resources?"
[^13]: MCP Technical Knowledge Base, "Prompts (Server Feature)"
[^14]: MCP Technical Knowledge Base, "What are Prompts?"
[^15]: MCP Technical Knowledge Base, "Tools (Server Feature)"
[^16]: MCP Technical Knowledge Base, "What are Tools?"
[^17]: MCP Technical Knowledge Base, "Sampling (Client Feature)"
[^18]: MCP Technical Knowledge Base, "What is Sampling?"
[^19]: MCP Technical Knowledge Base, "Claude Desktop does not yet support sampling"
[^20]: MCP Technical Knowledge Base, "Roots (Client Feature)"
[^21]: MCP Technical Knowledge Base, "What are Roots?"
[^22]: MCP Technical Knowledge Base, "Elicitation (Client Feature)"
[^23]: MCP Technical Knowledge Base, "What is Elicitation?"
[^24]: MCP Technical Knowledge Base, "Tool Names"
[^25]: MCP Technical Knowledge Base, "URI Format"
[^26]: MCP Technical Knowledge Base, "Error Handling Patterns"
[^27]: MCP Technical Knowledge Base, "Protocol-Level Errors"
[^28]: MCP Technical Knowledge Base, "tool execution errors should generally be reported in the result"
[^29]: MCP Technical Knowledge Base, "Context-Budget Awareness"
[^30]: MCP Technical Knowledge Base, "Clear Error Messages"
[^31]: MCP Technical Knowledge Base, "Security and Trust Model"
[^32]: MCP Technical Knowledge Base, "Security-First Design"
[^33]: MCP Technical Knowledge Base, "Input Schema Best Practices"
[^34]: MCP Technical Knowledge Base, "Output Schema"
[^35]: Local MCP Servers on Claude Desktop, "Local Config File"
[^36]: MCP Technical Knowledge Base, "Security Considerations for Tools"
[^37]: MCP Technical Knowledge Base, "Input validation"
[^38]: Local MCP Servers on Claude Desktop, "Desktop Extensions"
[^39]: Local MCP Servers on Claude Desktop, "Extension Manifest & Sensitive Config"
[^40]: MCP Technical Knowledge Base, "Claude Code SDK"
[^41]: MCP Technical Knowledge Base, "Tool Safety"
[^42]: MCP Technical Knowledge Base, "Consider pagination"
[^43]: MCP Technical Knowledge Base, "Validate all resource URIs server-side"
[^44]: MCP Technical Knowledge Base, "Security"
[^45]: MCP Technical Knowledge Base, "Workflow-Oriented Tools"
[^46]: MCP Technical Knowledge Base, "Roots provide a mechanism for the client to inform the server about relevant root URIs"
[^47]: MCP Technical Knowledge Base, "Capability Negotiation"
[^48]: MCP Technical Knowledge Base, "Listing Resources"
[^49]: Local MCP Servers on Claude Desktop, "Environment Variables"

---

**Document Version**: 1.0  
**Last Updated**: November 10, 2025  
**Author**: Expert-MCP-Builder  
**Status**: Complete Technical Blueprint
**GITHUB** https://github.com/anthropics/skills/tree/c74d647e56e6daa12029b6acb11a821348ad044b/mcp-builder

This comprehensive guide provides engineering teams with everything needed to design, implement, test, deploy, and scale custom MCP skills for Claude. All recommendations are grounded in official MCP specification and Anthropic documentation.