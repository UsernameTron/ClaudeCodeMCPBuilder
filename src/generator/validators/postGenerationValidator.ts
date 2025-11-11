/**
 * Post-Generation Validator
 *
 * Validates generated MCP server code before completion to ensure:
 * - All required files exist
 * - TypeScript compilation succeeds
 * - package.json is well-formed
 * - No security issues in generated code
 * - MCP protocol compliance
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  file: string;
  line?: number;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  issues: ValidationIssue[];
}

export class PostGenerationValidator {
  /**
   * Validates generated TypeScript code.
   *
   * @param outputDir - Path to generated server directory
   * @returns Validation result with success status and any issues found
   *
   * @example
   * const validator = new PostGenerationValidator();
   * const result = await validator.validateGeneratedCode('./my-server');
   * if (!result.success) {
   *   console.error('Validation failed:', result.issues);
   * }
   */
  async validateGeneratedCode(outputDir: string): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // 1. Check that all required files exist
    const fileIssues = await this.validateRequiredFiles(outputDir);
    issues.push(...fileIssues);

    // 2. Validate TypeScript compilation
    const tsIssues = await this.validateTypeScript(outputDir);
    issues.push(...tsIssues);

    // 3. Validate package.json
    const packageIssues = await this.validatePackageJson(outputDir);
    issues.push(...packageIssues);

    // 4. Check for security issues in generated code
    const securityIssues = await this.checkSecurityIssues(outputDir);
    issues.push(...securityIssues);

    // 5. Validate MCP protocol compliance
    const mcpIssues = await this.validateMCPCompliance(outputDir);
    issues.push(...mcpIssues);

    const hasErrors = issues.some((issue) => issue.severity === 'error');

    return {
      success: !hasErrors,
      issues,
    };
  }

  /**
   * Validates that all required files exist.
   */
  private async validateRequiredFiles(outputDir: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'src/index.ts',
      'README.md',
      '.gitignore',
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(outputDir, file);
      if (!(await this.fileExists(filePath))) {
        issues.push({
          severity: 'error',
          file,
          message: `Required file missing: ${file}`,
        });
      }
    }

    return issues;
  }

  /**
   * Validates TypeScript compilation.
   */
  private async validateTypeScript(outputDir: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const tsconfigPath = path.join(outputDir, 'tsconfig.json');

    if (!(await this.fileExists(tsconfigPath))) {
      return issues;
    }

    try {
      // Read tsconfig
      const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

      if (configFile.error) {
        issues.push({
          severity: 'error',
          file: 'tsconfig.json',
          message: `tsconfig.json parse error: ${ts.flattenDiagnosticMessageText(
            configFile.error.messageText,
            '\n'
          )}`,
        });
        return issues;
      }

      const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, outputDir);

      if (config.errors.length > 0) {
        for (const error of config.errors) {
          issues.push({
            severity: 'error',
            file: 'tsconfig.json',
            message: ts.flattenDiagnosticMessageText(error.messageText, '\n'),
          });
        }
        return issues;
      }

      // Create program
      const program = ts.createProgram(config.fileNames, config.options);

      // Get diagnostics
      const diagnostics = ts.getPreEmitDiagnostics(program);

      // Convert to issues (filter out node_modules errors)
      for (const diagnostic of diagnostics) {
        if (diagnostic.file) {
          // Skip errors from node_modules
          if (diagnostic.file.fileName.includes('node_modules')) {
            continue;
          }

          const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
          const relativePath = path.relative(outputDir, diagnostic.file.fileName);

          issues.push({
            severity:
              diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
            file: relativePath,
            line: line + 1,
            message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
          });
        } else {
          // Only include non-node_modules errors
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
          if (!message.includes('node_modules')) {
            issues.push({
              severity:
                diagnostic.category === ts.DiagnosticCategory.Error ? 'error' : 'warning',
              file: 'unknown',
              message,
            });
          }
        }
      }
    } catch (error) {
      issues.push({
        severity: 'error',
        file: 'tsconfig.json',
        message: `TypeScript validation failed: ${(error as Error).message}`,
      });
    }

    return issues;
  }

  /**
   * Validates package.json structure and dependencies.
   */
  private async validatePackageJson(outputDir: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const packagePath = path.join(outputDir, 'package.json');

    if (!(await this.fileExists(packagePath))) {
      return issues;
    }

    try {
      const content = await fs.promises.readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);

      // Check required fields
      const requiredFields = ['name', 'version', 'main', 'scripts', 'type'];
      for (const field of requiredFields) {
        if (!pkg[field]) {
          issues.push({
            severity: 'error',
            file: 'package.json',
            message: `Missing required field: ${field}`,
          });
        }
      }

      // Check for required dependencies
      const requiredDeps = ['@modelcontextprotocol/sdk'];
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      for (const dep of requiredDeps) {
        if (!allDeps[dep]) {
          issues.push({
            severity: 'error',
            file: 'package.json',
            message: `Missing required dependency: ${dep}`,
          });
        }
      }

      // Check for required scripts
      const requiredScripts = ['build'];
      for (const script of requiredScripts) {
        if (!pkg.scripts[script]) {
          issues.push({
            severity: 'warning',
            file: 'package.json',
            message: `Missing recommended script: ${script}`,
          });
        }
      }

      // Validate type field is set to "module"
      if (pkg.type !== 'module') {
        issues.push({
          severity: 'error',
          file: 'package.json',
          message: 'package.json must have "type": "module" for MCP servers',
        });
      }
    } catch (error) {
      issues.push({
        severity: 'error',
        file: 'package.json',
        message: `Failed to parse package.json: ${(error as Error).message}`,
      });
    }

    return issues;
  }

  /**
   * Checks for common security issues in generated code.
   */
  private async checkSecurityIssues(outputDir: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Find all TypeScript files
    const files = await this.findFiles(outputDir, '.ts');

    for (const file of files) {
      const content = await fs.promises.readFile(file, 'utf-8');
      const relativePath = path.relative(outputDir, file);

      // Check for dangerous patterns
      const dangerousPatterns = [
        { pattern: /eval\s*\(/g, message: 'Use of eval() is dangerous and should be avoided' },
        {
          pattern: /new\s+Function\s*\(/g,
          message: 'Use of Function() constructor is dangerous',
        },
        {
          pattern: /innerHTML\s*=/g,
          message: 'Direct innerHTML assignment can lead to XSS vulnerabilities',
        },
        {
          pattern: /\.exec\s*\(/g,
          message: 'Use of exec() should be carefully reviewed for command injection',
        },
        {
          pattern: /child_process/g,
          message: 'Use of child_process should be carefully reviewed for security',
        },
      ];

      for (const { pattern, message } of dangerousPatterns) {
        if (pattern.test(content)) {
          issues.push({
            severity: 'warning',
            file: relativePath,
            message: `Security concern: ${message}`,
          });
        }
      }

      // Check for hardcoded secrets (basic check)
      const secretPatterns = [
        { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/i, type: 'API key' },
        { pattern: /password\s*[:=]\s*['"][^'"]+['"]/i, type: 'password' },
        { pattern: /secret\s*[:=]\s*['"][^'"]{20,}['"]/i, type: 'secret' },
        { pattern: /token\s*[:=]\s*['"][^'"]{20,}['"]/i, type: 'token' },
      ];

      for (const { pattern, type } of secretPatterns) {
        if (pattern.test(content)) {
          issues.push({
            severity: 'error',
            file: relativePath,
            message: `Possible hardcoded ${type} detected - use environment variables instead`,
          });
        }
      }

      // Check for missing input validation
      if (content.includes('JSON.parse') && !content.includes('try')) {
        issues.push({
          severity: 'warning',
          file: relativePath,
          message: 'JSON.parse without try/catch - consider adding error handling',
        });
      }
    }

    return issues;
  }

  /**
   * Validates MCP protocol compliance.
   */
  private async validateMCPCompliance(outputDir: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const indexPath = path.join(outputDir, 'src', 'index.ts');

    if (!(await this.fileExists(indexPath))) {
      return issues;
    }

    try {
      const content = await fs.promises.readFile(indexPath, 'utf-8');

      // Check for required MCP imports
      if (!content.includes('@modelcontextprotocol/sdk')) {
        issues.push({
          severity: 'error',
          file: 'src/index.ts',
          message: 'Missing MCP SDK import from @modelcontextprotocol/sdk',
        });
      }

      // Check for Server import
      if (!content.includes('Server')) {
        issues.push({
          severity: 'error',
          file: 'src/index.ts',
          message: 'Missing Server import from MCP SDK',
        });
      }

      // Check for server initialization
      if (!content.includes('new Server(')) {
        issues.push({
          severity: 'error',
          file: 'src/index.ts',
          message: 'No MCP Server initialization found - must create Server instance',
        });
      }

      // Check for transport setup
      if (!content.includes('Transport') && !content.includes('connect')) {
        issues.push({
          severity: 'warning',
          file: 'src/index.ts',
          message: 'No transport configuration found - server may not be connectable',
        });
      }

      // Check for server info
      if (!content.includes('name:') && !content.includes('version:')) {
        issues.push({
          severity: 'warning',
          file: 'src/index.ts',
          message: 'Server info (name/version) not found - recommended for identification',
        });
      }

      // Check for at least one capability
      const hasTools = content.includes('setRequestHandler') || content.includes('tools');
      const hasResources =
        content.includes('resources') || content.includes('list_resources');
      const hasPrompts = content.includes('prompts') || content.includes('list_prompts');

      if (!hasTools && !hasResources && !hasPrompts) {
        issues.push({
          severity: 'error',
          file: 'src/index.ts',
          message:
            'No MCP capabilities detected - server must implement tools, resources, or prompts',
        });
      }
    } catch (error) {
      issues.push({
        severity: 'error',
        file: 'src/index.ts',
        message: `Failed to validate MCP compliance: ${(error as Error).message}`,
      });
    }

    return issues;
  }

  /**
   * Checks if a file exists.
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Recursively finds all files with a given extension.
   */
  private async findFiles(dir: string, ext: string): Promise<string[]> {
    const files: string[] = [];

    async function scan(currentDir: string): Promise<void> {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
          await scan(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(ext)) {
          files.push(fullPath);
        }
      }
    }

    await scan(dir);
    return files;
  }
}
