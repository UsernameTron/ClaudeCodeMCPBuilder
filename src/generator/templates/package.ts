import type { ServerConfig } from '../types.js';

export function generatePackageJson(config: ServerConfig) {
  return {
    name: config.name,
    version: '1.0.0',
    description: config.description,
    type: 'module',
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      watch: 'tsc --watch',
      start: 'node dist/index.js',
      dev: 'tsc --watch & node --watch dist/index.js',
      test: config.includeTests ? 'node --test' : 'echo "No tests configured"',
      lint: 'eslint src/**/*.ts'
    },
    keywords: ['mcp', 'model-context-protocol', 'claude', 'anthropic'],
    author: '',
    license: 'MIT',
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0'
    },
    devDependencies: {
      '@types/node': '^20.11.0',
      '@typescript-eslint/eslint-plugin': '^7.0.0',
      '@typescript-eslint/parser': '^7.0.0',
      'eslint': '^8.56.0',
      'typescript': '^5.3.0'
    },
    engines: {
      node: '>=18.0.0'
    }
  };
}
