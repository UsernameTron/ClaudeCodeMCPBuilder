/**
 * MCP Tool: ingest.oa_handoff
 *
 * Complete Outage Agent (OA) handoff workflow.
 * Finds existing ticket or creates new one, then appends the formatted note.
 *
 * This is the primary tool for agent handoffs, combining:
 * 1. Deduplication logic (find existing ticket by oaKey or caller+category)
 * 2. Ticket creation (if no existing ticket found)
 * 3. Note appending (add formatted note to ticket)
 *
 * The note must be pre-formatted in the 4-line format:
 * Category: <category>
 * Reason: <escalationReason>
 * Summary: <summary>
 * Confidence: <confidence>
 *
 * Example usage:
 * {
 *   "note": "Category: WiFi\nReason: TwoStepsNoResolve\nSummary: Customer unable to connect\nConfidence: 0.85",
 *   "category": "WiFi",
 *   "escalationReason": "TwoStepsNoResolve",
 *   "confidence": "0.85",
 *   "callerNumber": "+12345678900",
 *   "oaKey": "oa-12345",
 *   "source": "OutageAgent"
 * }
 */

import { z } from 'zod';
import { findOrCreateTicket } from '../services/ticket-service.js';
import { oaHandoffInputSchema } from '../schemas/tool-schemas.js';
import { logger } from '../utils/logger.js';

export const oaHandoffTool = {
  definition: {
    name: 'ingest.oa_handoff',
    description: 'Complete OA handoff: render note and find/create ticket',
    inputSchema: {
      type: 'object',
      properties: {
        note: {
          type: 'string',
          description: '4-line formatted note (≤350 chars)'
        },
        category: {
          type: 'string',
          enum: ['Outage', 'WiFi', 'CGNAT', 'Wiring', 'EquipmentReturn', 'Unknown'],
          description: 'Ticket category (optional, auto-inferred if missing)'
        },
        escalationReason: {
          type: 'string',
          enum: ['CallerRequested', 'TwoStepsNoResolve', 'OutOfScope', 'SafetyRisk', 'BillingOrAccount', 'Other'],
          description: 'Escalation reason (optional, auto-inferred if missing)'
        },
        confidence: {
          type: 'string',
          description: 'Confidence score as string (0.0-1.0), defaults to "0.0"'
        },
        callerNumber: {
          type: 'string',
          description: 'E.164 phone number (optional, used for deduplication)'
        },
        oaKey: {
          type: 'string',
          description: 'Outage Agent key (optional, used for deduplication)'
        },
        source: {
          type: 'string',
          enum: ['ATOM', 'OutageAgent', 'Other'],
          description: 'Source system (defaults to "OutageAgent")'
        }
      },
      required: ['note']
    }
  },

  async handler(args: unknown) {
    try {
      // Validate input
      const input = oaHandoffInputSchema.parse(args);

      logger.info({
        oaKey: input.oaKey,
        source: input.source
      }, 'Processing OA handoff');

      // Find or create ticket
      const result = await findOrCreateTicket({
        description: input.note,
        category: input.category,
        escalationReason: input.escalationReason,
        callerNumber: input.callerNumber,
        oaKey: input.oaKey,
        source: input.source,
        metadata: {
          confidence: input.confidence,
          handoffAt: new Date().toISOString()
        }
      });

      logger.info({
        ticketId: result.ticketId,
        created: result.created
      }, 'OA handoff completed');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            created: result.created,
            ticketId: result.ticketId,
            ticketUrl: result.ticketUrl,
            category: input.category || 'Unknown',
            escalationReason: input.escalationReason || 'Other',
            confidence: input.confidence || '0.0',
            echo: {
              oaKey: input.oaKey,
              callerNumber: input.callerNumber
            }
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'OA handoff failed');

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
