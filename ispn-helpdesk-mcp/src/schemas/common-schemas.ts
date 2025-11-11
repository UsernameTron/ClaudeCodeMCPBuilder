/**
 * Common Zod Validation Schemas
 *
 * Shared validators used across HTTP endpoints and MCP tools.
 * These provide runtime validation with TypeScript type inference.
 */

import { z } from 'zod';
import { Category, EscalationReason, Source } from '../types/index.js';

/**
 * Phone Number Validator (E.164 format)
 *
 * Validates international phone numbers in E.164 format.
 * Uses libphonenumber-js for robust validation.
 *
 * Examples:
 * - Valid: "+12345678900", "+442071234567"
 * - Invalid: "123-456-7890", "555-1234"
 */
export const phoneSchema = z.string().refine(
  (val) => {
    // E.164 format: + followed by 1-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(val);
  },
  { message: 'Must be valid E.164 phone number (e.g., +12345678900)' }
);

/**
 * Confidence Validator (0.0 to 1.0 as string)
 *
 * AI confidence scores are passed as strings to avoid
 * floating-point precision issues.
 *
 * Examples:
 * - Valid: "0.0", "0.5", "0.95", "1.0"
 * - Invalid: "1.5", "-0.1", "abc"
 */
export const confidenceSchema = z.string().refine(
  (val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 1;
  },
  { message: 'Confidence must be string "0.0" to "1.0"' }
);

/**
 * Category Enum Validator
 *
 * Validates that category matches one of the defined enum values.
 */
export const categorySchema = z.nativeEnum(Category);

/**
 * Escalation Reason Enum Validator
 *
 * Validates that escalation reason matches one of the defined enum values.
 */
export const escalationReasonSchema = z.nativeEnum(EscalationReason);

/**
 * Source Enum Validator
 *
 * Validates that source matches one of the defined enum values.
 */
export const sourceSchema = z.nativeEnum(Source);

/**
 * OA Key Validator
 *
 * Outage Agent keys are alphanumeric strings used for deduplication.
 * Format: 6-64 characters, alphanumeric plus hyphens/underscores.
 *
 * Examples:
 * - Valid: "OA-12345", "outage_abc123", "incident-2024-001"
 * - Invalid: "ab", "a".repeat(100), "test@key"
 */
export const oaKeySchema = z.string()
  .min(6, 'OA key must be at least 6 characters')
  .max(64, 'OA key must be at most 64 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'OA key must be alphanumeric with hyphens/underscores only');

/**
 * Note Validator (4 lines, ≤350 chars)
 *
 * Notes must be exactly 4 lines with specific format:
 * Line 1: Category (e.g., "Category: WiFi")
 * Line 2: Reason (e.g., "Reason: CallerRequested")
 * Line 3: Summary (e.g., "Summary: Customer reports...")
 * Line 4: Confidence (e.g., "Confidence: 0.85")
 *
 * Total length cannot exceed 350 characters.
 */
export const noteSchema = z.string()
  .min(10, 'Note too short')
  .max(350, 'Note exceeds 350 characters')
  .refine(
    (val) => {
      const lines = val.split('\n');
      return lines.length === 4;
    },
    { message: 'Note must be exactly 4 lines' }
  )
  .refine(
    (val) => {
      const lines = val.split('\n');
      // Each line should have content (not just whitespace)
      return lines.every(line => line.trim().length > 0);
    },
    { message: 'Each line must contain content' }
  );

/**
 * Ticket ID Validator
 *
 * Helpdesk ticket IDs (format depends on your helpdesk system).
 * Placeholder pattern: alphanumeric with hyphens, 3-32 chars.
 *
 * Update this based on your actual helpdesk ticket ID format.
 */
export const ticketIdSchema = z.string()
  .min(3, 'Ticket ID too short')
  .max(32, 'Ticket ID too long')
  .regex(/^[a-zA-Z0-9-]+$/, 'Ticket ID must be alphanumeric with hyphens');

/**
 * Idempotency Key Validator
 *
 * Client-provided idempotency keys for duplicate detection.
 * Should be UUIDs or similar unique identifiers.
 *
 * Examples:
 * - Valid: "550e8400-e29b-41d4-a716-446655440000", "req-12345-abc"
 * - Invalid: "ab", empty string
 */
export const idempotencyKeySchema = z.string()
  .min(8, 'Idempotency key too short')
  .max(128, 'Idempotency key too long');
