/**
 * MCP Tool: ispn.escalation.list
 *
 * List escalations by date range and status.
 */

import { z } from 'zod';
import { createISPNClient } from '../services/ispn-client.js';
import { logger } from '../utils/logger.js';

const inputSchema = z.object({
  begin: z.string().describe('Begin date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)'),
  end: z.string().optional().describe('End date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)'),
  status: z.enum(['0', '1']).describe('Escalation status: "0" = closed, "1" = open'),
  hour: z.boolean().optional().describe('Use hourly increments from begin date (end not required)'),
});

export const escalationListTool = {
  definition: {
    name: 'ispn_escalation_list',
    description: 'List escalations by date range and status. Returns open or closed escalations between begin and end dates.',
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
        status: {
          type: 'string',
          enum: ['0', '1'],
          description: 'Escalation status: "0" = closed, "1" = open'
        },
        hour: {
          type: 'boolean',
          description: 'Use hourly segments from begin date. If true, end date is optional. Default: false'
        }
      },
      required: ['begin', 'status']
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

      logger.info({ begin: input.begin, end: input.end, status: input.status }, 'Listing escalations');

      const escalations = await client.listEscalationsByDateRange(
        input.begin,
        input.end || input.begin,
        input.status,
        input.hour
      );

      const result = {
        success: true,
        count: escalations.length,
        filters: {
          begin: input.begin,
          end: input.end || (input.hour ? 'hourly segment' : 'not provided'),
          status: input.status === '1' ? 'open' : 'closed',
          hour: input.hour || false
        },
        escalations: escalations
      };

      logger.info({ count: escalations.length, status: input.status }, 'Escalations listed');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'List escalations failed');

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
