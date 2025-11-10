/**
 * Example Server Configurations
 *
 * This module provides pre-configured examples demonstrating different
 * MCP server patterns and use cases.
 */

export { weatherServerConfig } from './weather-server.js';
export { filesystemServerConfig } from './filesystem-server.js';
export { databaseServerConfig } from './database-server.js';

import type { ServerConfig } from '../generator/types.js';
import { weatherServerConfig } from './weather-server.js';
import { filesystemServerConfig } from './filesystem-server.js';
import { databaseServerConfig } from './database-server.js';

/**
 * All available example configurations
 */
export const examples: Record<string, ServerConfig> = {
  weather: weatherServerConfig,
  filesystem: filesystemServerConfig,
  database: databaseServerConfig
};

/**
 * Get example configuration by name
 */
export function getExample(name: string): ServerConfig | undefined {
  return examples[name];
}

/**
 * List all available examples
 */
export function listExamples(): Array<{ name: string; description: string; type: string }> {
  return [
    {
      name: 'weather',
      description: 'Tools-focused server for weather data and forecasts',
      type: 'tools'
    },
    {
      name: 'filesystem',
      description: 'Resources-focused server for secure file system access',
      type: 'resources'
    },
    {
      name: 'database',
      description: 'Mixed server demonstrating tools, resources, and prompts together',
      type: 'mixed'
    }
  ];
}

/**
 * Example descriptions for CLI display
 */
export const exampleDescriptions = {
  weather: `
Weather Server Example
----------------------
Demonstrates a tools-focused MCP server that:
- Integrates with external APIs (OpenWeatherMap)
- Implements rate limiting for API calls
- Provides structured output schemas
- Handles errors gracefully with actionable messages

Tools provided:
- get_current_weather: Real-time weather conditions
- get_forecast: Multi-day weather forecasts
`,
  filesystem: `
Filesystem Server Example
-------------------------
Demonstrates a resources-focused MCP server that:
- Implements strict security with path sanitization
- Respects root boundaries for file access
- Provides resource subscriptions for file watching
- Handles pagination for large directories

Resources provided:
- file:///{path}: Read file contents
- dir:///{path}: List directory contents
- file:///{path}/metadata: Get file information
`,
  database: `
Database Server Example
-----------------------
Demonstrates a mixed MCP server using all three primitives:
- Tools for database operations (queries, inserts, updates)
- Resources for schema inspection and table data
- Prompts for SQL generation and query optimization

Capabilities:
- Tools: execute_query, insert_data, update_data
- Resources: db://schema, db://tables, db://table/{name}
- Prompts: generate-sql, explain-query, optimize-query
`
};
