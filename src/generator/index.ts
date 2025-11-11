import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ServerConfig, GenerationResult } from './types.js';
import { generatePackageJson } from './templates/package.js';
import { generateServerIndex } from './templates/server-index.js';
import { generateToolsModule } from './templates/tools.js';
import { generateResourcesModule } from './templates/resources.js';
import { generatePromptsModule } from './templates/prompts.js';
import { generateReadme } from './templates/readme.js';
import { generateTsConfig } from './templates/tsconfig.js';
import { generateTests } from './templates/tests.js';
import { CapabilityValidator } from './validation/index.js';

const execAsync = promisify(exec);

export async function generateServer(config: ServerConfig): Promise<GenerationResult> {
  // Validate capabilities before generation
  try {
    CapabilityValidator.validateCapabilities(config.capabilities);
    CapabilityValidator.validateConfiguration({
      capabilities: config.capabilities,
      tools: config.includeExamples ? ['echo'] : undefined,
      resources: config.includeExamples ? ['server://info'] : undefined,
      prompts: config.includeExamples ? ['analyze_data'] : undefined,
    });
  } catch (error) {
    throw new Error(`Invalid server configuration: ${(error as Error).message}`);
  }

  const serverPath = path.join(config.outputDir, config.name);
  const filesCreated: string[] = [];
  const warnings: string[] = [];

  // Create directory structure
  await fs.mkdir(serverPath, { recursive: true });
  await fs.mkdir(path.join(serverPath, 'src'), { recursive: true });
  await fs.mkdir(path.join(serverPath, 'src', 'tools'), { recursive: true });
  await fs.mkdir(path.join(serverPath, 'src', 'resources'), { recursive: true });
  await fs.mkdir(path.join(serverPath, 'src', 'prompts'), { recursive: true });

  if (config.includeTests) {
    await fs.mkdir(path.join(serverPath, 'tests'), { recursive: true });
  }

  // Generate package.json
  const packageJson = generatePackageJson(config);
  await fs.writeFile(
    path.join(serverPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  filesCreated.push('package.json');

  // Generate tsconfig.json
  const tsConfig = generateTsConfig();
  await fs.writeFile(
    path.join(serverPath, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );
  filesCreated.push('tsconfig.json');

  // Generate main server index
  const serverIndex = generateServerIndex(config);
  await fs.writeFile(
    path.join(serverPath, 'src', 'index.ts'),
    serverIndex
  );
  filesCreated.push('src/index.ts');

  // Generate module files based on capabilities
  if (config.capabilities.tools) {
    const toolsModule = generateToolsModule(config);
    await fs.writeFile(
      path.join(serverPath, 'src', 'tools', 'index.ts'),
      toolsModule
    );
    filesCreated.push('src/tools/index.ts');
  }

  if (config.capabilities.resources) {
    const resourcesModule = generateResourcesModule(config);
    await fs.writeFile(
      path.join(serverPath, 'src', 'resources', 'index.ts'),
      resourcesModule
    );
    filesCreated.push('src/resources/index.ts');
  }

  if (config.capabilities.prompts) {
    const promptsModule = generatePromptsModule(config);
    await fs.writeFile(
      path.join(serverPath, 'src', 'prompts', 'index.ts'),
      promptsModule
    );
    filesCreated.push('src/prompts/index.ts');
  }

  // Generate README
  const readme = generateReadme(config);
  await fs.writeFile(
    path.join(serverPath, 'README.md'),
    readme
  );
  filesCreated.push('README.md');

  // Generate .gitignore
  const gitignore = `node_modules/
dist/
*.log
.env
.DS_Store
`;
  await fs.writeFile(
    path.join(serverPath, '.gitignore'),
    gitignore
  );
  filesCreated.push('.gitignore');

  // Generate tests if requested
  if (config.includeTests) {
    const tests = generateTests(config);
    await fs.writeFile(
      path.join(serverPath, 'tests', 'server.test.ts'),
      tests
    );
    filesCreated.push('tests/server.test.ts');
  }

  // Install dependencies if requested
  if (!config.skipInstall) {
    try {
      await execAsync('npm install', { cwd: serverPath });
    } catch (error) {
      warnings.push('Failed to run npm install. Please run it manually.');
    }
  }

  return {
    path: serverPath,
    filesCreated,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}
