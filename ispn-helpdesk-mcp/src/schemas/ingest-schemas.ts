/**
 * HTTP Endpoint Validation Schemas
 *
 * Zod schemas for validating HTTP request payloads to the ingest endpoints.
 * These schemas enforce the API contract and provide type-safe validation.
 */

import { z } from 'zod';
import {
  phoneSchema,
  confidenceSchema,
  categorySchema,
  escalationReasonSchema,
  sourceSchema,
  oaKeySchema,
  noteSchema
} from './common-schemas.js';

/**
 * IngestPayload Schema
 *
 * Validates the POST /ingest/oa-handoff request body.
 *
 * Required:
 * - note: 4-line formatted note (≤350 chars)
 *
 * Optional (with defaults):
 * - category: Auto-inferred if not provided
 * - escalationReason: Auto-inferred if not provided
 * - confidence: Defaults to "0.0" if not provided
 * - callerNumber: Phone number in E.164 format
 * - oaKey: For deduplication and ticket lookup
 * - source: Defaults to 'Other' if not provided
 */
export const ingestPayloadSchema = z.object({
  note: noteSchema,
  category: categorySchema.optional(),
  escalationReason: escalationReasonSchema.optional(),
  confidence: confidenceSchema.optional().default('0.0'),
  callerNumber: phoneSchema.optional(),
  oaKey: oaKeySchema.optional(),
  source: sourceSchema.optional().default('Other' as any)
}).strict(); // Reject unknown fields

/**
 * Type inference from schema
 *
 * Use this type in route handlers for type-safe request bodies.
 */
export type IngestPayloadInput = z.infer<typeof ingestPayloadSchema>;

/**
 * Partial Update Schema
 *
 * For PATCH operations (if needed in future).
 * All fields optional except note.
 */
export const partialIngestSchema = z.object({
  note: noteSchema.optional(),
  category: categorySchema.optional(),
  escalationReason: escalationReasonSchema.optional(),
  confidence: confidenceSchema.optional(),
  callerNumber: phoneSchema.optional(),
  oaKey: oaKeySchema.optional(),
  source: sourceSchema.optional()
}).strict();

export type PartialIngestInput = z.infer<typeof partialIngestSchema>;
