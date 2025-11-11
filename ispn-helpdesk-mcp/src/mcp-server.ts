#!/usr/bin/env node

/**
 * MCP Server - ISPN Helpdesk Bridge
 *
 * Model Context Protocol server for Claude Desktop integration.
 * Separate process from HTTP server (runs independently).
 *
 * Features:
 * - Stdio transport for Claude Desktop
 * - 5 MCP tools registered
 * - Request logging
 * - Error handling
 * - Graceful shutdown
 *
 * Usage:
 *   node dist/mcp-server.js
 *   # Or via Claude Desktop config
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from './utils/logger.js';

// Import tool handlers
import { createTicketTool } from './tools/helpdesk-create-ticket.js';
import { appendNoteTool } from './tools/helpdesk-append-note.js';
import { findOrCreateTicketTool } from './tools/helpdesk-find-or-create-ticket.js';
import { renderNoteTool } from './tools/ingest-render-note.js';
import { oaHandoffTool } from './tools/ingest-oa-handoff.js';

/**
 * MCP Server Instance
 *
 * Configured with:
 * - Server name: ispn-helpdesk-bridge
 * - Version: 1.0.0
 * - Capabilities: tools
 */
const server = new Server(
  {
    name: 'ispn-helpdesk-bridge',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Tools List Handler
 *
 * Returns all available MCP tools.
 * Called by Claude Desktop to discover tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.info('Listing available tools');

  return {
    tools: [
      createTicketTool.definition,
      appendNoteTool.definition,
      findOrCreateTicketTool.definition,
      renderNoteTool.definition,
      oaHandoffTool.definition,
    ],
  };
});

/**
 * Tools Call Handler
 *
 * Executes the requested tool with provided arguments.
 * Routes to appropriate tool handler based on tool name.
 *
 * Returns:
 * - Success: Tool result wrapped in MCP response format
 * - Error: Throws error with message (caught by MCP SDK)
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  logger.info({ tool: name }, 'MCP tool called');

  try {
    switch (name) {
      case 'helpdesk.create_ticket':
        return await createTicketTool.handler(args);

      case 'helpdesk.append_note':
        return await appendNoteTool.handler(args);

      case 'helpdesk.find_or_create_ticket':
        return await findOrCreateTicketTool.handler(args);

      case 'ingest.render_note':
        return await renderNoteTool.handler(args);

      case 'ingest.oa_handoff':
        return await oaHandoffTool.handler(args);

      default:
        const error = new Error(`Unknown tool: ${name}`);
        logger.error({ tool: name }, 'Unknown tool requested');
        throw error;
    }
  } catch (error: any) {
    logger.error({ error: error.message, tool: name }, 'Tool execution failed');
    throw error;
  }
});

/**
 * Main Entry Point
 *
 * 1. Create stdio transport
 * 2. Connect MCP server to transport
 * 3. Log success
 * 4. Wait for requests from Claude Desktop
 */
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('MCP server started on stdio');

    // Note: Server will run until process is terminated
    // Claude Desktop will manage the lifecycle
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to start MCP server');
    process.exit(1);
  }
}

/**
 * Graceful Shutdown Handler
 *
 * Handles SIGTERM and SIGINT signals:
 * 1. Log shutdown message
 * 2. Close MCP server connection
 * 3. Exit cleanly
 */
const shutdown = async () => {
  logger.info('Shutdown signal received, closing MCP server');
  try {
    await server.close();
    logger.info('MCP server closed');
    process.exit(0);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
main();
