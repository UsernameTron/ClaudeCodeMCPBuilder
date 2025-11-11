# MCP Builder Development Guide

**For:** Claude Code and AI assistants working with this codebase
**Last Updated:** 2025-11-10
**Certification Status:** ✅ Production Ready (Certified 2025-11-10T23:08)

This guide provides comprehensive information about the MCP Builder project structure, capabilities, and development workflows.

---

## Table of Contents

1. [Repository Purpose](#repository-purpose)
2. [Repository Structure](#repository-structure)
3. [Key Capabilities](#key-capabilities)
4. [Source Code Organization](#source-code-organization)
5. [Example Systems](#example-systems)
6. [Code Generation](#code-generation)
7. [Security Infrastructure](#security-infrastructure)
8. [Testing & Quality](#testing--quality)
9. [CI/CD & Deployment](#cicd--deployment)
10. [Development Workflows](#development-workflows)
11. [MCP Protocol Reference](#mcp-protocol-reference)

---

## Repository Purpose

MCP Builder is a **production-ready, certified toolkit** for creating Model Context Protocol (MCP) servers. It combines:

### Core Components

1. **Comprehensive MCP Documentation**
   - Full technical specification (MCP spec 2025-06-18)
   - Implementation patterns and best practices
   - Protocol architecture and communication flows
   - Server-side primitives (Resources, Prompts, Tools)
   - Client-side features (Sampling, Roots, Elicitation)

2. **Dual Code Generation Approaches**
   - **Template-Based**: Fast scaffolding with customizable stubs
   - **Production Example Cloning**: Full-featured, battle-tested servers

3. **Security-First Design**
   - OWASP-compliant path sanitization (100% test coverage)
   - XSS prevention with 8 sanitization methods (100% test coverage)
   - Filesystem boundary checking (98.11% test coverage)
   - 211 security tests, all passing

4. **Comprehensive Testing Infrastructure**
   - 454 total tests across 12 test suites
   - 88.38% overall coverage (exceeds 70% threshold)
   - E2E test suite with 7 scenarios
   - MCP test client for integration testing

5. **Production Examples**
   - 5 complete, tested MCP server implementations from Anthropic
   - Memory (knowledge graph), Filesystem, GitHub, PostgreSQL, Slack
   - Deployable to Claude Desktop immediately

---

## Repository Structure

```
MCP Building/
├── src/                              # 772KB source code (47 TypeScript files)
│   ├── cli/                         # Interactive CLI
│   │   └── create-server.ts        # Server generation wizard
│   ├── generator/                   # Template-based generation
│   │   ├── index.ts                # Core generation orchestration
│   │   ├── types.ts                # TypeScript interfaces
│   │   ├── templates/              # 8 code generation templates (1,424 lines)
│   │   │   ├── server-index.ts    # Main entry point template
│   │   │   ├── tools.ts           # Tools module template
│   │   │   ├── resources.ts       # Resources module template
│   │   │   ├── prompts.ts         # Prompts module template
│   │   │   ├── tests.ts           # Test file template
│   │   │   ├── readme.ts          # README generator
│   │   │   ├── package.ts         # package.json generator
│   │   │   └── tsconfig.ts        # TypeScript config generator
│   │   ├── validation/             # Pre-generation validation
│   │   │   ├── capabilityValidator.ts  # Ensures valid configs
│   │   │   └── index.ts
│   │   └── validators/             # Post-generation validation
│   │       ├── postGenerationValidator.ts  # Validates generated code
│   │       └── index.ts
│   ├── examples/                    # Production MCP servers + stub configs
│   │   ├── catalog.ts              # Metadata for production examples
│   │   ├── generator.ts            # Production example cloning system
│   │   ├── memory/                 # Knowledge graph server (482 lines + tests)
│   │   ├── filesystem/             # Secure filesystem server (705 lines + tests)
│   │   ├── github/                 # GitHub integration (516 lines)
│   │   ├── postgres/               # PostgreSQL server
│   │   ├── slack/                  # Slack integration
│   │   ├── weather-server.ts       # Stub: Tools example config
│   │   ├── filesystem-server.ts    # Stub: Resources example config
│   │   ├── database-server.ts      # Stub: Mixed example config
│   │   └── index.ts                # Unified exports
│   ├── packaging/                   # .mcpb bundle generation
│   │   ├── mcpb-generator.ts       # Manifest creation
│   │   └── index.ts
│   ├── testing/                     # Testing infrastructure
│   │   ├── mcp-test-client.ts      # Full-featured test client
│   │   ├── test-helpers.ts         # 15+ assertion helpers
│   │   └── index.ts
│   └── utils/                       # Shared utilities
│       ├── security/                # Security utilities (100% coverage)
│       │   ├── pathSanitization.ts # OWASP-compliant path validation
│       │   ├── xssPrevention.ts    # XSS sanitization (8 methods)
│       │   └── index.ts
│       └── filesystem/              # Filesystem utilities
│           ├── boundaryChecker.ts  # Root boundary enforcement
│           └── index.ts
├── scripts/                         # Build and test scripts
│   └── test-example-generation.sh  # E2E test runner
├── .github/workflows/               # CI/CD pipelines
│   ├── ci.yml                      # Multi-version testing (Node 18/20/22)
│   └── release.yml                 # Release automation
├── docs/
│   └── archive/                    # 20 historical development reports
├── dist/                           # 648KB compiled JavaScript (gitignored)
├── coverage/                       # Test coverage reports (gitignored)
├── deployment-verification/        # Certification artifacts (gitignored)
├── generated-servers/              # User-generated servers (gitignored)
├── DEVELOPMENT-GUIDE.md            # This file (replaces CLAUDE.md)
├── ClaudeMCP.md                    # MCP technical specification (2,620 lines)
├── README.md                       # Project overview (309 lines)
├── package.json                    # Dependencies and scripts
└── tsconfig.json                   # TypeScript configuration
```

---

## Key Capabilities

### 1. Two-Tier Code Generation

#### Approach A: Template-Based (Fast Scaffolding)
**Use when:** Starting from scratch, learning MCP, custom requirements

```bash
npm run create-server
```

**Features:**
- Interactive CLI with inquirer prompts
- Minimal, customizable code stubs
- Security patterns built-in
- Test scaffolding
- Documentation generation

**Output:** 7-9 files, ~1.5KB of TypeScript code to customize

#### Approach B: Production Example Cloning
**Use when:** Need battle-tested implementation, specific use case match

```bash
npm run create-server -- --from-example memory --name my-knowledge-graph
```

**Features:**
- Complete, tested implementations
- Authentication patterns
- Error handling
- Rate limiting
- Comprehensive tests

**Output:** Full server with 300-700 lines of production code

### 2. Security Infrastructure

**PathSanitizer** (100% test coverage, 68 tests)
- Path traversal prevention (../, encoded variants, null bytes)
- URL encoding attack prevention
- Symlink attack prevention
- Root boundary enforcement
- OWASP-compliant

**XSSPrevention** (100% test coverage, 91 tests)
- 8 sanitization methods for different contexts
- Event handler blocking (40+ patterns)
- HTML entity encoding
- Script tag removal
- URL validation

**BoundaryChecker** (98.11% test coverage, 52 tests)
- Multi-root directory support
- Automatic path validation
- Safe file operations
- Directory traversal prevention

### 3. Validation Systems

**Pre-Generation Validation** (97.87% coverage)
- Ensures at least one capability enabled
- Validates configuration consistency
- Prevents generating broken servers
- Clear, actionable error messages

**Post-Generation Validation** (95.23% coverage)
- Validates generated code structure
- TypeScript syntax checking
- File existence verification
- package.json validation
- Returns warnings and errors with file locations

### 4. Testing Infrastructure

**Test Suites:** 12 suites, 454 tests
- Unit tests for all core functionality
- Security test suites (211 tests)
- Example server tests (memory, filesystem)
- E2E generation tests (7 scenarios)

**Test Utilities:**
- `MCPTestClient` - Full integration testing client
- `assertNotError` - Tool response validation
- `assertHasTool` - Tool existence checks
- `assertHasResource` - Resource validation
- `assertSecurityBlocked` - Security test helpers
- 10+ additional assertion helpers

**Coverage Requirements:**
- Overall: ≥70% (achieved: 88.38%)
- Critical modules: ≥80% (achieved: 97.87-100%)

---

## Source Code Organization

### Generator System (src/generator/)

**Core Files:**
- `index.ts` (173 lines) - Main generation orchestration, file creation
- `types.ts` (92 lines) - TypeScript interfaces for configs

**Templates (src/generator/templates/)**
All templates generate production-ready code with:
- Security: Input validation, path sanitization, rate limiting
- Error handling: Actionable messages with suggested fixes
- MCP compliance: Spec version 2025-06-18
- TypeScript: Strict mode enabled
- Documentation: JSDoc comments, README generation

| Template | Lines | Purpose |
|----------|-------|---------|
| `server-index.ts` | 139 | Main entry point with MCP SDK setup |
| `tools.ts` | 252 | Tool definitions and handlers |
| `resources.ts` | 282 | Resource handlers with subscriptions |
| `prompts.ts` | 154 | Prompt templates with arguments |
| `tests.ts` | 195 | Test file with MCPTestClient |
| `readme.ts` | 345 | Usage documentation generator |
| `package.ts` | 35 | package.json with dependencies |
| `tsconfig.ts` | 22 | TypeScript configuration |

**Validation (src/generator/validation/ and validators/)**
- Pre-generation: Capability configuration validation
- Post-generation: Code structure and syntax validation
- Error reporting: File locations and suggested fixes

### CLI System (src/cli/)

**create-server.ts** (197 lines)
Interactive wizard with:
- Server name validation (lowercase, numbers, hyphens)
- Type selection (tools, resources, prompts, mixed)
- Feature toggles (subscriptions, listChanged, structured outputs)
- Example source selection (template vs. production example)
- Test generation
- Auto npm install

**Command-line flags:**
```bash
--name <name>           # Server name
--type <type>           # tools, resources, prompts, mixed
--description <desc>    # Server description
--output <path>         # Output directory
--skip-install          # Skip npm install
--no-examples           # Don't include example implementations
--no-tests              # Don't generate tests
--from-example <name>   # Clone production example (memory, filesystem, etc.)
```

### Security Utilities (src/utils/security/)

**pathSanitization.ts**
```typescript
class PathSanitizer {
  constructor(rootPath: string)
  sanitize(inputPath: string): string
  validateExistingPath(inputPath: string): Promise<string>
  isWithinRoot(resolvedPath: string): boolean
}
```

**xssPrevention.ts**
```typescript
// 8 sanitization methods
escapeHtml(text: string): string
sanitizeHtml(html: string): string
escapeAttribute(value: string): string
sanitizeUrl(url: string): string
sanitizeJson(json: string): string
removeScripts(html: string): string
blockEventHandlers(html: string): string
validateUrl(url: string, allowedProtocols?: string[]): boolean
```

### Filesystem Utilities (src/utils/filesystem/)

**boundaryChecker.ts**
```typescript
class BoundaryChecker {
  constructor(roots: string[])
  async validatePath(path: string): Promise<string>
  async readFile(path: string): Promise<string>
  async writeFile(path: string, content: string): Promise<void>
  async deleteFile(path: string): Promise<void>
}
```

---

## Example Systems

### Stub Examples (Template Configurations)

Located in `src/examples/`, these are **configuration objects** used with the template generator:

**weather-server.ts** (4.2KB)
```typescript
export const weatherServerConfig: ServerConfig = {
  name: 'weather-server',
  type: 'tools',
  capabilities: {
    tools: {
      implementations: [
        { name: 'get_current_weather', description: '...' },
        { name: 'get_forecast', description: '...' }
      ]
    }
  }
}
```

**Use case:** Quick scaffolding with customization needed

### Production Examples (Full Implementations)

Located in `src/examples/*/`, these are **complete, tested MCP servers** from Anthropic:

#### 1. Memory Server (Knowledge Graph)
**Path:** `src/examples/memory/`
**Size:** 482 lines + tests
**Features:**
- JSONL-based knowledge graph storage
- Entity and relationship management
- Full-text search
- Test suite included

**Complexity:** Medium
**Auth:** None
**Dependencies:** File system access

#### 2. Filesystem Server (Secure File Operations)
**Path:** `src/examples/filesystem/`
**Size:** 705 lines + 5 test suites
**Features:**
- Path sanitization and validation
- Root boundary enforcement
- Directory tree generation
- File diffs with minimatch
- Comprehensive security tests

**Complexity:** High
**Auth:** None
**Dependencies:** diff, minimatch

#### 3. GitHub Server (GitHub API Integration)
**Path:** `src/examples/github/`
**Size:** 516 lines + operations/
**Features:**
- Repository operations
- Issue management
- Pull request handling
- OAuth authentication

**Complexity:** High
**Auth:** GitHub Personal Access Token
**Dependencies:** @octokit/rest

#### 4. PostgreSQL Server (Database Integration)
**Path:** `src/examples/postgres/`
**Features:**
- Database connection management
- Query execution
- Schema inspection
- Transaction support

**Complexity:** High
**Auth:** Database credentials
**Dependencies:** pg (PostgreSQL client)

#### 5. Slack Server (Messaging Integration)
**Path:** `src/examples/slack/`
**Features:**
- Channel operations
- Message posting
- User management
- Webhook support

**Complexity:** High
**Auth:** Slack API token
**Dependencies:** @slack/web-api

### Example Catalog System

**src/examples/catalog.ts** (211 lines)
Metadata for all production examples:
```typescript
interface ExampleMetadata {
  id: string
  name: string
  description: string
  category: 'tools' | 'resources' | 'mixed'
  complexity: 'simple' | 'medium' | 'advanced'
  features: string[]
  authRequired: boolean
  dependencies: string[]
}
```

### Example Generator

**src/examples/generator.ts** (375 lines)
```typescript
async function generateFromExample(
  exampleId: string,
  serverName: string,
  outputPath: string,
  options: GenerationOptions
): Promise<void>
```

Clones complete production example with:
- Configuration adaptation
- README generation
- Dependency management
- Test suite inclusion

---

## Code Generation

### Generated Server Structure

When you run `npm run create-server`, the output is:

```
my-server/
├── src/
│   ├── index.ts              # Server entry point with MCP SDK
│   ├── tools/                # If tools capability enabled
│   │   └── index.ts         # Tool definitions and handlers
│   ├── resources/            # If resources capability enabled
│   │   └── index.ts         # Resource handlers
│   └── prompts/              # If prompts capability enabled
│       └── index.ts         # Prompt templates
├── tests/                    # If --no-tests not specified
│   └── server.test.ts       # Test suite with MCPTestClient
├── package.json              # With @modelcontextprotocol/sdk
├── tsconfig.json             # TypeScript strict mode config
├── .gitignore                # Standard Node.js ignores
└── README.md                 # Usage documentation
```

### Template Features

All generated code includes:

**Security:**
- Input validation against JSON Schema
- Path sanitization for file operations
- Rate limiting configuration
- XSS prevention in outputs

**Error Handling:**
- Try-catch blocks
- Actionable error messages
- Suggested fixes in errors
- `isError: true` in content (not protocol-level errors)

**MCP Compliance:**
- Spec version 2025-06-18
- Proper capability declaration
- Correct request/response schemas
- Change notification support

**Documentation:**
- JSDoc comments on all functions
- README with configuration steps
- Usage examples
- Troubleshooting section

### Customization Points

After generation, customize:

1. **Tool Logic** (`src/tools/index.ts`)
   - Add actual implementation
   - Connect to APIs/databases
   - Implement error handling

2. **Resource Data** (`src/resources/index.ts`)
   - Define data sources
   - Implement caching
   - Add subscriptions

3. **Prompt Templates** (`src/prompts/index.ts`)
   - Craft prompt messages
   - Add dynamic arguments
   - Include multi-turn sequences

4. **Configuration** (`package.json`, `tsconfig.json`)
   - Add dependencies
   - Adjust build settings
   - Configure scripts

---

## Security Infrastructure

### OWASP Compliance

All security utilities follow OWASP guidelines:
- Path traversal prevention
- XSS mitigation
- Input validation
- Output encoding

### Security Test Coverage

**211 security tests, 100% passing:**
- 68 path sanitization tests
- 91 XSS prevention tests
- 52 boundary checker tests

### Security Patterns in Generated Code

```typescript
// Path sanitization example
import { PathSanitizer } from './utils/security'

const sanitizer = new PathSanitizer('/safe/root')
const safePath = sanitizer.sanitize(userInput)

// XSS prevention example
import { escapeHtml } from './utils/security'

const safeOutput = escapeHtml(userContent)

// Boundary checking example
import { BoundaryChecker } from './utils/filesystem'

const checker = new BoundaryChecker(['/allowed/root'])
await checker.validatePath(userPath)
```

### Common Security Patterns

1. **File Operations**: Always use BoundaryChecker
2. **User Input**: Always use PathSanitizer for paths
3. **HTML Output**: Always use XSS prevention methods
4. **URLs**: Validate with `validateUrl()` before use
5. **JSON**: Escape with `sanitizeJson()` before output

---

## Testing & Quality

### Test Coverage (Certified 2025-11-10)

| Metric | Coverage | Threshold | Status |
|--------|----------|-----------|--------|
| Overall | 88.38% | ≥70% | ✅ PASS |
| Statements | 88.38% | ≥70% | ✅ PASS |
| Branches | 81.92% | ≥70% | ✅ PASS |
| Functions | 95.65% | ≥70% | ✅ PASS |
| Lines | 88.09% | ≥70% | ✅ PASS |

### Critical Module Coverage (≥80% threshold)

| Module | Coverage | Status |
|--------|----------|--------|
| capabilityValidator.ts | 97.87% | ✅ PASS |
| postGenerationValidator.ts | 95.23% | ✅ PASS |
| pathSanitization.ts | 100% | ✅ PASS |
| xssPrevention.ts | 100% | ✅ PASS |
| boundaryChecker.ts | 98.11% | ✅ PASS |

### Test Suites

**12 test files, 454 tests total:**

1. `boundaryChecker.test.ts` (52 tests)
   - Root validation
   - Path checking
   - File operations
   - Security boundaries

2. `capabilityValidator.test.ts` (47 tests)
   - Configuration validation
   - Error cases
   - Edge cases

3. `pathSanitization.test.ts` (68 tests)
   - Path traversal attacks
   - Null byte injection
   - URL encoding attacks
   - Symlink attacks

4. `xssPrevention.test.ts` (91 tests)
   - HTML escaping
   - Script removal
   - Event handler blocking
   - URL validation

5. `postGenerationValidator.test.ts` (23 tests)
   - File structure validation
   - TypeScript syntax checking
   - Package.json validation

6-12. Example server tests (173 tests)
   - Memory server (39 tests)
   - Filesystem server (134 tests)

### E2E Test Suite (7 scenarios)

**Script:** `scripts/test-example-generation.sh`

Scenarios:
1. ✅ Tools server generation
2. ✅ Resources server generation
3. ✅ Prompts server generation
4. ✅ Mixed server generation
5. ✅ Invalid config validation (should fail)
6. ✅ Server without tests
7. ✅ No capabilities rejection (should fail)

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# E2E tests
npm run test:e2e

# Specific test file
npm test -- path/to/test.ts
```

### Test Utilities

**MCPTestClient** (`src/testing/mcp-test-client.ts`)
```typescript
const client = await createTestClient({
  serverPath: './my-server/dist/index.js'
})

// Test tools
const tools = await client.listTools()
const result = await client.callTool('my_tool', { arg: 'value' })

// Test resources
const resources = await client.listResources()
const data = await client.readResource('my://resource')

// Test prompts
const prompts = await client.listPrompts()
const prompt = await client.getPrompt('my-prompt', { arg: 'value' })

await client.close()
```

**Test Helpers** (`src/testing/test-helpers.ts`)
```typescript
import {
  assertNotError,
  assertHasTool,
  assertHasResource,
  assertToolHasSchema,
  assertSecurityBlocked,
  testServer
} from './testing'

// Assertion examples
assertNotError(toolResult)
assertHasTool(tools, 'my_tool')
assertHasResource(resources, 'my://resource')
assertToolHasSchema(tool, 'my_parameter')
assertSecurityBlocked(result, 'path traversal')

// Server test wrapper
await testServer('./server/dist/index.js', async (client) => {
  const tools = await client.listTools()
  expect(tools).toBeDefined()
})
```

---

## CI/CD & Deployment

### GitHub Actions Workflows

#### CI Workflow (.github/workflows/ci.yml)

**3 parallel jobs:**

1. **Test Job** (Node 18.x, 20.x, 22.x matrix)
   ```yaml
   - Checkout code
   - Setup Node.js
   - Clean install (rm -rf node_modules package-lock.json && npm install)
   - Run linter (npm run lint)
   - Run type check (npm run type-check)
   - Run tests (npm test)
   - Build project (npm run build)
   - Run E2E tests (npm run test:e2e)
   ```

2. **Security Job** (Node 20.x)
   ```yaml
   - Checkout code
   - Setup Node.js
   - Clean install
   - Run security audit (npm audit --audit-level=moderate)
   - Check vulnerabilities (npx snyk test --severity-threshold=high)
   ```

3. **Coverage Job** (Node 20.x)
   ```yaml
   - Checkout code
   - Setup Node.js
   - Clean install
   - Run tests with coverage (npm run test:coverage)
   - Upload to Codecov
   ```

**Note:** Clean install removes both node_modules and package-lock.json to fix rollup optional dependency issues on Linux CI runners.

#### Release Workflow (.github/workflows/release.yml)
- Triggered on version tags
- Automated NPM publishing
- GitHub release creation

### Deployment Certification

**Latest Certification:** 2025-11-10T23:08
**Certification ID:** MCP-BUILDER-20251110-2308
**Status:** ✅ CERTIFIED FOR PRODUCTION DEPLOYMENT

**Verification Results:**
- ✅ Build: 0 errors
- ✅ Tests: 454/454 passing (100%)
- ✅ E2E: 7/7 scenarios passing
- ✅ Security: 0 vulnerabilities
- ✅ Coverage: 88.38% (exceeds 70%)
- ✅ Critical modules: 97.87-100% (exceeds 80%)

**Certification Report:** `deployment-verification/CERTIFICATION-REPORT.md`

### Production Readiness Checklist

- [x] Clean build with zero errors
- [x] Type checking passes
- [x] Overall test coverage ≥70%
- [x] Critical module coverage ≥80%
- [x] All unit tests passing
- [x] All E2E tests passing
- [x] Zero security vulnerabilities
- [x] Security tests 100% passing
- [x] All server types generate correctly
- [x] Documentation complete
- [x] CI/CD workflows present

---

## Development Workflows

### Initial Setup

```bash
# Clone repository
git clone https://github.com/UsernameTron/ClaudeCodeMCPBuilder.git
cd ClaudeCodeMCPBuilder

# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

### Creating a New Server (Template-Based)

```bash
# Interactive mode
npm run create-server

# Or with flags
npm run create-server -- \
  --name my-server \
  --type mixed \
  --description "My MCP Server"

# Navigate to server
cd generated-servers/my-server

# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Run
npm start
```

### Cloning a Production Example

```bash
# Clone memory server
npm run create-server -- \
  --from-example memory \
  --name my-knowledge-base \
  --output ./my-servers

cd my-servers/my-knowledge-base
npm install
npm run build
npm start
```

### Development Cycle

```bash
# Watch mode for generator changes
npm run watch

# After changes, rebuild
npm run build

# Run specific tests
npm test -- src/generator/index.test.ts

# Check coverage
npm run test:coverage

# Lint and fix
npm run lint:fix

# Type check
npm run type-check
```

### Testing Generated Servers

```bash
# Generate test server
npm run create-server -- --name test-server --type tools

# Test with MCP Inspector
cd generated-servers/test-server
npm install
npm run build
npx @modelcontextprotocol/inspector node dist/index.js

# Or test with Claude Desktop
# Add to ~/Library/Application Support/Claude/claude_desktop_config.json
```

### Adding a New Template

1. Create template file in `src/generator/templates/`
2. Export generation function
3. Add to template index
4. Update generator to use template
5. Add tests
6. Update documentation

### Adding a New Example

1. Create directory in `src/examples/`
2. Implement server with tests
3. Add metadata to `src/examples/catalog.ts`
4. Update `src/examples/generator.ts` if needed
5. Add tests
6. Update this guide

---

## MCP Protocol Reference

### Core Concepts

**Model Context Protocol (MCP)** is an open standard enabling LLM applications to integrate with external tools and data sources.

**Three-Tier Architecture:**
1. **Host**: LLM application (e.g., Claude Desktop)
2. **Client**: Connector managing 1:1 session with server
3. **Server**: Standalone program exposing capabilities

### Server-Side Primitives

#### Resources (Application-Controlled)
Expose read-only data/content as additional context for LLM.

**Methods:**
- `resources/list` - List available resources
- `resources/read` - Retrieve resource content by URI
- `resources/subscribe` - Subscribe to resource updates

**Notifications:**
- `notifications/resources/updated` - Resource changed
- `notifications/resources/list_changed` - Available resources changed

#### Tools (Model-Controlled)
Executable actions the LLM can invoke (with user approval).

**Methods:**
- `tools/list` - List available tools
- `tools/call` - Execute tool with arguments

**Annotations:**
- `readOnlyHint` - No side effects
- `destructiveHint` - May perform destructive changes
- `idempotentHint` - Multiple calls have no additional effect
- `openWorldHint` - Interacts with external systems

#### Prompts (User-Controlled)
Pre-defined prompt templates/workflows triggered by users.

**Methods:**
- `prompts/list` - List available prompts
- `prompts/get` - Get prompt content with arguments

### Client-Side Features

- **Sampling**: Server requests LLM completion from client (not yet in Claude Desktop)
- **Roots**: Client informs server about workspace boundaries
- **Elicitation**: Server prompts user for structured input (newly introduced 2025-06-18)

### Communication Protocol

- **Transport**: stdio (local) or HTTP with SSE (remote)
- **Format**: JSON-RPC 2.0
- **Version**: Date-based (2025-06-18)
- **Lifecycle**: initialize → capabilities exchange → initialized notification

### Security & Trust Model

**User Consent Required:**
- Resources: User selects which to include
- Tools: User approves each invocation
- Sampling: User approves prompt and response
- Elicitation: User decides whether to provide info

**Server Responsibilities:**
- Validate all inputs
- Enforce boundary checking
- Implement least privilege
- Provide actionable errors

### Best Practices

1. **Keep responses concise**: < 4KB typical, < 100KB max
2. **Implement pagination**: For large resource/tool lists
3. **Actionable errors**: Include suggested fixes
4. **Schema descriptions**: Detailed for LLM understanding
5. **Security validation**: Server-side, not relying on annotations
6. **Respect roots**: Always validate paths against root boundaries

### Reference Documentation

**Complete specification:** [ClaudeMCP.md](ClaudeMCP.md) (2,620 lines)

**Official sources:**
- https://modelcontextprotocol.io/specification/2025-06-18
- https://docs.anthropic.com/en/docs/mcp

---

## Quick Reference

### Common Commands

```bash
# Setup
npm install && npm run build

# Development
npm run watch              # Watch mode
npm run lint:fix          # Fix lint issues
npm run type-check        # TypeScript validation

# Testing
npm test                  # Run all tests
npm run test:coverage     # With coverage
npm run test:e2e          # E2E tests
npm run test:ui           # Visual test UI

# Generation
npm run create-server     # Interactive mode
npm run create-server -- --help  # See all options

# Build
npm run build             # Compile TypeScript
```

### Important Paths

```
src/generator/templates/  # Code generation templates
src/examples/            # Production examples + stubs
src/utils/security/      # Security utilities
src/testing/             # Test infrastructure
.github/workflows/       # CI/CD pipelines
docs/archive/            # Historical reports
```

### Key Files

```
DEVELOPMENT-GUIDE.md     # This file
ClaudeMCP.md            # MCP specification
README.md               # Project overview
package.json            # Dependencies and scripts
tsconfig.json           # TypeScript configuration
```

### Support

**Documentation:**
- This guide (DEVELOPMENT-GUIDE.md)
- MCP spec (ClaudeMCP.md)
- README (README.md)
- Archived reports (docs/archive/)

**Repository:** https://github.com/UsernameTron/ClaudeCodeMCPBuilder.git
**Issues:** https://github.com/UsernameTron/ClaudeCodeMCPBuilder/issues

---

**Last Updated:** 2025-11-10
**Certification:** ✅ Production Ready (MCP-BUILDER-20251110-2308)
**Version:** 1.0.0
