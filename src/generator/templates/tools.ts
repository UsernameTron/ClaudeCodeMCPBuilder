import type { ServerConfig } from '../types.js';

export function generateToolsModule(config: ServerConfig): string {
  const exampleTool = config.includeExamples ? `
/**
 * Example tool: echo
 * Demonstrates basic tool implementation with input validation and error handling
 */
const echoTool = {
  name: 'echo',
  title: 'Echo Tool',
  description: 'Echoes back the input text - useful for testing',
  inputSchema: {
    type: 'object' as const,
    properties: {
      message: {
        type: 'string',
        description: 'The message to echo back'
      }
    },
    required: ['message']
  },
  ${config.features.structuredOutputs ? `outputSchema: {
    type: 'object' as const,
    properties: {
      echoed: {
        type: 'string',
        description: 'The echoed message'
      },
      timestamp: {
        type: 'string',
        description: 'ISO 8601 timestamp'
      }
    },
    required: ['echoed', 'timestamp']
  },` : ''}
  annotations: {
    title: 'Echo Tool',
    readOnlyHint: true,
    openWorldHint: false
  }
};

async function handleEcho(args: any) {
  try {
    // Input validation (additional to schema validation)
    if (typeof args.message !== 'string' || args.message.length === 0) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: 'Error: message must be a non-empty string'
        }]
      };
    }

    // Process the tool operation
    const result = {
      echoed: args.message,
      timestamp: new Date().toISOString()
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]${config.features.structuredOutputs ? `,
      structuredContent: result` : ''}
    };
  } catch (error) {
    // Error handling following MCP best practices
    return {
      isError: true,
      content: [{
        type: 'text',
        text: \`Error executing echo tool: \${error instanceof Error ? error.message : String(error)}\\n\\nPlease check the input and try again.\`
      }]
    };
  }
}` : '';

  return `/**
 * Tools Module
 *
 * Implements MCP tools following Anthropic best practices:
 * - Clear input schemas with JSON Schema validation
 * - Comprehensive error handling with actionable messages
 * - Security annotations (readOnly, destructive, openWorld)
 * - Structured outputs when applicable
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

${exampleTool}

/**
 * List of available tools
 * Add your tool definitions here
 */
const TOOLS: Tool[] = [${config.includeExamples ? '\n  echoTool' : ''}
  // Add more tools here
];

/**
 * List tools handler
 * Returns all available tools to the client
 */
export async function listTools() {
  return {
    tools: TOOLS
  };
}

/**
 * Call tool handler
 * Executes the requested tool with provided arguments
 *
 * Following MCP best practices:
 * - Validate inputs beyond schema (defense in depth)
 * - Return errors as content (isError: true) not protocol errors
 * - Provide actionable error messages
 * - Use structured outputs when appropriate
 */
export async function callTool(request: any) {
  const { name, arguments: args } = request.params;

  ${config.includeExamples ? `if (name === 'echo') {
    return await handleEcho(args);
  }` : ''}

  // Tool not found - return error response per MCP specification
  return {
    isError: true,
    content: [{
      type: 'text',
      text: \`Unknown tool: \${name}. Available tools: \${TOOLS.map(t => t.name).join(', ') || 'none'}. Please use the tools/list request to see all available tools.\`
    }]
  };
}

/**
 * Helper: Validate tool arguments against schema
 * Additional validation beyond JSON Schema
 *
 * PRODUCTION SECURITY: Use XSSPrevention utility for proper input validation
 *
 * import { XSSPrevention } from '@your-org/security-utils';
 *
 * // For HTML context (displaying in web UI):
 * const safe = XSSPrevention.escapeHTML(userInput);
 *
 * // For validating identifiers/filenames:
 * if (!XSSPrevention.isSafeForContext(input, 'filename')) {
 *   return { valid: false, error: 'Invalid filename format' };
 * }
 *
 * // For JSON output:
 * const jsonSafe = XSSPrevention.sanitizeJSON(userInput);
 *
 * See: src/utils/security/xssPrevention.ts for all methods
 */
function validateArguments(args: any, tool: Tool): { valid: boolean; error?: string } {
  // Add custom validation logic here
  ${config.security.validateInputs ? `
  // WARNING: This is a basic example only - use XSSPrevention utility for production
  // The naive check below only catches '<script>' but misses many XSS vectors
  if (typeof args === 'object') {
    for (const value of Object.values(args)) {
      if (typeof value === 'string' && value.includes('<script>')) {
        return { valid: false, error: 'Potential XSS detected - use XSSPrevention.escapeHTML() for proper sanitization' };
      }
    }
  }` : ''}

  return { valid: true };
}

${config.security.sanitizePaths ? `
/**
 * Helper: Sanitize file paths (PRODUCTION READY)
 *
 * For production use, implement the PathSanitizer class from security utilities:
 *
 * import { PathSanitizer } from '@your-org/security-utils';
 *
 * const sanitizer = new PathSanitizer('/allowed/root/directory');
 *
 * try {
 *   const safePath = await sanitizer.validateExistingPath(userInput);
 *   // Use safePath for file operations
 * } catch (error) {
 *   // Handle security violation
 *   return { safe: false, error: error.message };
 * }
 *
 * The PathSanitizer provides:
 * - Blocks ALL path traversal techniques (encoded, double-encoded, etc.)
 * - Prevents null byte injection
 * - Enforces root boundary with path.resolve()
 * - Detects suspicious patterns (/etc/passwd, .ssh/, .env, etc.)
 * - Validates symlink targets
 *
 * See: src/utils/security/pathSanitization.ts
 */
function sanitizePath(inputPath: string, allowedRoots: string[]): { safe: boolean; sanitized?: string; error?: string } {
  // WARNING: This is a basic implementation for example purposes only
  // Replace with PathSanitizer for production use

  // Basic checks (insufficient for production)
  if (inputPath.includes('..') || inputPath.includes('~') || inputPath.includes('\0')) {
    return { safe: false, error: 'Path traversal or null byte detected' };
  }

  // Verify within allowed roots (basic check)
  const absolutePath = inputPath.startsWith('/') ? inputPath : \`/\${inputPath}\`;
  const isWithinRoot = allowedRoots.some(root => absolutePath.startsWith(root));

  if (!isWithinRoot) {
    return { safe: false, error: 'Path outside allowed roots' };
  }

  return { safe: true, sanitized: absolutePath };
}` : ''}

${config.security.rateLimit ? `
/**
 * Rate limiting state (in-memory for example)
 * In production, use Redis or similar
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Helper: Check rate limit
 */
function checkRateLimit(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}` : ''}
`;
}
