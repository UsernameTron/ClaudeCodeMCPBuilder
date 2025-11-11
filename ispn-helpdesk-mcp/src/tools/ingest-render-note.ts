/**
 * MCP Tool: ingest.render_note
 *
 * Renders a 4-line formatted note from category, escalation reason, summary, and confidence.
 * Used by agents to format notes before submitting via oa_handoff.
 *
 * Output format:
 * Category: <category>
 * Reason: <escalationReason>
 * Summary: <summary>
 * Confidence: <confidence>
 *
 * Validates:
 * - Note length ≤350 characters
 * - Summary length ≤250 characters
 * - Confidence format (0.0-1.0)
 *
 * Example usage:
 * {
 *   "category": "WiFi",
 *   "escalationReason": "TwoStepsNoResolve",
 *   "summary": "Customer unable to connect to WiFi after router reset",
 *   "confidence": "0.85"
 * }
 */

import { z } from 'zod';
import { renderNote } from '../services/note-processor.js';
import { renderNoteInputSchema } from '../schemas/tool-schemas.js';
import { logger } from '../utils/logger.js';

export const renderNoteTool = {
  definition: {
    name: 'ingest.render_note',
    description: 'Render a 4-line formatted note from components',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category value (e.g., "WiFi", "Outage")'
        },
        escalationReason: {
          type: 'string',
          description: 'Escalation reason value (e.g., "CallerRequested")'
        },
        summary: {
          type: 'string',
          description: 'Summary text (10-250 characters)'
        },
        confidence: {
          type: 'string',
          description: 'Confidence score as string (0.0-1.0)'
        }
      },
      required: ['category', 'escalationReason', 'summary', 'confidence']
    }
  },

  async handler(args: unknown) {
    try {
      // Validate input
      const input = renderNoteInputSchema.parse(args);

      logger.info('Rendering note');

      // Render note
      const note = renderNote(input);

      logger.info('Note rendered successfully');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            note,
            charCount: note.length,
            lineCount: note.split('\n').length
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to render note');

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
