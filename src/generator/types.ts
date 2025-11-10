/**
 * Configuration for generating an MCP server
 */
export interface ServerConfig {
  name: string;
  description: string;
  type: 'tools' | 'resources' | 'prompts' | 'mixed';
  outputDir: string;
  skipInstall?: boolean;

  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };

  features: {
    listChanged: boolean;
    subscribe: boolean;
    structuredOutputs?: boolean;
  };

  includeExamples?: boolean;
  includeTests?: boolean;

  security: {
    validateInputs: boolean;
    sanitizePaths: boolean;
    rateLimit: boolean;
  };
}

/**
 * Result of server generation
 */
export interface GenerationResult {
  path: string;
  filesCreated: string[];
  warnings?: string[];
}

/**
 * Tool definition following MCP specification
 */
export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  outputSchema?: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

/**
 * Resource definition following MCP specification
 */
export interface ResourceDefinition {
  uri: string;
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
}

/**
 * Prompt definition following MCP specification
 */
export interface PromptDefinition {
  name: string;
  title: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}
