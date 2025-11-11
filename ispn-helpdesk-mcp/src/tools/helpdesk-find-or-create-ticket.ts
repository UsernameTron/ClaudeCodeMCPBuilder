/**
 * MCP Tool: helpdesk.find_or_create_ticket
 *
 * Finds an existing ticket by oaKey or callerNumber+category, or creates a new one.
 * Implements deduplication logic to prevent duplicate tickets for the same issue.
 *
 * Deduplication strategy:
 * 1. If oaKey provided: Look for ticket with matching oaKey
 * 2. If callerNumber+category provided: Look for recent ticket from same caller/category
 * 3. If no match found: Create new ticket
 *
 * Example usage:
 * {
 *   "description": "Customer experiencing WiFi connectivity issues",
 *   "category": "WiFi",
 *   "escalationReason": "TwoStepsNoResolve",
 *   "callerNumber": "+12345678900",
 *   "oaKey": "oa-12345"
 * }
 */

import { z } from 'zod';
import { findOrCreateTicket } from '../services/ticket-service.js';
import { findOrCreateTicketInputSchema } from '../schemas/tool-schemas.js';
import { logger } from '../utils/logger.js';

export const findOrCreateTicketTool = {
  definition: {
    name: 'helpdesk.find_or_create_ticket',
    description: 'Find existing ticket by oaKey/caller or create new ticket (with deduplication)',
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
          description: 'Reason for escalation'
        },
        callerNumber: {
          type: 'string',
          description: 'E.164 phone number (optional, used for deduplication)'
        },
        oaKey: {
          type: 'string',
          description: 'Outage Agent key for deduplication (optional)'
        },
        source: {
          type: 'string',
          enum: ['ATOM', 'OutageAgent', 'Other'],
          description: 'Source system (defaults to "Other")'
        }
      },
      required: ['description', 'category', 'escalationReason']
    }
  },

  async handler(args: unknown) {
    try {
      // Validate input
      const input = findOrCreateTicketInputSchema.parse(args);

      logger.info({
        oaKey: input.oaKey,
        callerNumber: input.callerNumber
      }, 'Finding or creating ticket');

      // Find or create ticket
      const result = await findOrCreateTicket(input);

      logger.info({
        ticketId: result.ticketId,
        created: result.created
      }, 'Ticket found or created');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            created: result.created,
            ticketId: result.ticketId,
            ticketUrl: result.ticketUrl,
            message: result.created
              ? 'New ticket created'
              : 'Existing ticket found (deduplication)'
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to find or create ticket');

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
