/**
 * Database Server Example
 *
 * Demonstrates a mixed MCP server using all three primitives.
 * This example shows:
 * - Tools for database operations (queries, inserts, updates)
 * - Resources for schema and table data
 * - Prompts for generating SQL queries
 * - Integration of all three capabilities
 */

import type { ServerConfig } from '../generator/types.js';

export const databaseServerConfig: ServerConfig = {
  name: 'database-server',
  description: 'MCP server providing database access with tools, resources, and prompts',
  type: 'mixed',
  outputDir: './generated-servers',
  skipInstall: false,

  capabilities: {
    tools: true,
    resources: true,
    prompts: true
  },

  features: {
    listChanged: true,     // Schema can change
    subscribe: true,       // Watch for data changes
    structuredOutputs: true
  },

  includeExamples: true,
  includeTests: true,

  security: {
    validateInputs: true,
    sanitizePaths: false,
    rateLimit: true
  }
};

/**
 * Example tool definitions for database operations
 */
export const databaseTools = [
  {
    name: 'execute_query',
    title: 'Execute SQL Query',
    description: 'Execute a SELECT query and return results',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL SELECT query to execute'
        },
        parameters: {
          type: 'array',
          items: { type: 'string' },
          description: 'Parameterized query values (uses ? placeholders)',
          default: []
        },
        limit: {
          type: 'number',
          minimum: 1,
          maximum: 1000,
          description: 'Maximum number of rows to return',
          default: 100
        }
      },
      required: ['query']
    },
    outputSchema: {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: { type: 'object' }
        },
        rowCount: { type: 'number' },
        executionTime: { type: 'number' }
      }
    },
    annotations: {
      title: 'Execute Query',
      readOnlyHint: true,
      openWorldHint: false
    }
  },
  {
    name: 'insert_data',
    title: 'Insert Data',
    description: 'Insert new records into a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name'
        },
        data: {
          type: 'object',
          description: 'Column-value pairs to insert'
        }
      },
      required: ['table', 'data']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false
    }
  },
  {
    name: 'update_data',
    title: 'Update Data',
    description: 'Update existing records in a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name'
        },
        data: {
          type: 'object',
          description: 'Column-value pairs to update'
        },
        where: {
          type: 'object',
          description: 'WHERE clause conditions'
        }
      },
      required: ['table', 'data', 'where']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true
    }
  }
];

/**
 * Example resource definitions for database schema
 */
export const databaseResources = [
  {
    uri: 'db://schema',
    name: 'Database Schema',
    title: 'Full Schema',
    description: 'Complete database schema with all tables and columns',
    mimeType: 'application/json'
  },
  {
    uri: 'db://tables',
    name: 'Tables List',
    title: 'Available Tables',
    description: 'List of all tables in the database',
    mimeType: 'application/json'
  },
  {
    uri: 'db://table/{tableName}',
    name: 'Table Schema',
    title: 'Table Definition',
    description: 'Schema for a specific table including columns, types, and constraints',
    mimeType: 'application/json'
  },
  {
    uri: 'db://table/{tableName}/data',
    name: 'Table Data',
    title: 'Table Contents',
    description: 'Sample data from a table (limited to 100 rows)',
    mimeType: 'application/json'
  }
];

/**
 * Example prompt definitions for SQL generation
 */
export const databasePrompts = [
  {
    name: 'generate-sql',
    title: 'Generate SQL Query',
    description: 'Generate a SQL query based on natural language description',
    arguments: [
      {
        name: 'description',
        description: 'Natural language description of what data you need',
        required: true
      },
      {
        name: 'tables',
        description: 'Specific tables to query (optional)',
        required: false
      }
    ]
  },
  {
    name: 'explain-query',
    title: 'Explain SQL Query',
    description: 'Get a detailed explanation of what a SQL query does',
    arguments: [
      {
        name: 'query',
        description: 'The SQL query to explain',
        required: true
      }
    ]
  },
  {
    name: 'optimize-query',
    title: 'Optimize SQL Query',
    description: 'Get suggestions for optimizing a SQL query',
    arguments: [
      {
        name: 'query',
        description: 'The SQL query to optimize',
        required: true
      },
      {
        name: 'performance_issues',
        description: 'Known performance problems with the query',
        required: false
      }
    ]
  }
];

/**
 * Usage instructions for database server
 */
