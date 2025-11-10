#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { generateServer } from '../generator/index.js';
import type { ServerConfig } from '../generator/types.js';

const program = new Command();

program
  .name('create-mcp-server')
  .description('Generate a new MCP server based on Anthropic best practices')
  .version('1.0.0')
  .option('-n, --name <name>', 'Server name')
  .option('-t, --type <type>', 'Server type (tools|resources|prompts|mixed)')
  .option('-d, --description <description>', 'Server description')
  .option('-o, --output <path>', 'Output directory', './generated-servers')
  .option('--skip-install', 'Skip npm install')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🚀 MCP Server Generator\n'));
    console.log(chalk.gray('Based on Anthropic Model Context Protocol Specification\n'));

    let config: ServerConfig;

    if (options.name && options.type) {
      // Non-interactive mode
      config = {
        name: options.name,
        type: options.type as 'tools' | 'resources' | 'prompts' | 'mixed',
        description: options.description || `${options.name} MCP Server`,
        outputDir: options.output,
        skipInstall: options.skipInstall || false,
        capabilities: {
          tools: options.type === 'tools' || options.type === 'mixed',
          resources: options.type === 'resources' || options.type === 'mixed',
          prompts: options.type === 'prompts' || options.type === 'mixed',
        },
        features: {
          listChanged: true,
          subscribe: options.type === 'resources' || options.type === 'mixed',
        },
        security: {
          validateInputs: true,
          sanitizePaths: true,
          rateLimit: true,
        }
      };
    } else {
      // Interactive mode
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Server name:',
          default: 'my-mcp-server',
          validate: (input: string) => {
            if (!/^[a-z0-9-]+$/.test(input)) {
              return 'Server name must contain only lowercase letters, numbers, and hyphens';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'description',
          message: 'Server description:',
          default: (answers: any) => `${answers.name} MCP Server`
        },
        {
          type: 'list',
          name: 'type',
          message: 'What type of MCP server?',
          choices: [
            { name: '🔧 Tools - Executable actions (recommended for APIs, operations)', value: 'tools' },
            { name: '📄 Resources - Data/content exposure (recommended for files, databases)', value: 'resources' },
            { name: '💬 Prompts - Reusable templates (recommended for workflows)', value: 'prompts' },
            { name: '🎯 Mixed - All capabilities', value: 'mixed' }
          ]
        },
        {
          type: 'checkbox',
          name: 'features',
          message: 'Select additional features:',
          choices: [
            { name: 'Resource subscriptions (real-time updates)', value: 'subscribe', checked: true },
            { name: 'Dynamic capability changes (list_changed)', value: 'listChanged', checked: true },
            { name: 'Structured outputs (outputSchema)', value: 'structuredOutputs', checked: true },
          ]
        },
        {
          type: 'confirm',
          name: 'includeExamples',
          message: 'Include example implementations?',
          default: true
        },
        {
          type: 'confirm',
          name: 'includeTests',
          message: 'Generate test files?',
          default: true
        },
        {
          type: 'input',
          name: 'outputDir',
          message: 'Output directory:',
          default: './generated-servers'
        },
        {
          type: 'confirm',
          name: 'runInstall',
          message: 'Run npm install after generation?',
          default: true
        }
      ]);

      config = {
        name: answers.name,
        type: answers.type,
        description: answers.description,
        outputDir: answers.outputDir,
        skipInstall: !answers.runInstall,
        capabilities: {
          tools: answers.type === 'tools' || answers.type === 'mixed',
          resources: answers.type === 'resources' || answers.type === 'mixed',
          prompts: answers.type === 'prompts' || answers.type === 'mixed',
        },
        features: {
          listChanged: answers.features.includes('listChanged'),
          subscribe: answers.features.includes('subscribe'),
          structuredOutputs: answers.features.includes('structuredOutputs'),
        },
        includeExamples: answers.includeExamples,
        includeTests: answers.includeTests,
        security: {
          validateInputs: true,
          sanitizePaths: true,
          rateLimit: true,
        }
      };
    }

    console.log(chalk.blue('\n📦 Generating server...\n'));

    try {
      const result = await generateServer(config);

      console.log(chalk.green.bold('\n✅ Server generated successfully!\n'));
      console.log(chalk.white('Location:'), chalk.cyan(result.path));
      console.log(chalk.white('Files created:'), chalk.cyan(result.filesCreated.length));

      console.log(chalk.blue.bold('\n📚 Next Steps:\n'));
      console.log(chalk.white('1. Navigate to your server:'));
      console.log(chalk.gray(`   cd ${result.path}\n`));

      if (config.skipInstall) {
        console.log(chalk.white('2. Install dependencies:'));
        console.log(chalk.gray('   npm install\n'));
      }

      console.log(chalk.white(`${config.skipInstall ? '3' : '2'}. Build the server:`));
      console.log(chalk.gray('   npm run build\n'));

      console.log(chalk.white(`${config.skipInstall ? '4' : '3'}. Test the server:`));
      console.log(chalk.gray('   npm test\n'));

      console.log(chalk.white(`${config.skipInstall ? '5' : '4'}. Add to Claude Desktop:`));
      console.log(chalk.gray('   Edit ~/Library/Application Support/Claude/claude_desktop_config.json'));
      console.log(chalk.gray('   See the generated README.md for configuration details\n'));

      console.log(chalk.blue.bold('📖 Documentation:\n'));
      console.log(chalk.white('- Server README:'), chalk.cyan(`${result.path}/README.md`));
      console.log(chalk.white('- MCP Docs:'), chalk.cyan('docs/ClaudeMCP.md'));
      console.log(chalk.white('- Official Spec:'), chalk.cyan('https://modelcontextprotocol.io\n'));

    } catch (error) {
      console.error(chalk.red.bold('\n❌ Error generating server:\n'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse();
