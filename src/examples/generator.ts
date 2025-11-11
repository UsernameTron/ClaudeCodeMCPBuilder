/**
 * Example Server Generator
 *
 * Generates MCP servers from production-ready examples.
 */

import fs from 'fs/promises';
import path from 'path';
import type { ExampleServer } from './catalog.js';
import { getExampleById } from './catalog.js';

export interface GenerateExampleOptions {
  exampleId: string;
  name: string;
  outputDir: string;
  includeTests?: boolean;
  customizePackageName?: boolean;
  createBundle?: boolean;
  bundleAuthor?: {
    name: string;
    email?: string;
    url?: string;
  };
}

export interface GenerateExampleResult {
  path: string;
  filesCreated: string[];
  configurationSteps: string[];
  warnings?: string[];
  bundlePath?: string;
}

/**
 * Generates a new MCP server from an example
 */
export async function generateFromExample(
  options: GenerateExampleOptions
): Promise<GenerateExampleResult> {
  const example = getExampleById(options.exampleId);
  if (!example) {
    throw new Error(`Example server '${options.exampleId}' not found`);
  }

  const serverPath = path.join(options.outputDir, options.name);
  const filesCreated: string[] = [];
  const warnings: string[] = [];
  const configurationSteps: string[] = [];

  // Create output directory
  await fs.mkdir(serverPath, { recursive: true });

  // Get example source path
  const exampleSourcePath = path.join(
    process.cwd(),
    'src',
    'examples',
    options.exampleId
  );

  // Copy all files from example
  await copyDirectory(exampleSourcePath, serverPath, filesCreated);

  // Customize package.json if requested
  if (options.customizePackageName) {
    await customizePackageJson(serverPath, options.name, example);
    filesCreated.push('package.json (customized)');
  }

  // Generate configuration guide
  const configGuide = generateConfigurationGuide(example, options.name);
  await fs.writeFile(
    path.join(serverPath, 'CONFIGURATION.md'),
    configGuide
  );
  filesCreated.push('CONFIGURATION.md');

  // Add configuration steps
  configurationSteps.push(...getConfigurationSteps(example));

  // Add warnings if auth or config required
  if (example.requiresAuth) {
    warnings.push(`⚠️  This server requires authentication. See CONFIGURATION.md for setup instructions.`);
  }

  if (example.requiresConfig) {
    warnings.push(`⚠️  This server requires configuration. See CONFIGURATION.md for details.`);
  }

  if (example.dependencies && example.dependencies.length > 0) {
    warnings.push(`📦 Run 'npm install' to install dependencies: ${example.dependencies.join(', ')}`);
  }

  // Create .mcpb bundle if requested
  let bundlePath: string | undefined;
  if (options.createBundle) {
    try {
      // Dynamic import to avoid circular dependency
      const { createBundleForExample } = await import('../packaging/index.js');

      const author = options.bundleAuthor || {
        name: 'Your Name',
        email: 'your.email@example.com',
      };

      const bundleResult = await createBundleForExample(
        options.exampleId,
        serverPath,
        options.name,
        author
      );

      bundlePath = bundleResult.manifestPath;
      filesCreated.push('manifest.json (.mcpb bundle)');
      warnings.push('📦 .mcpb bundle manifest created! You can now install this with Claude Desktop.');
    } catch (error) {
      warnings.push(`⚠️  Failed to create .mcpb bundle: ${(error as Error).message}`);
    }
  }

  return {
    path: serverPath,
    filesCreated,
    configurationSteps,
    warnings: warnings.length > 0 ? warnings : undefined,
    bundlePath,
  };
}

/**
 * Recursively copies a directory
 */
async function copyDirectory(
  source: string,
  destination: string,
  filesCreated: string[]
): Promise<void> {
  await fs.mkdir(destination, { recursive: true });

  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath, filesCreated);
    } else {
      await fs.copyFile(srcPath, destPath);
      filesCreated.push(path.relative(destination, destPath));
    }
  }
}

/**
 * Customizes package.json for the new server
 */
async function customizePackageJson(
  serverPath: string,
  serverName: string,
  example: ExampleServer
): Promise<void> {
  const packageJsonPath = path.join(serverPath, 'package.json');

  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);

    // Customize name
    pkg.name = serverName;

    // Update description to indicate it's based on an example
    pkg.description = `${pkg.description} (Based on ${example.name})`;

    // Update version to 1.0.0 for new project
    pkg.version = '1.0.0';

    // Update author
    pkg.author = 'Your Name';

    // Update bin if it exists
    if (pkg.bin) {
      const binName = `mcp-server-${serverName}`;
      pkg.bin = {
        [binName]: pkg.bin[Object.keys(pkg.bin)[0]],
      };
    }

    await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    // If package.json doesn't exist or can't be parsed, skip customization
    console.warn(`Warning: Could not customize package.json: ${(error as Error).message}`);
  }
}