export const databaseServerReadme = `
## Database Server

This server provides comprehensive database access through MCP's three primitives: tools, resources, and prompts.

### Prerequisites

1. Database connection string in environment variable:
   \`\`\`bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
   # or
   export DATABASE_URL="sqlite:///path/to/database.db"
   \`\`\`

2. Supported databases:
   - PostgreSQL
   - MySQL
   - SQLite
   - Microsoft SQL Server

### Tools

#### execute_query
Execute SELECT queries safely with parameterized inputs.

**Example:**
\`\`\`json
{
  "name": "execute_query",
  "arguments": {
    "query": "SELECT * FROM users WHERE status = ? AND created_at > ?",
    "parameters": ["active", "2024-01-01"],
    "limit": 50
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "rows": [
    {"id": 1, "name": "Alice", "status": "active", "created_at": "2024-01-15"},
    {"id": 2, "name": "Bob", "status": "active", "created_at": "2024-02-20"}
  ],
  "rowCount": 2,
  "executionTime": 45.2
}
\`\`\`

#### insert_data
Insert new records with automatic validation.

**Example:**
\`\`\`json
{
  "name": "insert_data",
  "arguments": {
    "table": "users",
    "data": {
      "name": "Charlie",
      "email": "charlie@example.com",
      "status": "active"
    }
  }
}
\`\`\`

#### update_data
Update existing records with WHERE conditions.

**Example:**
\`\`\`json
{
  "name": "update_data",
  "arguments": {
    "table": "users",
    "data": {
      "status": "inactive"
    },
    "where": {
      "id": 1
    }
  }
}
\`\`\`

### Resources

#### db://schema
Get the complete database schema.

**Response:**
\`\`\`json
{
  "tables": {
    "users": {
      "columns": {
        "id": {"type": "INTEGER", "primaryKey": true},
        "name": {"type": "TEXT", "nullable": false},
        "email": {"type": "TEXT", "unique": true},
        "status": {"type": "TEXT", "default": "active"}
      },
      "indexes": ["idx_users_email", "idx_users_status"]
    }
  }
}
\`\`\`

#### db://tables
List all available tables.

**Response:**
\`\`\`json
{
  "tables": ["users", "orders", "products", "categories"]
}
\`\`\`

#### db://table/{tableName}
Get schema for a specific table.

**Example:** \`db://table/users\`

#### db://table/{tableName}/data
Get sample data from a table.

**Example:** \`db://table/users/data\`

### Prompts

#### generate-sql
Generate SQL queries from natural language.

**Example:**
\`\`\`json
{
  "name": "generate-sql",
  "arguments": {
    "description": "Find all active users who made a purchase in the last 30 days",
    "tables": "users, orders"
  }
}
\`\`\`

**Generated Prompt:**
\`\`\`
Based on the database schema, generate a SQL query to: Find all active users who made a purchase in the last 30 days

Available tables: users, orders

Database Schema:
[schema details included in prompt]

Please generate:
1. The SQL query
2. Explanation of what the query does
3. Any assumptions made
\`\`\`

#### explain-query
Get detailed explanations of SQL queries.

**Example:**
\`\`\`json
{
  "name": "explain-query",
  "arguments": {
    "query": "SELECT u.name, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id HAVING COUNT(o.id) > 5"
  }
}
\`\`\`

#### optimize-query
Get optimization suggestions.

**Example:**
\`\`\`json
{
  "name": "optimize-query",
  "arguments": {
    "query": "SELECT * FROM users WHERE email LIKE '%@example.com'",
    "performance_issues": "Query takes 5+ seconds on large table"
  }
}
\`\`\`

### Security Features

1. **Parameterized Queries**: All queries use parameter binding to prevent SQL injection
2. **Query Validation**: Malicious patterns are detected and blocked
3. **Read-Only Mode**: Optional mode that only allows SELECT queries
4. **Rate Limiting**: Prevents abuse with configurable limits
5. **Query Timeouts**: Long-running queries are automatically cancelled

### Subscriptions

Subscribe to table changes:

\`\`\`json
{
  "method": "resources/subscribe",
  "params": {
    "uri": "db://table/users/data"
  }
}
\`\`\`

Receive notifications when data changes:

\`\`\`json
{
  "method": "notifications/resources/updated",
  "params": {
    "uri": "db://table/users/data"
  }
}
\`\`\`

### Configuration

\`\`\`json
{
  "mcpServers": {
    "database-server": {
      "command": "node",
      "args": ["/path/to/database-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://localhost/mydb",
        "DB_READ_ONLY": "false",
        "DB_QUERY_TIMEOUT": "30000",
        "DB_MAX_ROWS": "1000"
      }
    }
  }
}
\`\`\`

### Error Handling

**Invalid SQL:**
\`\`\`json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "Error: Invalid SQL syntax near 'SLECT'. Did you mean 'SELECT'?"
  }]
}
\`\`\`

**Connection Error:**
\`\`\`json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "Error: Unable to connect to database. Please check DATABASE_URL environment variable and ensure the database is running."
  }]
}
\`\`\`

**Permission Denied:**
\`\`\`json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "Error: Server is in read-only mode. UPDATE, INSERT, and DELETE operations are not allowed."
  }]
}
\`\`\`

### Best Practices

1. **Always use parameterized queries** for user input
2. **Set appropriate LIMIT values** to avoid overwhelming responses
3. **Use prompts for complex queries** to leverage LLM understanding
4. **Monitor subscriptions** to track real-time changes
5. **Configure timeouts** based on your database performance
`;
