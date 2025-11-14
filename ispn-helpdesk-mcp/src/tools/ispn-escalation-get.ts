/**
 * MCP Tool: ispn.escalation.get
 *
 * Get specific escalation details by ID.
 */

import { z } from 'zod';
import { createISPNClient } from '../services/ispn-client.js';
import { logger } from '../utils/logger.js';

const inputSchema = z.object({
  escid: z.string().min(1).describe('Escalation ID'),
});

export const escalationGetTool = {
  definition: {
    name: 'ispn.escalation.get',
    description: 'Get detailed information about a specific escalation by escalation ID.',
    inputSchema: {
      type: 'object',
      properties: {
        escid: {
          type: 'string',
          description: 'Escalation ID (e.g., "12345")'
        }
      },
      required: ['escid']
    }
  },

  async handler(args: unknown) {
    try {
      const input = inputSchema.parse(args);
      const client = createISPNClient();

      logger.info({ escid: input.escid }, 'Getting escalation details');

      const escalation = await client.getEscalationById(input.escid);

      if (!escalation) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Escalation not found: ${input.escid}`
            }, null, 2)
          }],
          isError: true
        };
      }

      const result = {
        success: true,
        escalation: escalation
      };

      logger.info({ escid: input.escid }, 'Escalation details retrieved');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'Get escalation failed');

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
