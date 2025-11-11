/**
 * MCP Tool: helpdesk.append_note
 *
 * Appends a note to an existing helpdesk ticket.
 * Used to add follow-up information or additional context.
 *
 * Example usage:
 * {
 *   "ticketId": "TKT-12345",
 *   "note": "Customer confirmed WiFi is working after router reset",
 *   "author": "ISPN-Agent"
 * }
 */

import { z } from 'zod';
import { helpdeskClient } from '../services/helpdesk-client.js';
import { appendNoteInputSchema } from '../schemas/tool-schemas.js';
import { logger } from '../utils/logger.js';

export const appendNoteTool = {
  definition: {
    name: 'helpdesk.append_note',
    description: 'Append a note to an existing helpdesk ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'Ticket ID to append note to'
        },
        note: {
          type: 'string',
          description: 'Note content (10-1000 characters)'
        },
        author: {
          type: 'string',
          description: 'Note author (optional, defaults to "ISPN-Agent")'
        }
      },
      required: ['ticketId', 'note']
    }
  },

  async handler(args: unknown) {
    try {
      // Validate input
      const input = appendNoteInputSchema.parse(args);

      logger.info({ ticketId: input.ticketId }, 'Appending note to ticket');

      // Append note
      const result = await helpdeskClient.appendNote(input);

      logger.info({ ticketId: input.ticketId }, 'Note appended successfully');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            message: result.message,
            ticketId: input.ticketId
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to append note');

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
