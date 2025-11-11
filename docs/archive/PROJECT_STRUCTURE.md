# Project Directory Structure - MCP Building

## Overview
This is a comprehensive MCP (Model Context Protocol) development environment with multiple server implementations, demonstration projects, and a code generation toolkit.

---

## Root Level Directory Tree

```
MCP Building/
├── 📁 Root Configuration Files (Git, Build, Package Management)
│   ├── package.json                          # Main project dependencies and scripts
│   ├── package-lock.json                     # Locked dependency versions
│   ├── tsconfig.json                         # TypeScript configuration
│   ├── vitest.config.ts                      # Vitest testing configuration
│   ├── .gitignore                            # Git ignore patterns
│   ├── .eslintrc.json                        # ESLint linting rules
│   ├── .codecov.yml                          # Code coverage configuration
│   └── .git/                                 # Git repository
│
├── 📄 Documentation Files
│   ├── README.md                             # Main project readme
│   ├── CLAUDE.md                             # Claude Code integration guide
│   ├── ClaudeMCP.md                          # Comprehensive MCP technical guide
│   ├── DEPLOYMENT_READINESS_REPORT.md        # Deployment status and requirements
│   └── MCP Technical Knowledge Base.pdf      # PDF reference document
│
├── 📁 Main Source Code (Root Project)
│   └── src/                                  # Core codebase directory
│       ├── cli/                              # Command-line interface
│       ├── generator/                        # Code generation engine
│       ├── examples/                         # Reference implementations
│       ├── packaging/                        # Packaging utilities
│       ├── testing/                          # Testing utilities
│       └── utils/                            # Shared utilities
│
├── 📁 Build & Compilation Output
│   ├── dist/                                 # Compiled JavaScript output
│   │   ├── cli/
│   │   ├── generator/
│   │   ├── examples/
│   │   ├── packaging/
│   │   ├── testing/
│   │   └── utils/
│   └── coverage/                             # Code coverage reports
│
├── 📁 Test Output Directories
│   ├── test-output/                          # Integration test outputs
│   └── test-output-bundle/                   # Bundled test outputs
│
├── 📁 MCP Server Implementations
│   ├── mcpb/                                 # Main MCP Builder framework
│   ├── nanobanana-mcp/                       # Nanobanana server implementation
│   ├── elevenlabs-mcp/                       # ElevenLabs integration server
│   ├── openai-image-gen-mcp/                 # OpenAI image generation server
│   ├── qwen-image-mcp/                       # Qwen image model server
│   ├── servers/                              # Production servers collection
│   └── servers-archived/                     # Archived server versions
│
├── 📁 Demo & SDK Projects
│   ├── claude-agent-sdk-demos/               # Agent SDK demonstration projects
│   ├── claude-agent-sdk-python/              # Python agent SDK
│   └── claude-auto-documenter-v2/            # Auto documentation tool
│
├── 📁 Generated Outputs
│   ├── generated-servers/                    # Auto-generated server instances
│   └── docs/                                 # Generated documentation
│
├── 📁 Development Infrastructure
│   ├── scripts/                              # Utility scripts
│   ├── .github/                              # GitHub workflows and CI/CD
│   └── .claude/                              # Claude configuration cache
│
└── 📁 Node Dependencies
    └── node_modules/                         # npm packages (not checked in)
```

---

## Detailed Directory Descriptions

### 1. **Root Level (Main Configuration)**

| Item | Purpose |
|------|---------|
| `package.json` | Defines project dependencies, scripts, and metadata |
| `tsconfig.json` | TypeScript compilation settings |
| `vitest.config.ts` | Vitest test runner configuration |
| `.eslintrc.json` | Code style and linting rules |
| `.codecov.yml` | Code coverage thresholds and reporting |
| `.git/` | Git repository metadata |

---

### 2. **Documentation Directory: `docs/`**

Primary documentation for the project:
```
docs/
├── archive/                          # Archived documentation
├── ClaudeMCP.md                     # MCP specification and technical guide
└── CLAUDE.md                        # Claude integration guide
```

**Purpose:** Contains comprehensive guides for MCP development and Claude Code integration.

---

### 3. **Source Code: `src/`**

The core implementation of the MCP builder framework:

