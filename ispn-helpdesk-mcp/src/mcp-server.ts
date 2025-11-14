#!/usr/bin/env node

/**
 * MCP Server - ISPN Helpdesk Bridge
 *
 * Model Context Protocol server for Claude Desktop integration.
 * Provides read-only query access to ISPN Helpdesk API.
 *
 * Features:
 * - Stdio transport for Claude Desktop
 * - 10 read-only query tools
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

// Import ISPN read-only query tools
import { customerLookupTool } from './tools/ispn-customer-lookup.js';
import { customerDetailsTool } from './tools/ispn-customer-details.js';
import { customerTicketsTool } from './tools/ispn-customer-tickets.js';
import { ticketSearchTool } from './tools/ispn-ticket-search.js';
import { escalationListTool } from './tools/ispn-escalation-list.js';
import { escalationGetTool } from './tools/ispn-escalation-get.js';
import { dhcpListTool } from './tools/ispn-dhcp-list.js';
import { queryCategoryTool } from './tools/ispn-query-categories.js';
import { accountCheckTool } from './tools/ispn-account-check.js';

// Import ISPN analytics tools
import { ticketVolumeAnalyticsTool } from './tools/ispn-analytics-ticket-volume.js';
import { escalationMetricsAnalyticsTool } from './tools/ispn-analytics-escalation-metrics.js';
import { serviceHealthAnalyticsTool } from './tools/ispn-analytics-service-health.js';
import { timePatternsAnalyticsTool } from './tools/ispn-analytics-time-patterns.js';
import { customerPatternsAnalyticsTool } from './tools/ispn-analytics-customer-patterns.js';

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
  logger.info('Listing available ISPN query tools');

  return {
    tools: [
      // Customer query tools
      customerLookupTool.definition,
      customerDetailsTool.definition,
      customerTicketsTool.definition,

      // Ticket query tools
      ticketSearchTool.definition,
      escalationListTool.definition,
      escalationGetTool.definition,

      // Network query tools
      dhcpListTool.definition,

      // Verification & metadata tools
      queryCategoryTool.definition,
      accountCheckTool.definition,

      // Analytics tools
      ticketVolumeAnalyticsTool.definition,
      escalationMetricsAnalyticsTool.definition,
      serviceHealthAnalyticsTool.definition,
      timePatternsAnalyticsTool.definition,
      customerPatternsAnalyticsTool.definition,
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
      // Customer query tools
      case 'ispn_customer_lookup':
        return await customerLookupTool.handler(args);

      case 'ispn_customer_get_details':
        return await customerDetailsTool.handler(args);

      case 'ispn_customer_list_tickets':
        return await customerTicketsTool.handler(args);

      // Ticket query tools
      case 'ispn_ticket_search':
        return await ticketSearchTool.handler(args);

      case 'ispn_escalation_list':
        return await escalationListTool.handler(args);

      case 'ispn_escalation_get':
        return await escalationGetTool.handler(args);

      // Network query tools
      case 'ispn_dhcp_list':
        return await dhcpListTool.handler(args);

      // Verification & metadata tools
      case 'ispn_query_list_categories':
        return await queryCategoryTool.handler(args);

      case 'ispn_account_check':
        return await accountCheckTool.handler(args);

      // Analytics tools
      case 'ispn_analytics_ticket_volume':
        return await ticketVolumeAnalyticsTool.handler(args);

      case 'ispn_analytics_escalation_metrics':
        return await escalationMetricsAnalyticsTool.handler(args);

      case 'ispn_analytics_service_health':
        return await serviceHealthAnalyticsTool.handler(args);

      case 'ispn_analytics_time_patterns':
        return await timePatternsAnalyticsTool.handler(args);

      case 'ispn_analytics_customer_patterns':
        return await customerPatternsAnalyticsTool.handler(args);

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
