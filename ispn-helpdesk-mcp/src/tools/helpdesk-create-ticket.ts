/**
 * MCP Tool: helpdesk.create_ticket
 *
 * Creates a new helpdesk ticket directly (bypasses deduplication).
 * Useful for creating tickets when you know they should be new.
 *
 * Example usage:
 * {
 *   "description": "Customer experiencing WiFi connectivity issues",
 *   "category": "WiFi",
 *   "escalationReason": "TwoStepsNoResolve",
 *   "callerNumber": "+12345678900",
 *   "source": "ATOM"
 * }
 */

import { z } from 'zod';
import { helpdeskClient } from '../services/helpdesk-client.js';
import { createTicketInputSchema } from '../schemas/tool-schemas.js';
import { logger } from '../utils/logger.js';

export const createTicketTool = {
  definition: {
    name: 'helpdesk.create_ticket',
    description: 'Create a new helpdesk ticket (bypasses deduplication)',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Ticket description (10-1000 characters)'
        },
        category: {
          type: 'string',
          enum: ['Outage', 'WiFi', 'CGNAT', 'Wiring', 'EquipmentReturn', 'Unknown'],
          description: 'Ticket category'
        },
        escalationReason: {
          type: 'string',
          enum: ['CallerRequested', 'TwoStepsNoResolve', 'OutOfScope', 'SafetyRisk', 'BillingOrAccount', 'Other'],
          description: 'Reason for escalation to human support'
        },
        callerNumber: {
          type: 'string',
          description: 'E.164 phone number (optional)'
        },
        source: {
          type: 'string',
          enum: ['ATOM', 'OutageAgent', 'Other'],
          description: 'Source system (defaults to "Other")'
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata (optional)'
        }
      },
      required: ['description', 'category', 'escalationReason']
    }
  },

  async handler(args: unknown) {
    try {
      // Validate input
      const input = createTicketInputSchema.parse(args);

      logger.info({ category: input.category }, 'Creating helpdesk ticket');

      // Create ticket
      const result = await helpdeskClient.createTicket(input);

      logger.info({ ticketId: result.ticketId }, 'Ticket created successfully');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            ticketId: result.ticketId,
            ticketUrl: result.ticketUrl,
            category: input.category,
            escalationReason: input.escalationReason
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to create ticket');

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