```
src/
├── cli/                              # Command-line interface for server generation
│   ├── create-server.ts             # Main CLI entry point
│   └── [other CLI utilities]
│
├── generator/                        # Code generation engine
│   ├── index.ts                     # Main generator logic
│   ├── templates/                   # Code templates for generation
│   ├── validation/                  # Input validation logic
│   └── validators/                  # Specific validators
│
├── examples/                         # Reference server implementations
│   ├── filesystem/                  # File system operations example
│   │   ├── __tests__/              # Tests for filesystem server
│   │   └── [implementation files]
│   ├── github/                      # GitHub integration example
│   │   ├── common/                 # Shared GitHub utilities
│   │   ├── operations/             # GitHub API operations
│   │   └── [implementation files]
│   ├── memory/                      # In-memory storage example
│   │   ├── __tests__/              # Tests for memory server
│   │   └── [implementation files]
│   ├── postgres/                    # PostgreSQL integration example
│   └── slack/                       # Slack integration example
│
├── packaging/                        # Packaging and distribution utilities
│   └── [packaging utilities]
│
├── testing/                          # Testing utilities and helpers
│   └── [test utilities]
│
└── utils/                            # Shared utility functions
    ├── filesystem/                  # File system utilities
    │   └── [filesystem helpers]
    └── security/                    # Security utilities
        └── [security helpers]
```

**Key Components:**
- **CLI**: Interactive server generator
- **Generator**: Converts user input to project scaffolding
- **Examples**: Working examples of all MCP patterns
- **Validators**: Input validation for generated code
- **Utils**: Shared helper functions

---

### 4. **MCP Server Implementations**

#### **`mcpb/` - Main MCP Builder Framework**

```
mcpb/
├── CLI.md                            # CLI documentation
├── MANIFEST.md                       # Feature manifest
├── README.md                         # Project readme
├── CONTRIBUTING.md                   # Contribution guidelines
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── jest.config.js                    # Jest test configuration
│
├── src/
│   ├── browser.ts                   # Browser runtime setup
│   ├── node.ts                      # Node.js runtime setup
│   ├── cli.ts                       # CLI entry point
│   ├── index.ts                     # Library entry point
│   ├── types.ts                     # TypeScript type definitions
│   │
│   ├── cli/                         # CLI implementation
│   │   ├── [CLI commands]
│   │   └── [CLI utilities]
│   │
│   ├── node/                        # Node.js specific code
│   │   └── [Node utilities]
│   │
│   ├── schemas/                     # JSON Schema definitions
│   │   └── [Schema files]
│   │
│   └── shared/                      # Shared code between runtimes
│       └── [Shared utilities]
│
├── test/                             # Jest test files
│   └── [Test specs]
│
├── examples/                         # Usage examples
│   └── README.md
│
└── scripts/                          # Build and utility scripts
    └── [Build scripts]
```

**Purpose:** The primary framework for building MCP servers.

---

#### **`elevenlabs-mcp/` - ElevenLabs Integration**

```
elevenlabs-mcp/
├── pyproject.toml                    # Python project config
├── requirements.txt                  # Python dependencies
├── setup.py                          # Python package setup
├── Dockerfile                        # Container configuration
├── server.json                       # Server configuration
│
├── elevenlabs_mcp/                   # Python package
│   ├── __pycache__/                 # Compiled Python
│   └── [Python source files]
│
├── tests/                            # Test files
│   └── __pycache__/
│
└── scripts/                          # Utility scripts
    └── [Python scripts]
```

**Purpose:** MCP server for ElevenLabs text-to-speech API integration.

---

#### **`openai-image-gen-mcp/` - OpenAI Image Generation**

```
openai-image-gen-mcp/
├── package.json                      # Node.js dependencies
├── Dockerfile                        # Container configuration
├── docker-compose.yml                # Multi-container setup
├── CHANGELOG.md                      # Version history
├── README.md                         # Project documentation
│
├── src/                              # TypeScript source
│   ├── [Implementation files]
│   └── [Utility files]
│
├── tests/                            # Test suite
│   └── [Test files]
│
├── docs/                             # Project documentation
│   └── [Documentation files]
│
├── public/                           # Static assets
│   └── [Asset files]
│
└── scripts/                          # Utility scripts
    ├── create-env.sh
    ├── git-checkin.sh
    └── start-server.sh
```

**Purpose:** OpenAI DALL-E image generation MCP server.

---

#### **`qwen-image-mcp/` - Qwen Image Model**

