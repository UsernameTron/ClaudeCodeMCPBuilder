/**
 * Example Server Catalog
 *
 * Curated production-ready MCP server implementations from Anthropic.
 * Each example can be used as a starting point for new projects.
 */

export interface ExampleServer {
  id: string;
  name: string;
  description: string;
  category: 'tools' | 'resources' | 'prompts' | 'mixed';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  capabilities: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
  };
  features: string[];
  requiresAuth?: boolean;
  requiresConfig?: boolean;
  dependencies?: string[];
  sourceRepo: string;
  sourcePath: string;
  documentationUrl?: string;
}

/**
 * Catalog of production-ready example servers
 */
export const EXAMPLE_SERVERS: Record<string, ExampleServer> = {
  memory: {
    id: 'memory',
    name: 'Knowledge Graph Memory',
    description: 'Persistent memory using a local knowledge graph with entities, relations, and observations',
    category: 'tools',
    complexity: 'intermediate',
    capabilities: {
      tools: true,
    },
    features: [
      'Knowledge graph data structure',
      'JSONL file persistence',
      'Entity and relation management',
      'Graph search and filtering',
      'Observation tracking',
      'Full CRUD operations',
      'No external dependencies',
    ],
    requiresAuth: false,
    requiresConfig: true, // Memory file path
    dependencies: [],
    sourceRepo: 'https://github.com/modelcontextprotocol/servers',
    sourcePath: 'src/memory',
    documentationUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
  },

  filesystem: {
    id: 'filesystem',
    name: 'Secure Filesystem',
    description: 'Secure file operations with path validation and boundary checking',
    category: 'tools',
    complexity: 'advanced',
    capabilities: {
      tools: true,
    },
    features: [
      'Path traversal protection',
      'Configurable allowed directories',
      'Read, write, edit operations',
      'Directory tree generation',
      'File search with patterns',
      'Git-style diff for edits',
      'Security-first design',
      'Zod schema validation',
    ],
    requiresAuth: false,
    requiresConfig: true, // Allowed directories
    dependencies: ['zod', 'zod-to-json-schema', 'minimatch', 'diff', 'glob'],
    sourceRepo: 'https://github.com/modelcontextprotocol/servers',
    sourcePath: 'src/filesystem',
    documentationUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
  },

  github: {
    id: 'github',
    name: 'GitHub Integration',
    description: 'Repository management, file operations, and GitHub API integration',
    category: 'mixed',
    complexity: 'advanced',
    capabilities: {
      tools: true,
      resources: true,
    },
    features: [
      'Repository operations',
      'File management',
      'Pull request creation',
      'Issue management',
      'Branch operations',
      'GitHub API integration',
      'OAuth authentication',
      'Rate limiting',
    ],
    requiresAuth: true, // GitHub token
    requiresConfig: true,
    dependencies: ['@octokit/rest', '@octokit/auth-token'],
    sourceRepo: 'https://github.com/modelcontextprotocol/servers-archived',
    sourcePath: 'src/github',
    documentationUrl: 'https://github.com/modelcontextprotocol/servers-archived/tree/main/src/github',
  },

  postgres: {
    id: 'postgres',
    name: 'PostgreSQL Database',
    description: 'Database access with schema inspection and query capabilities',
    category: 'tools',
    complexity: 'intermediate',
    capabilities: {
      tools: true,
      resources: true,
    },
    features: [
      'Schema inspection',
      'Read-only queries',
      'Table and column introspection',
      'Connection pooling',
      'SQL query execution',
      'Error handling',
      'Safe query validation',
    ],
    requiresAuth: true, // Database credentials
    requiresConfig: true,
    dependencies: ['pg'],
    sourceRepo: 'https://github.com/modelcontextprotocol/servers-archived',
    sourcePath: 'src/postgres',
    documentationUrl: 'https://github.com/modelcontextprotocol/servers-archived/tree/main/src/postgres',
  },

  slack: {
    id: 'slack',
    name: 'Slack Integration',
    description: 'Channel management and messaging capabilities for Slack workspaces',
    category: 'tools',
    complexity: 'intermediate',
    capabilities: {
      tools: true,
    },
    features: [
      'Channel listing',
      'Message posting',
      'User management',
      'Thread operations',
      'Workspace info',
      'OAuth authentication',
      'Rate limiting',
      'Error handling',
    ],
    requiresAuth: true, // Slack token
    requiresConfig: true,
    dependencies: ['@slack/web-api'],
    sourceRepo: 'https://github.com/modelcontextprotocol/servers-archived',
    sourcePath: 'src/slack',
    documentationUrl: 'https://github.com/modelcontextprotocol/servers-archived/tree/main/src/slack',
  },
};

/**
 * Get all example servers
 */
export function getAllExamples(): ExampleServer[] {
  return Object.values(EXAMPLE_SERVERS);
}

/**
 * Get examples by category
 */
export function getExamplesByCategory(category: ExampleServer['category']): ExampleServer[] {
  return getAllExamples().filter(example => example.category === category);
}

/**
 * Get examples by complexity
 */
export function getExamplesByComplexity(complexity: ExampleServer['complexity']): ExampleServer[] {
  return getAllExamples().filter(example => example.complexity === complexity);
}

/**
 * Get example by ID
 */
export function getExampleById(id: string): ExampleServer | undefined {
  return EXAMPLE_SERVERS[id];
}

/**
 * Get examples that don't require authentication
 */
export function getNoAuthExamples(): ExampleServer[] {
  return getAllExamples().filter(example => !example.requiresAuth);
}

/**
 * Get beginner-friendly examples
 */
export function getBeginnerExamples(): ExampleServer[] {
  return getAllExamples().filter(
    example => example.complexity === 'beginner' && !example.requiresAuth
  );
}
