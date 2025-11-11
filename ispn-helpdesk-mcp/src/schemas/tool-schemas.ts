/**
 * MCP Tool Validation Schemas
 *
 * Zod schemas for validating MCP tool inputs.
 * These define the contract for tools exposed to Claude Desktop.
 */

import { z } from 'zod';
import {
  phoneSchema,
  confidenceSchema,
  categorySchema,
  escalationReasonSchema,
  sourceSchema,
  oaKeySchema,
  noteSchema,
  ticketIdSchema
} from './common-schemas.js';

/**
 * helpdesk.create_ticket Tool Input Schema
 *
 * Creates a new helpdesk ticket directly (bypasses deduplication).
 */
export const createTicketInputSchema = z.object({
  description: z.string().min(10).max(1000),
  category: categorySchema,
  escalationReason: escalationReasonSchema,
  callerNumber: phoneSchema.optional(),
  source: sourceSchema.optional().default('Other' as any),
  metadata: z.record(z.any()).optional()
}).strict();

export type CreateTicketInput = z.infer<typeof createTicketInputSchema>;

/**
 * helpdesk.append_note Tool Input Schema
 *
 * Appends a note to an existing helpdesk ticket.
 */
export const appendNoteInputSchema = z.object({
  ticketId: ticketIdSchema,
  note: z.string().min(10).max(1000),
  author: z.string().optional().default('ISPN-Agent')
}).strict();

export type AppendNoteInput = z.infer<typeof appendNoteInputSchema>;

/**
 * helpdesk.find_or_create_ticket Tool Input Schema
 *
 * Finds existing ticket or creates new one (with deduplication logic).
 */
export const findOrCreateTicketInputSchema = z.object({
  description: z.string().min(10).max(1000),
  category: categorySchema,
  escalationReason: escalationReasonSchema,
  callerNumber: phoneSchema.optional(),
  oaKey: oaKeySchema.optional(),
  source: sourceSchema.optional().default('Other' as any)
}).strict();

export type FindOrCreateTicketInput = z.infer<typeof findOrCreateTicketInputSchema>;

/**
 * ingest.render_note Tool Input Schema
 *
 * Renders a 4-line formatted note from components.
 * Used by agents to format notes before handoff.
 */
export const renderNoteInputSchema = z.object({
  category: z.string(),
  escalationReason: z.string(),
  summary: z.string().min(10).max(250),
  confidence: confidenceSchema
}).strict();

export type RenderNoteInput = z.infer<typeof renderNoteInputSchema>;

/**
 * ingest.oa_handoff Tool Input Schema
 *
 * Complete agent handoff (same as HTTP endpoint but for MCP).
 * Finds or creates ticket and appends note.
 */
export const oaHandoffInputSchema = z.object({
  note: noteSchema,
  category: categorySchema.optional(),
  escalationReason: escalationReasonSchema.optional(),
  confidence: confidenceSchema.optional().default('0.0'),
  callerNumber: phoneSchema.optional(),
  oaKey: oaKeySchema.optional(),
  source: sourceSchema.optional().default('Other' as any)
}).strict();

export type OaHandoffInput = z.infer<typeof oaHandoffInputSchema>;

/**
 * Tool Output Schemas
 *
 * Define expected output structures for MCP tools.
 * These help Claude understand what to expect from tool calls.
 */

export const ticketOutputSchema = z.object({
  ticketId: z.string(),
  ticketUrl: z.string().url(),
  created: z.boolean()
});

export type TicketOutput = z.infer<typeof ticketOutputSchema>;

export const noteOutputSchema = z.object({
  success: z.boolean(),
  message: z.string()
});

export type NoteOutput = z.infer<typeof noteOutputSchema>;

export const renderedNoteOutputSchema = z.object({
  note: z.string(),
  lineCount: z.number(),
  charCount: z.number(),
  valid: z.boolean()
});

export type RenderedNoteOutput = z.infer<typeof renderedNoteOutputSchema>;