```
qwen-image-mcp/
├── pyproject.toml                    # Python configuration
├── requirements.txt                  # Python dependencies
├── install.py                        # Installation script
├── register.sh / register.bat         # Registration scripts
├── README.md                         # Documentation
│
├── qwen_image_mcp/                   # Python package
│   ├── __init__.py
│   └── [Python modules]
│
└── [Configuration files]
```

**Purpose:** Qwen image model integration server.

---

#### **`nanobanana-mcp/` - Nanobanana Server**

```
nanobanana-mcp/
├── package.json                      # Node dependencies
├── tsconfig.json                     # TypeScript config
├── SETUP_COMPLETE.md                 # Setup status
├── claude-mcp                        # CLI executable
├── install.sh                        # Installation script
│
├── src/                              # TypeScript source
│   └── [Implementation files]
│
├── dist/                             # Compiled output
│   └── [JavaScript files]
│
└── node_modules/                     # Dependencies
```

**Purpose:** Lightweight MCP server implementation.

---

#### **`servers/` & `servers-archived/`**

```
servers/
├── package.json                      # Shared dependencies
├── tsconfig.json                     # TypeScript config
├── README.md                         # Documentation
├── SECURITY.md                       # Security guidelines
├── CODE_OF_CONDUCT.md                # Community guidelines
│
├── src/                              # All server implementations
│   ├── [Individual server directories]
│   └── [Shared utilities]
│
└── scripts/                          # Build and utility scripts

servers-archived/                     # Previous versions
├── [Same structure as servers/]
└── [Legacy implementations]
```

**Purpose:** Collection of production-ready MCP servers.

---

### 5. **Demo & SDK Projects**

#### **`claude-agent-sdk-demos/` - Agent SDK Demonstrations**

```
claude-agent-sdk-demos/
├── README.md
│
├── email-agent/                      # Email agent demo
│   ├── agent/                        # Agent implementation
│   ├── server/                       # Server component
│   ├── client/                       # Client component
│   ├── database/                     # Database setup
│   └── ccsdk/                        # Claude SDK integration
│
├── excel-demo/                       # Excel integration demo
│   ├── agent/                        # Agent logic
│   ├── src/                          # Source files
│   ├── assets/                       # Static assets
│   └── release/                      # Release builds
│
└── hello-world/                      # Starter example
    └── [Simple example files]
```

**Purpose:** Demonstrates practical uses of the Claude Agent SDK.

---

#### **`claude-agent-sdk-python/` - Python Agent SDK**

```
claude-agent-sdk-python/
├── pyproject.toml                    # Python project config
├── README.md                         # Documentation
├── CHANGELOG.md                      # Version history
├── LICENSE                           # License file
│
├── src/
│   └── claude_agent_sdk/             # Main package
│       └── [Python modules]
│
├── examples/                         # Example implementations
│   └── plugins/                      # Plugin examples
│
├── tests/                            # Test suite
│   └── [Test files]
│
├── e2e-tests/                        # End-to-end tests
│   └── [Integration tests]
│
└── scripts/                          # Utility scripts
    └── [Build/run scripts]
```

**Purpose:** Python implementation of Claude Agent SDK.

---

#### **`claude-auto-documenter-v2/` - Auto Documentation Tool**

```
claude-auto-documenter-v2/
├── package.json                      # Dependencies
├── requirements.txt                  # Python dependencies
├── SETUP_COMPLETE.md                 # Setup status
├── README.md                         # Documentation
├── CONTRIBUTING.md                   # Contribution guide
│
├── src/                              # Source implementation
│   ├── [Main modules]
│   └── [Utilities]
│
├── tests/                            # Test files
│   └── [Test specs]
│
├── examples/                         # Example usage
│   └── [Example files]
│
├── docs/                             # Documentation
│   └── [Doc files]
│
├── scripts/                          # Build scripts
│   └── [Scripts]
│
├── logs/                             # Execution logs
│   └── [Log files]
│
└── node_modules/                     # Dependencies
```

**Purpose:** Automatically generates documentation using Claude AI.

---

### 6. **Generated Outputs**

#### **`generated-servers/` - Auto-Generated Server Projects**

```
generated-servers/
├── test-echo-server/                 # Generated echo server
│   ├── src/                          # Generated source
│   ├── dist/                         # Compiled output
│   ├── package.json
│   └── tsconfig.json
│
└── test-fixed-server/                # Generated fixed server
    ├── src/
    ├── dist/
    ├── package.json
    └── tsconfig.json
```

