/**
 * Filesystem Server Example
 *
 * Demonstrates a resources-focused MCP server with security best practices.
 * This example shows:
 * - Resource definitions with proper URIs
 * - Path sanitization and security
 * - Root boundaries enforcement
 * - Resource subscriptions for file watching
 * - Pagination for large directories
 */

import type { ServerConfig } from '../generator/types.js';

export const filesystemServerConfig: ServerConfig = {
  name: 'filesystem-server',
  description: 'MCP server providing secure file system access within defined boundaries',
  type: 'resources',
  outputDir: './generated-servers',
  skipInstall: false,

  capabilities: {
    tools: false,
    resources: true,
    prompts: false
  },

  features: {
    listChanged: true, // File system can change
    subscribe: true,   // Watch files for changes
    structuredOutputs: false
  },

  includeExamples: true,
  includeTests: true,

  security: {
    validateInputs: true,
    sanitizePaths: true,  // Critical for file operations
    rateLimit: true
  }
};

/**
 * Example resource definitions for filesystem server
 */
export const filesystemResources = [
  {
    uri: 'file:///{path}',
    name: 'File Content',
    title: 'Read File',
    description: 'Read contents of a file within allowed roots',
    mimeType: 'text/plain'
  },
  {
    uri: 'dir:///{path}',
    name: 'Directory Listing',
    title: 'List Directory',
    description: 'List files and subdirectories within a directory',
    mimeType: 'application/json'
  },
  {
    uri: 'file:///{path}/metadata',
    name: 'File Metadata',
    title: 'File Information',
    description: 'Get file size, modification time, permissions, etc.',
    mimeType: 'application/json'
  }
];

/**
 * Usage instructions for filesystem server
 */
export const filesystemServerReadme = `
## Filesystem Server

This server provides secure access to the local filesystem through MCP resources.

### Security Features

This server implements multiple security layers:

1. **Root Boundaries**: Only accesses files within client-specified roots
2. **Path Sanitization**: Prevents directory traversal attacks (../)
3. **Symlink Validation**: Ensures symlinks stay within allowed boundaries
4. **Permission Checks**: Respects file system permissions

### Configuration

When connecting, the client must specify allowed root directories:

\`\`\`json
{
  "roots": [
    {
      "uri": "file:///Users/username/projects",
      "name": "Projects"
    },
    {
      "uri": "file:///Users/username/documents",
      "name": "Documents"
    }
  ]
}
\`\`\`

### Resources

#### Read Files: \`file:///{path}\`

Read the contents of a text file.

**Example:**
\`\`\`
file:///Users/username/projects/README.md
\`\`\`

**Response:**
\`\`\`json
{
  "contents": [{
    "uri": "file:///Users/username/projects/README.md",
    "mimeType": "text/plain",
    "text": "# My Project\\n\\nProject description..."
  }]
}
\`\`\`

**Supported MIME types:**
- \`text/plain\` - Text files
- \`text/markdown\` - Markdown files
- \`application/json\` - JSON files
- \`application/javascript\` - JavaScript files
- \`text/html\` - HTML files

#### List Directories: \`dir:///{path}\`

List contents of a directory with pagination support.

**Example:**
\`\`\`
dir:///Users/username/projects?limit=50&cursor=next_page_token
\`\`\`

**Response:**
\`\`\`json
{
  "contents": [{
    "uri": "dir:///Users/username/projects",
    "mimeType": "application/json",
    "text": "{
      \\"entries\\": [
        {\\"name\\": \\"README.md\\", \\"type\\": \\"file\\", \\"size\\": 1234},
        {\\"name\\": \\"src\\", \\"type\\": \\"directory\\"}
      ],
      \\"total\\": 2
    }"
  }],
  "nextCursor": null
}
\`\`\`

#### File Metadata: \`file:///{path}/metadata\`

Get detailed file information without reading contents.

**Example:**
\`\`\`
file:///Users/username/projects/package.json/metadata
\`\`\`

**Response:**
\`\`\`json
{
  "contents": [{
    "uri": "file:///Users/username/projects/package.json/metadata",
    "mimeType": "application/json",
    "text": "{
      \\"path\\": \\"/Users/username/projects/package.json\\",
      \\"size\\": 456,
      \\"modified\\": \\"2025-01-10T12:00:00Z\\",
      \\"created\\": \\"2024-12-01T10:00:00Z\\",
      \\"permissions\\": \\"rw-r--r--\\",
      \\"type\\": \\"file\\"
    }"
  }]
}
\`\`\`

### Subscriptions

Subscribe to file or directory changes:

\`\`\`json
{
  "method": "resources/subscribe",
  "params": {
    "uri": "file:///Users/username/projects/config.json"
  }
}
\`\`\`

When the file changes, you'll receive:

\`\`\`json
{
  "method": "notifications/resources/updated",
  "params": {
    "uri": "file:///Users/username/projects/config.json"
  }
}
\`\`\`

### Error Handling

**Access Denied (403):**
\`\`\`json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "Error: Access denied. Path is outside allowed roots. Please ensure the path is within your configured project directories."
  }]
}
\`\`\`

**File Not Found (404):**
\`\`\`json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "Error: File not found at path: /Users/username/projects/missing.txt"
  }]
}
\`\`\`

**Directory Traversal Attempt (400):**
\`\`\`json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "Error: Invalid path. Directory traversal attempts are not allowed."
  }]
}
\`\`\`

### Pagination

For large directories, use pagination parameters:

- \`limit\`: Number of entries per page (default: 100, max: 1000)
- \`cursor\`: Pagination token from previous response

### Performance Notes

- File reads are streamed for large files (>10MB)
- Directory listings cache results for 30 seconds
- File watching uses efficient native APIs (FSEvents on macOS, inotify on Linux)
`;
