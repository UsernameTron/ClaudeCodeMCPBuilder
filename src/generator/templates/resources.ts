import type { ServerConfig } from '../types.js';

export function generateResourcesModule(config: ServerConfig): string {
  const exampleResource = config.includeExamples ? `
/**
 * Example resource: server info
 * Demonstrates basic resource implementation
 */
const serverInfoResource = {
  uri: 'server://info',
  name: 'Server Information',
  title: 'Server Info',
  description: 'Basic information about this MCP server',
  mimeType: 'application/json'
};

async function readServerInfo() {
  return {
    uri: 'server://info',
    mimeType: 'application/json',
    text: JSON.stringify({
      name: '${config.name}',
      version: '1.0.0',
      capabilities: ${JSON.stringify(config.capabilities)},
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }, null, 2)
  };
}` : '';

  return `/**
 * Resources Module
 *
 * Implements MCP resources following Anthropic best practices:
 * - Clear URI patterns (file://, https://, custom schemes)
 * - Appropriate MIME types
 * - Support for pagination on large lists
 * - Optional subscriptions for real-time updates
 * - Content types: text or blob (base64)
 */

import type { Resource } from '@modelcontextprotocol/sdk/types.js';

/**
 * List of available resources
 * Resources are application-controlled: user decides which to include in context
 */
const RESOURCES: Resource[] = [${config.includeExamples ? '\n  serverInfoResource' : ''}
  // Add more resources here
];
${exampleResource}

${config.features.subscribe ? `
/**
 * Active subscriptions
 * Track which resources clients are subscribed to
 */
const subscriptions = new Map<string, Set<string>>();` : ''}

/**
 * List resources handler
 * Supports pagination for large resource lists
 */
export async function listResources(request?: any) {
  const cursor = request?.params?.cursor;
  const pageSize = 100; // Configurable page size

  // TODO: Implement pagination if you have many resources
  // For now, return all resources

  return {
    resources: RESOURCES,
    // nextCursor: undefined // Set if more pages available
  };
}

/**
 * Read resource handler
 * Returns resource content by URI
 *
 * Best practices:
 * - Validate URI format and permissions
 * - Handle both text and blob content types
 * - Return appropriate MIME types
 * - Consider content size limits
 */
export async function readResource(request: any) {
  const { uri } = request.params;

  ${config.includeExamples ? `// Handle server info resource
  if (uri === 'server://info') {
    return {
      contents: [await readServerInfo()]
    };
  }` : ''}

  ${config.security.sanitizePaths ? `// Validate file:// URIs
  if (uri.startsWith('file://')) {
    const filePath = uri.substring(7); // Remove 'file://'

    // Security: Prevent directory traversal
    if (filePath.includes('..') || filePath.includes('~')) {
      throw new Error('Invalid file path: directory traversal detected');
    }

    // TODO: Check against allowed roots
    // TODO: Implement file reading logic
  }` : ''}

  // Resource not found
  throw new Error(\`Resource not found: \${uri}\`);
}

${config.features.subscribe ? `
/**
 * Subscribe to resource handler
 * Client requests notifications when resource changes
 */
export async function subscribeToResource(request: any) {
  const { uri } = request.params;

  // Verify resource exists
  const resourceExists = RESOURCES.some(r => r.uri === uri);
  if (!resourceExists) {
    throw new Error(\`Resource not found: \${uri}\`);
  }

  // Track subscription (in production, use proper session management)
  const clientId = 'client'; // TODO: Get actual client ID
  if (!subscriptions.has(uri)) {
    subscriptions.set(uri, new Set());
  }
  subscriptions.get(uri)!.add(clientId);

  return {};
}

/**
 * Unsubscribe from resource handler
 */
export async function unsubscribeFromResource(request: any) {
  const { uri } = request.params;
  const clientId = 'client'; // TODO: Get actual client ID

  const subs = subscriptions.get(uri);
  if (subs) {
    subs.delete(clientId);
    if (subs.size === 0) {
      subscriptions.delete(uri);
    }
  }

  return {};
}

/**
 * Notify subscribers of resource update
 * Call this when a resource's content changes
 */
export async function notifyResourceUpdate(server: any, uri: string) {
  const subs = subscriptions.get(uri);
  if (subs && subs.size > 0) {
    // Send notification to all subscribers
    await server.notification({
      method: 'notifications/resources/updated',
      params: { uri }
    });
  }
}` : ''}

/**
 * Helper: Read file as resource content
 * Handles text and binary files
 */
async function readFileAsResource(filePath: string, uri: string): Promise<any> {
  const fs = await import('fs/promises');
  const path = await import('path');

  try {
    // Determine if file is binary
    const ext = path.extname(filePath).toLowerCase();
    const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.py', '.html', '.css'];
    const isText = textExtensions.includes(ext);

    if (isText) {
      const content = await fs.readFile(filePath, 'utf-8');
      return {
        uri,
        mimeType: getMimeType(ext),
        text: content
      };
    } else {
      const content = await fs.readFile(filePath);
      return {
        uri,
        mimeType: getMimeType(ext),
        blob: content.toString('base64')
      };
    }
  } catch (error) {
    throw new Error(\`Failed to read file: \${error instanceof Error ? error.message : String(error)}\`);
  }
}

/**
 * Helper: Get MIME type from file extension
 */
function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.js': 'text/javascript',
    '.ts': 'text/typescript',
    '.py': 'text/x-python',
    '.html': 'text/html',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.pdf': 'application/pdf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
`;
}
