/**
 * MCP Tool: ispn.ticket.search
 *
 * Search tickets by date range or customer.
 */

import { z } from 'zod';
import { createISPNClient } from '../services/ispn-client.js';
import { logger } from '../utils/logger.js';

const inputSchema = z.object({
  begin: z.string().describe('Begin date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)'),
  end: z.string().optional().describe('End date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)'),
  hour: z.boolean().optional().describe('Use hourly increments from begin date (end not required)'),
});

export const ticketSearchTool = {
  definition: {
    name: 'ispn_ticket_search',
    description: 'Search tickets by date range across all customers. Returns tickets created between begin and end dates.',
    inputSchema: {
      type: 'object',
      properties: {
        begin: {
          type: 'string',
          description: 'Begin date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS) - inclusive'
        },
        end: {
          type: 'string',
          description: 'End date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS) - inclusive. Optional if hour=true'
        },
        hour: {
          type: 'boolean',
          description: 'Use hourly segments from begin date. If true, end date is optional. Default: false'
        }
      },
      required: ['begin']
    }
  },

  async handler(args: unknown) {
    try {
      const input = inputSchema.parse(args);
      const client = createISPNClient();

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}:\d{2})?$/;
      if (!dateRegex.test(input.begin)) {
        throw new Error('Invalid begin date format. Use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS');
      }

      if (input.end && !dateRegex.test(input.end)) {
        throw new Error('Invalid end date format. Use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS');
      }

      if (!input.end && !input.hour) {
        throw new Error('Must provide end date or set hour=true');
      }

      logger.info({ begin: input.begin, end: input.end, hour: input.hour }, 'Searching tickets by date');

      const tickets = await client.listTicketsByDateRange(
        input.begin,
        input.end || input.begin,
        input.hour
      );

      const result = {
        success: true,
        count: tickets.length,
        filters: {
          begin: input.begin,
          end: input.end || (input.hour ? 'hourly segment' : 'not provided'),
          hour: input.hour || false
        },
        tickets: tickets
      };

      logger.info({ count: tickets.length }, 'Tickets search completed');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'Ticket search failed');

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