**Purpose:** Examples of servers generated by the scaffolding tool.

---

### 7. **Build Output: `dist/`**

Compiled JavaScript output mirroring the `src/` structure:

```
dist/
├── cli/                              # Compiled CLI
├── generator/                        # Compiled generator
├── examples/                         # Compiled examples
├── packaging/                        # Compiled packaging utilities
├── testing/                          # Compiled testing utilities
└── utils/                            # Compiled utilities
```

**Note:** Generated by TypeScript compilation (`npm run build`).

---

### 8. **Test Coverage: `coverage/`**

```
coverage/
├── generator/                        # Generator module coverage
│   ├── validation/
│   └── validators/
├── utils/                            # Utils module coverage
│   ├── filesystem/
│   └── security/
├── coverage-final.json                # Coverage data
├── index.html                         # Coverage report
└── [Other coverage assets]
```

**Purpose:** Code coverage reports and analysis.

---

### 9. **Scripts: `scripts/`**

```
scripts/
├── test-example-generation.sh         # Tests server generation
└── [Other utility scripts]
```

**Purpose:** Automation and build scripts.

---

### 10. **Development Infrastructure**

#### **`.github/` - CI/CD Workflows**

```
.github/
└── workflows/                        # GitHub Actions workflows
    └── [CI/CD workflow files]
```

**Purpose:** Automated testing, building, and deployment.

---

#### **`.claude/` - Claude AI Configuration**

```
.claude/
└── [Claude-specific configuration cache]
```

**Purpose:** Local cache for Claude Code integration.

---

## Organization Patterns

### Recurring Directory Patterns

| Pattern | Purpose |
|---------|---------|
| `src/` | TypeScript/JavaScript source code |
| `dist/` | Compiled JavaScript output |
| `tests/` or `test/` | Test files and specifications |
| `__tests__/` | Inline test files (Jest convention) |
| `examples/` | Usage examples and demonstrations |
| `scripts/` | Build, utility, and automation scripts |
| `docs/` | Project documentation |
| `node_modules/` | npm dependencies (not tracked in git) |

### Technology Stack by Directory

| Directory | Language | Framework/Runtime |
|-----------|----------|-------------------|
| `src/`, `mcpb/`, `nanobanana-mcp/` | TypeScript/JavaScript | Node.js |
| `claude-agent-sdk-python/` | Python | Python 3.x |
| `elevenlabs-mcp/`, `qwen-image-mcp/` | Python | Python 3.x |
| `src/examples/`, `generated-servers/` | TypeScript | Node.js/MCP SDK |

---

## Key Files by Category

### Configuration Files
- `package.json` - Node.js project metadata
- `pyproject.toml` - Python project configuration
- `tsconfig.json` - TypeScript compilation settings
- `vitest.config.ts` - Test runner configuration

### Documentation
- `README.md` - Project overview
- `CLAUDE.md` - Claude integration guide
- `ClaudeMCP.md` - Technical specifications
- `DEPLOYMENT_READINESS_REPORT.md` - Deployment checklist

### Build & CLI
- `src/cli/` - Command-line interface
- `scripts/` - Build automation
- `dist/` - Compiled output

---

## Navigation Guide

### To find...
- **MCP Server Generators**: → `src/generator/`
- **Reference Implementations**: → `src/examples/` or `servers/`
- **API Integrations**: → `elevenlabs-mcp/`, `openai-image-gen-mcp/`, `qwen-image-mcp/`
- **Testing Setup**: → `vitest.config.ts`, `src/testing/`
- **Deployment Info**: → `DEPLOYMENT_READINESS_REPORT.md`
- **Technical Docs**: → `docs/ClaudeMCP.md`
- **Security Guidelines**: → `servers/SECURITY.md`
- **Python SDK**: → `claude-agent-sdk-python/`
- **Auto Documentation**: → `claude-auto-documenter-v2/`

---

## Summary Statistics

| Category | Count | Type |
|----------|-------|------|
| Root Directories | 15+ | Major subsystems |
| MCP Servers | 5 | Production implementations |
| Demo Projects | 3 | Demonstrations |
| Example Implementations | 5 | Reference patterns |
| Documentation Files | 5+ | Guide & reference |
| Test Suites | Multiple | Across all modules |

---

*Last Updated: November 10, 2025*

