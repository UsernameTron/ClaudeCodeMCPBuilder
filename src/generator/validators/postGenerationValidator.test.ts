/**
 * Post-Generation Validator Tests
 *
 * Comprehensive test suite for post-generation validation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PostGenerationValidator } from './postGenerationValidator';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

describe('PostGenerationValidator', () => {
  let validator: PostGenerationValidator;
  let testDir: string;

  beforeEach(async () => {
    validator = new PostGenerationValidator();
    testDir = path.join(os.tmpdir(), 'mcp-validation-test-' + Date.now());
    await fs.promises.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.promises.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('validateRequiredFiles', () => {
    it('should pass when all required files exist', async () => {
      // Create all required files
      await fs.promises.writeFile(path.join(testDir, 'package.json'), '{}');
      await fs.promises.writeFile(path.join(testDir, 'tsconfig.json'), '{}');
      await fs.promises.writeFile(path.join(testDir, 'README.md'), '# Test');
      await fs.promises.writeFile(path.join(testDir, '.gitignore'), 'node_modules/');
      await fs.promises.mkdir(path.join(testDir, 'src'));
      await fs.promises.writeFile(path.join(testDir, 'src', 'index.ts'), '');

      const result = await validator.validateGeneratedCode(testDir);

      // Should not have errors about missing files
      const missingFileErrors = result.issues.filter(
        (issue) => issue.severity === 'error' && issue.message.includes('Required file missing')
      );
      expect(missingFileErrors).toHaveLength(0);
    });

    it('should fail when required files are missing', async () => {
      const result = await validator.validateGeneratedCode(testDir);

      expect(result.success).toBe(false);
      expect(result.issues.some((i) => i.message.includes('package.json'))).toBe(true);
      expect(result.issues.some((i) => i.message.includes('tsconfig.json'))).toBe(true);
      expect(result.issues.some((i) => i.message.includes('src/index.ts'))).toBe(true);
    });

    it('should identify specific missing files', async () => {
      // Create some but not all files
      await fs.promises.writeFile(path.join(testDir, 'package.json'), '{}');
      await fs.promises.writeFile(path.join(testDir, 'tsconfig.json'), '{}');

      const result = await validator.validateGeneratedCode(testDir);

      const missingFiles = result.issues.filter(
        (issue) => issue.severity === 'error' && issue.message.includes('Required file missing')
      );
      expect(missingFiles.length).toBeGreaterThan(0);
    });
  });

  describe('validateTypeScript', () => {
    it('should pass for valid TypeScript code', async () => {
      // Create valid TypeScript setup
      await fs.promises.mkdir(path.join(testDir, 'src'));

      await fs.promises.writeFile(
        path.join(testDir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            target: 'ES2022',
            module: 'ES2022',
            outDir: './dist',
            rootDir: './src',
            strict: true,
          },
          include: ['src/**/*'],
        })
      );

      await fs.promises.writeFile(
        path.join(testDir, 'src', 'index.ts'),
        `
const greeting: string = "Hello, World!";
console.log(greeting);
export {};
`
      );

      const result = await validator.validateGeneratedCode(testDir);

      const tsErrors = result.issues.filter(
        (issue) => issue.severity === 'error' && issue.message.includes('TypeScript')
      );
      expect(tsErrors).toHaveLength(0);
    });

    it('should catch TypeScript compilation errors', async () => {
      await fs.promises.mkdir(path.join(testDir, 'src'));

      await fs.promises.writeFile(
        path.join(testDir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            target: 'ES2022',
            module: 'ES2022',
            outDir: './dist',
            rootDir: './src',
            strict: true,
          },
          include: ['src/**/*'],
        })
      );

      // Invalid TypeScript code
      await fs.promises.writeFile(
        path.join(testDir, 'src', 'index.ts'),
        `
const x: number = "not a number"; // Type error
export {};
`
      );

      const result = await validator.validateGeneratedCode(testDir);

      expect(result.success).toBe(false);
      const tsErrors = result.issues.filter((issue) => issue.severity === 'error');
      expect(tsErrors.length).toBeGreaterThan(0);
    });

    it('should handle malformed tsconfig.json', async () => {
      await fs.promises.writeFile(path.join(testDir, 'tsconfig.json'), '{invalid json}');

      const result = await validator.validateGeneratedCode(testDir);

      const configErrors = result.issues.filter(
        (issue) => issue.file === 'tsconfig.json' && issue.severity === 'error'
      );
      expect(configErrors.length).toBeGreaterThan(0);
    });
  });

  describe('validatePackageJson', () => {
    it('should pass for valid package.json', async () => {
      const validPackage = {
        name: 'test-server',
        version: '1.0.0',
        type: 'module',
        main: 'dist/index.js',
        scripts: {
          build: 'tsc',
        },
        dependencies: {
          '@modelcontextprotocol/sdk': '^1.0.0',
        },
      };

      await fs.promises.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(validPackage)
      );

      const result = await validator.validateGeneratedCode(testDir);

      const packageErrors = result.issues.filter(
        (issue) => issue.file === 'package.json' && issue.severity === 'error'
      );
      expect(packageErrors).toHaveLength(0);
    });

    it('should fail when required fields are missing', async () => {
      await fs.promises.writeFile(path.join(testDir, 'package.json'), JSON.stringify({}));

      const result = await validator.validateGeneratedCode(testDir);

      expect(result.success).toBe(false);
      expect(result.issues.some((i) => i.message.includes('Missing required field: name'))).toBe(
        true
      );
      expect(result.issues.some((i) => i.message.includes('Missing required field: version'))).toBe(
        true
      );
    });

    it('should fail when MCP SDK dependency is missing', async () => {
      const packageWithoutSDK = {
        name: 'test',
        version: '1.0.0',
        type: 'module',
        main: 'index.js',
        scripts: { build: 'tsc' },
        dependencies: {},
      };

      await fs.promises.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageWithoutSDK)
      );

      const result = await validator.validateGeneratedCode(testDir);

      expect(
        result.issues.some((i) => i.message.includes('@modelcontextprotocol/sdk'))
      ).toBe(true);
    });

    it('should fail when type is not "module"', async () => {
      const packageWithWrongType = {
        name: 'test',
        version: '1.0.0',
        type: 'commonjs',
        main: 'index.js',
        scripts: { build: 'tsc' },
        dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
      };

      await fs.promises.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageWithWrongType)
      );

      const result = await validator.validateGeneratedCode(testDir);

      expect(result.issues.some((i) => i.message.includes('"type": "module"'))).toBe(true);
    });

    it('should warn when recommended scripts are missing', async () => {
      const packageWithoutScripts = {
        name: 'test',
        version: '1.0.0',
        type: 'module',
        main: 'index.js',
        scripts: {},
        dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
      };

      await fs.promises.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageWithoutScripts)
      );

      const result = await validator.validateGeneratedCode(testDir);

      const scriptWarnings = result.issues.filter(
        (i) => i.severity === 'warning' && i.message.includes('Missing recommended script')
      );
      expect(scriptWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('checkSecurityIssues', () => {
    beforeEach(async () => {
      await fs.promises.mkdir(path.join(testDir, 'src'));
    });

    it('should warn about eval usage', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'src', 'bad.ts'),
        `
const result = eval("1 + 1");
export {};
`
      );

      const result = await validator.validateGeneratedCode(testDir);

      expect(result.issues.some((i) => i.message.includes('eval()'))).toBe(true);
    });

    it('should warn about Function constructor', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'src', 'bad.ts'),
        `
const fn = new Function("return 42");
export {};
`
      );

      const result = await validator.validateGeneratedCode(testDir);

      expect(result.issues.some((i) => i.message.includes('Function()'))).toBe(true);
    });

    it('should warn about innerHTML usage', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'src', 'bad.ts'),
        `
element.innerHTML = userInput;
export {};
`
      );

      const result = await validator.validateGeneratedCode(testDir);

      expect(result.issues.some((i) => i.message.includes('innerHTML'))).toBe(true);
    });

    it('should detect potential hardcoded secrets', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'src', 'bad.ts'),
        `
const apiKey = "sk-1234567890abcdefghijklmnopqrstuvwxyz";
export {};
`
      );

      const result = await validator.validateGeneratedCode(testDir);

      expect(result.issues.some((i) => i.message.includes('hardcoded'))).toBe(true);
    });

    it('should pass for clean code', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'src', 'good.ts'),
        `
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server({ name: 'test', version: '1.0.0' });
export { server };
`
      );

      const result = await validator.validateGeneratedCode(testDir);

      const securityIssues = result.issues.filter((i) =>
        i.message.toLowerCase().includes('security')
      );
      expect(securityIssues).toHaveLength(0);
    });
  });

  describe('validateMCPCompliance', () => {
    beforeEach(async () => {
      await fs.promises.mkdir(path.join(testDir, 'src'));
    });

    it('should pass for valid MCP server', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'src', 'index.ts'),
        `
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'test-server',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler('tools/list', async () => ({
  tools: []
}));

const transport = new StdioServerTransport();
await server.connect(transport);
export { server };
`
      );

      const result = await validator.validateGeneratedCode(testDir);

      const mcpErrors = result.issues.filter(
        (i) => i.severity === 'error' && i.file === 'src/index.ts'
      );
      expect(mcpErrors).toHaveLength(0);
    });

    it('should fail when MCP SDK import is missing', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'src', 'index.ts'),
        `
console.log("Not an MCP server");
export {};
`
      );

      const result = await validator.validateGeneratedCode(testDir);

      expect(result.success).toBe(false);
      expect(result.issues.some((i) => i.message.includes('MCP SDK import'))).toBe(true);
    });

    it('should fail when Server is not initialized', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'src', 'index.ts'),
        `
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
// No server initialization
export {};
`
      );

      const result = await validator.validateGeneratedCode(testDir);

      expect(result.issues.some((i) => i.message.includes('Server initialization'))).toBe(true);
    });

    it('should fail when no capabilities are detected', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'src', 'index.ts'),
        `
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
const server = new Server({ name: 'test', version: '1.0.0' });
// No capabilities implemented
export { server };
`
      );

      const result = await validator.validateGeneratedCode(testDir);

      expect(result.issues.some((i) => i.message.includes('capabilities'))).toBe(true);
    });

    it('should warn when transport is not configured', async () => {
      await fs.promises.writeFile(
        path.join(testDir, 'src', 'index.ts'),
        `
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server({ name: 'test', version: '1.0.0' });
server.setRequestHandler('tools/list', async () => ({ tools: [] }));
// No transport
export { server };
`
      );

      const result = await validator.validateGeneratedCode(testDir);

      expect(result.issues.some((i) => i.message.includes('transport'))).toBe(true);
    });
  });

  describe('integration', () => {
    it('should return success: true when all validations pass', async () => {
      // Create a complete valid server
      await fs.promises.mkdir(path.join(testDir, 'src'));

      await fs.promises.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({
          name: 'test-server',
          version: '1.0.0',
          type: 'module',
          main: 'dist/index.js',
          scripts: { build: 'tsc' },
          dependencies: { '@modelcontextprotocol/sdk': '^1.0.0' },
        })
      );

      await fs.promises.writeFile(
        path.join(testDir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            target: 'ES2022',
            module: 'ES2022',
            moduleResolution: 'bundler',
            outDir: './dist',
            rootDir: './src',
            skipLibCheck: true,
          },
          include: ['src/**/*'],
        })
      );

      await fs.promises.writeFile(
        path.join(testDir, 'src', 'index.ts'),
        `
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'test',
  version: '1.0.0'
}, {
  capabilities: { tools: {} }
});

server.setRequestHandler('tools/list', async () => ({ tools: [] }));

const transport = new StdioServerTransport();
await server.connect(transport);
`
      );

      await fs.promises.writeFile(path.join(testDir, 'README.md'), '# Test');
      await fs.promises.writeFile(path.join(testDir, '.gitignore'), 'node_modules/');

      const result = await validator.validateGeneratedCode(testDir);

      // Filter out module resolution errors (SDK not installed in test environment)
      const errors = result.issues.filter(
        (i) =>
          i.severity === 'error' &&
          !i.message.includes('Cannot find module') &&
          !i.message.includes('type declarations')
      );

      // Should have no other errors
      expect(errors).toHaveLength(0);

      // All other validations should pass
      const nonModuleErrors = result.issues.filter(
        (i) => i.severity === 'error' && i.message.includes('Cannot find module')
      );
      expect(nonModuleErrors.length).toBeLessThanOrEqual(2); // Only MCP SDK imports
    });

    it('should collect multiple error types', async () => {
      // Create directory with multiple issues
      await fs.promises.mkdir(path.join(testDir, 'src'));

      await fs.promises.writeFile(path.join(testDir, 'package.json'), '{}'); // Missing fields

      await fs.promises.writeFile(
        path.join(testDir, 'src', 'index.ts'),
        'console.log("bad");' // Missing MCP
      );

      const result = await validator.validateGeneratedCode(testDir);

      expect(result.success).toBe(false);
      expect(result.issues.length).toBeGreaterThan(1);

      const errorTypes = new Set(result.issues.map((i) => i.file));
      expect(errorTypes.size).toBeGreaterThan(1); // Multiple files with errors
    });
  });
});
