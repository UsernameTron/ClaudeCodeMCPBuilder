/**
 * MCPB (MCP Bundle) Generator
 *
 * Generates .mcpb bundle manifests for MCP servers.
 * Based on the Anthropic mcpb specification v0.3.
 */

export interface MCPBManifest {
  manifest_version: string;
  name: string;
  display_name?: string;
  version: string;
  description: string;
  long_description?: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  repository?: {
    type: string;
    url: string;
  };
  homepage?: string;
  documentation?: string;
  support?: string;
  icon?: string;
  server: {
    type: 'node' | 'python' | 'binary';
    entry_point: string;
    mcp_config: {
      command: string;
      args: string[];
      env?: Record<string, string>;
    };
  };
  tools?: Array<{
    name: string;
    description: string;
  }>;
  prompts?: Array<{
    name: string;
    description: string;
    arguments?: string[];
    text?: string;
  }>;
  resources?: Array<{
    name: string;
    description: string;
  }>;
  keywords?: string[];
  license?: string;
  user_config?: Record<string, UserConfigField>;
  compatibility?: {
    claude_desktop?: string;
    platforms?: string[];
    runtimes?: Record<string, string>;
  };
}

export interface UserConfigField {
  type: 'string' | 'boolean' | 'number' | 'file' | 'directory';
  title: string;
  description: string;
  sensitive?: boolean;
  required?: boolean;
  default?: string | number | boolean;
  min?: number;
  max?: number;
}

export interface GenerateMCPBOptions {
  serverName: string;
  displayName?: string;
  version?: string;
  description: string;
  longDescription?: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  repository?: {
    type: string;
    url: string;
  };
  entryPoint?: string;
  serverType?: 'node' | 'python';
  tools?: Array<{ name: string; description: string }>;
  prompts?: Array<{ name: string; description: string }>;
  resources?: Array<{ name: string; description: string }>;
  userConfig?: Record<string, UserConfigField>;
  keywords?: string[];
  license?: string;
}

/**
 * Generates an MCPB manifest for a server
 */
export function generateMCPBManifest(options: GenerateMCPBOptions): MCPBManifest {
  const manifest: MCPBManifest = {
    manifest_version: '0.3',
    name: options.serverName,
    version: options.version || '1.0.0',
    description: options.description,
    author: options.author,
    server: {
      type: options.serverType || 'node',
      entry_point: options.entryPoint || 'dist/index.js',
      mcp_config: {
        command: options.serverType === 'python' ? 'python' : 'node',
        args: ['${__dirname}/' + (options.entryPoint || 'dist/index.js')],
      },
    },
  };

  // Add optional fields
  if (options.displayName) {
    manifest.display_name = options.displayName;
  }

  if (options.longDescription) {
    manifest.long_description = options.longDescription;
  }

  if (options.repository) {
    manifest.repository = options.repository;
  }

  if (options.tools && options.tools.length > 0) {
    manifest.tools = options.tools;
  }

  if (options.prompts && options.prompts.length > 0) {
    manifest.prompts = options.prompts;
  }

  if (options.resources && options.resources.length > 0) {
    manifest.resources = options.resources;
  }

  if (options.keywords && options.keywords.length > 0) {
    manifest.keywords = options.keywords;
  }

  if (options.license) {
    manifest.license = options.license;
  }

  if (options.userConfig && Object.keys(options.userConfig).length > 0) {
    manifest.user_config = options.userConfig;

    // Add user config variables to env
    const envVars: Record<string, string> = {};
    for (const [key, field] of Object.entries(options.userConfig)) {
      if (field.sensitive || field.type === 'string') {
        envVars[key.toUpperCase()] = `\${user_config.${key}}`;
      }
    }

    if (Object.keys(envVars).length > 0) {
      manifest.server.mcp_config.env = envVars;
    }
  }

  // Add compatibility info
  manifest.compatibility = {
    claude_desktop: '>=0.10.0',
    platforms: ['darwin', 'win32', 'linux'],
    runtimes: {
      [options.serverType === 'python' ? 'python' : 'node']:
        options.serverType === 'python' ? '>=3.8' : '>=16.0.0',
    },
  };

  return manifest;
}

/**
 * Generates manifest for Memory server
 */
export function generateMemoryServerManifest(
  serverName: string,
  author: { name: string; email?: string; url?: string }
): MCPBManifest {
  return generateMCPBManifest({
    serverName,
    displayName: 'Knowledge Graph Memory Server',
    description: 'Persistent memory using a local knowledge graph with entities, relations, and observations',
    longDescription:
      'A production-ready MCP server that provides persistent memory capabilities using a knowledge graph structure. ' +
      'Stores entities, relations, and observations in a JSONL file for efficient querying and graph traversal.',
    author,
    serverType: 'node',
    tools: [
      { name: 'create_entities', description: 'Create multiple new entities in the knowledge graph' },
      { name: 'create_relations', description: 'Create multiple new relations between entities' },
      { name: 'add_observations', description: 'Add new observations to existing entities' },
      { name: 'delete_entities', description: 'Delete multiple entities and their associated relations' },
      { name: 'delete_observations', description: 'Delete specific observations from entities' },
      { name: 'delete_relations', description: 'Delete multiple relations from the knowledge graph' },
      { name: 'read_graph', description: 'Read the entire knowledge graph' },
      { name: 'search_nodes', description: 'Search for nodes based on a query' },
      { name: 'open_nodes', description: 'Open specific nodes by their names' },
    ],
    userConfig: {
      memory_file_path: {
        type: 'file',
        title: 'Memory File Path',
        description: 'Path to the JSONL file where the knowledge graph is stored',
        required: false,
        default: 'memory.jsonl',
      },
    },
    keywords: ['memory', 'knowledge-graph', 'persistence', 'entities', 'relations'],
    license: 'MIT',
  });
}