/**
 * Generates a configuration guide for the example server
 */
function generateConfigurationGuide(example: ExampleServer, serverName: string): string {
  let guide = `# Configuration Guide: ${serverName}\n\n`;
  guide += `Based on: **${example.name}**\n\n`;
  guide += `${example.description}\n\n`;

  guide += `## Features\n\n`;
  for (const feature of example.features) {
    guide += `- ${feature}\n`;
  }
  guide += `\n`;

  if (example.dependencies && example.dependencies.length > 0) {
    guide += `## Dependencies\n\n`;
    guide += `This server requires the following npm packages:\n\n`;
    for (const dep of example.dependencies) {
      guide += `- \`${dep}\`\n`;
    }
    guide += `\n`;
    guide += `Install them with:\n\n`;
    guide += `\`\`\`bash\n`;
    guide += `npm install\n`;
    guide += `\`\`\`\n\n`;
  }

  if (example.requiresConfig) {
    guide += `## Configuration\n\n`;
    guide += getConfigurationInstructions(example);
    guide += `\n`;
  }

  if (example.requiresAuth) {
    guide += `## Authentication\n\n`;
    guide += getAuthenticationInstructions(example);
    guide += `\n`;
  }

  guide += `## Building\n\n`;
  guide += `\`\`\`bash\n`;
  guide += `npm run build\n`;
  guide += `\`\`\`\n\n`;

  guide += `## Running\n\n`;
  guide += `\`\`\`bash\n`;
  guide += `npm start\n`;
  guide += `\`\`\`\n\n`;

  guide += `## Documentation\n\n`;
  guide += `For more information, see:\n`;
  guide += `- [Original Documentation](${example.documentationUrl})\n`;
  guide += `- [Source Repository](${example.sourceRepo})\n\n`;

  return guide;
}

/**
 * Gets configuration instructions based on the example type
 */
function getConfigurationInstructions(example: ExampleServer): string {
  switch (example.id) {
    case 'memory':
      return `### Memory File Path

The knowledge graph is stored in a JSONL file. You can configure the location using the \`MEMORY_FILE_PATH\` environment variable:

\`\`\`bash
export MEMORY_FILE_PATH="/path/to/memory.jsonl"
\`\`\`

If not specified, it defaults to \`memory.jsonl\` in the server directory.
`;

    case 'filesystem':
      return `### Allowed Directories

For security, you must specify which directories the server can access:

\`\`\`bash
mcp-server-filesystem /path/to/allowed/dir1 /path/to/allowed/dir2
\`\`\`

The server will only allow operations within these directories and their subdirectories.
`;

    case 'github':
      return `### GitHub Token

Create a GitHub personal access token with appropriate permissions:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select required scopes (repo, workflow, etc.)
4. Set the token as an environment variable:

\`\`\`bash
export GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"
\`\`\`
`;

    case 'postgres':
      return `### Database Connection

Configure the PostgreSQL connection string:

\`\`\`bash
export POSTGRES_CONNECTION_STRING="postgresql://user:password@localhost:5432/database"
\`\`\`

Or set individual environment variables:
- \`POSTGRES_HOST\`
- \`POSTGRES_PORT\`
- \`POSTGRES_USER\`
- \`POSTGRES_PASSWORD\`
- \`POSTGRES_DATABASE\`
`;

    case 'slack':
      return `### Slack Token

Create a Slack app and get a bot token:

1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Navigate to OAuth & Permissions
4. Install app to workspace
5. Copy the Bot User OAuth Token
6. Set as environment variable:

\`\`\`bash
export SLACK_BOT_TOKEN="xoxb-your-token"
\`\`\`
`;

    default:
      return 'See the README.md file in the generated server directory for configuration instructions.\n';
  }
}

/**
 * Gets authentication instructions
 */
function getAuthenticationInstructions(example: ExampleServer): string {
  if (!example.requiresAuth) {
    return 'This server does not require authentication.\n';
  }

  return `This server requires authentication. See the Configuration section above for details on obtaining and setting up credentials.\n

**Security Best Practices:**
- Never commit credentials to version control
- Use environment variables for sensitive data
- Consider using a secrets manager for production
- Rotate credentials regularly
`;
}

/**
 * Gets configuration steps for display
 */
function getConfigurationSteps(example: ExampleServer): string[] {
  const steps: string[] = [];

  steps.push('1. Run `npm install` to install dependencies');
  steps.push('2. Run `npm run build` to compile TypeScript');

  if (example.requiresConfig) {
    steps.push('3. Configure the server (see CONFIGURATION.md)');
  }

  if (example.requiresAuth) {
    steps.push('4. Set up authentication credentials (see CONFIGURATION.md)');
  }

  steps.push(`${steps.length + 1}. Run the server with your MCP client`);

  return steps;
}
