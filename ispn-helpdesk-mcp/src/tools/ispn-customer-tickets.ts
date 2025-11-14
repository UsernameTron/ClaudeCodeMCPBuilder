/**
 * MCP Tool: ispn.customer.list_tickets
 *
 * List all tickets associated with a customer.
 */

import { z } from 'zod';
import { createISPNClient } from '../services/ispn-client.js';
import { logger } from '../utils/logger.js';

const inputSchema = z.object({
  billid: z.string().min(1).describe('Internal Billing ID'),
  limit: z.number().int().positive().optional().describe('Maximum number of tickets to return'),
  ticketid: z.string().optional().describe('Specific ticket ID to retrieve'),
});

export const customerTicketsTool = {
  definition: {
    name: 'ispn.customer.list_tickets',
    description: 'List all tickets associated with a customer. Returns ticket history from ISPN Helpdesk.',
    inputSchema: {
      type: 'object',
      properties: {
        billid: {
          type: 'string',
          description: 'Internal Billing ID (e.g., "999")'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of tickets to return (optional)'
        },
        ticketid: {
          type: 'string',
          description: 'Filter to specific ticket ID (optional)'
        }
      },
      required: ['billid']
    }
  },

  async handler(args: unknown) {
    try {
      const input = inputSchema.parse(args);
      const client = createISPNClient();

      logger.info({ billid: input.billid, limit: input.limit }, 'Listing customer tickets');

      const tickets = await client.listTicketsByCustomer(
        input.billid,
        input.limit,
        input.ticketid
      );

      const result = {
        success: true,
        billid: input.billid,
        count: tickets.length,
        tickets: tickets,
        filters: {
          limit: input.limit || 'none',
          ticketid: input.ticketid || 'none'
        }
      };

      logger.info({ billid: input.billid, count: tickets.length }, 'Customer tickets retrieved');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'List customer tickets failed');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};