/**
 * Generates manifest for Filesystem server
 */
export function generateFilesystemServerManifest(
  serverName: string,
  author: { name: string; email?: string; url?: string }
): MCPBManifest {
  return generateMCPBManifest({
    serverName,
    displayName: 'Secure Filesystem Server',
    description: 'Secure file operations with path validation and boundary checking',
    longDescription:
      'A production-ready MCP server providing secure filesystem access with OWASP-compliant path validation, ' +
      'boundary checking, and configurable allowed directories. Includes read, write, edit, search, and tree generation capabilities.',
    author,
    serverType: 'node',
    tools: [
      { name: 'read_file', description: 'Read the complete contents of a file' },
      { name: 'read_multiple_files', description: 'Read multiple files at once' },
      { name: 'write_file', description: 'Write content to a file' },
      { name: 'edit_file', description: 'Make targeted edits to a file with preview' },
      { name: 'create_directory', description: 'Create a new directory' },
      { name: 'list_directory', description: 'List contents of a directory' },
      { name: 'move_file', description: 'Move or rename a file' },
      { name: 'search_files', description: 'Search for files matching a pattern' },
      { name: 'get_file_info', description: 'Get detailed file metadata' },
      { name: 'directory_tree', description: 'Generate a tree view of a directory' },
    ],
    userConfig: {
      allowed_directories: {
        type: 'string',
        title: 'Allowed Directories',
        description: 'Comma-separated list of directories the server can access (security boundary)',
        required: true,
      },
    },
    keywords: ['filesystem', 'files', 'security', 'path-validation', 'boundary-checking'],
    license: 'MIT',
  });
}

/**
 * Generates manifest for GitHub server
 */
export function generateGitHubServerManifest(
  serverName: string,
  author: { name: string; email?: string; url?: string }
): MCPBManifest {
  return generateMCPBManifest({
    serverName,
    displayName: 'GitHub Integration Server',
    description: 'Repository management, file operations, and GitHub API integration',
    longDescription:
      'A production-ready MCP server providing complete GitHub integration with repository management, ' +
      'file operations, pull request handling, issue management, and branch operations via the GitHub API.',
    author,
    serverType: 'node',
    tools: [
      { name: 'create_repository', description: 'Create a new GitHub repository' },
      { name: 'get_file_contents', description: 'Get contents of a file from a repository' },
      { name: 'push_files', description: 'Push files to a repository' },
      { name: 'create_pull_request', description: 'Create a new pull request' },
      { name: 'create_issue', description: 'Create a new issue' },
      { name: 'create_branch', description: 'Create a new branch' },
      { name: 'list_commits', description: 'List commits in a repository' },
      { name: 'search_repositories', description: 'Search for repositories' },
      { name: 'search_code', description: 'Search code across repositories' },
    ],
    userConfig: {
      github_token: {
        type: 'string',
        title: 'GitHub Personal Access Token',
        description: 'Your GitHub personal access token for authentication',
        sensitive: true,
        required: true,
      },
    },
    keywords: ['github', 'git', 'repository', 'pull-request', 'api'],
    license: 'MIT',
  });
}

/**
 * Generates manifest for PostgreSQL server
 */
export function generatePostgresServerManifest(
  serverName: string,
  author: { name: string; email?: string; url?: string }
): MCPBManifest {
  return generateMCPBManifest({
    serverName,
    displayName: 'PostgreSQL Database Server',
    description: 'Database access with schema inspection and query capabilities',
    longDescription:
      'A production-ready MCP server providing PostgreSQL database access with schema inspection, ' +
      'read-only queries, table introspection, and safe query execution.',
    author,
    serverType: 'node',
    tools: [
      { name: 'list_tables', description: 'List all tables in the database' },
      { name: 'describe_table', description: 'Get schema information for a table' },
      { name: 'query', description: 'Execute a read-only SQL query' },
    ],
    resources: [
      { name: 'schema', description: 'Database schema information' },
      { name: 'table', description: 'Table data and metadata' },
    ],
    userConfig: {
      postgres_connection_string: {
        type: 'string',
        title: 'PostgreSQL Connection String',
        description: 'Database connection string (postgresql://user:password@host:port/database)',
        sensitive: true,
        required: true,
      },
    },
    keywords: ['postgres', 'postgresql', 'database', 'sql', 'schema'],
    license: 'MIT',
  });
}

/**
 * Generates manifest for Slack server
 */
export function generateSlackServerManifest(
  serverName: string,
  author: { name: string; email?: string; url?: string }
): MCPBManifest {
  return generateMCPBManifest({
    serverName,
    displayName: 'Slack Integration Server',
    description: 'Channel management and messaging capabilities for Slack workspaces',
    longDescription:
      'A production-ready MCP server providing Slack workspace integration with channel management, ' +
      'message posting, user management, and thread operations.',
    author,
    serverType: 'node',
    tools: [
      { name: 'list_channels', description: 'List all channels in the workspace' },
      { name: 'post_message', description: 'Post a message to a channel' },
      { name: 'list_users', description: 'List users in the workspace' },
      { name: 'get_channel_history', description: 'Get message history from a channel' },
      { name: 'create_channel', description: 'Create a new channel' },
    ],
    userConfig: {
      slack_bot_token: {
        type: 'string',
        title: 'Slack Bot Token',
        description: 'Your Slack bot user OAuth token (xoxb-...)',
        sensitive: true,
        required: true,
      },
    },
    keywords: ['slack', 'messaging', 'collaboration', 'workspace', 'channels'],
    license: 'MIT',
  });
}
