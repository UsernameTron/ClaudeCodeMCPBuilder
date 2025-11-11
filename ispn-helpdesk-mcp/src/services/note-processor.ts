/**
 * Note Processor - Format, Sanitize, and Infer Note Properties
 *
 * Handles all note-related operations:
 * 1. renderNote() - Build 4-line formatted note from components
 * 2. sanitizeNote() - Enforce length/format constraints
 * 3. inferCategory() - Extract category from note content
 * 4. inferEscalationReason() - Extract escalation reason from note
 */

import { Category, EscalationReason } from '../types/index.js';
import { validateNote, sanitizeString } from '../utils/validators.js';
import { ValidationError } from '../errors/custom-errors.js';

/**
 * Render Note - Build 4-Line Formatted Note
 *
 * Creates properly formatted note from individual components.
 *
 * Format:
 * ```
 * Category: {category}
 * Reason: {escalationReason}
 * Summary: {summary}
 * Confidence: {confidence}
 * ```
 *
 * @returns Formatted 4-line note string
 * @throws ValidationError if result exceeds 350 chars
 */
export function renderNote(params: {
  category: string;
  escalationReason: string;
  summary: string;
  confidence: string;
}): string {
  const lines = [
    `Category: ${params.category}`,
    `Reason: ${params.escalationReason}`,
    `Summary: ${params.summary}`,
    `Confidence: ${params.confidence}`
  ];

  const note = lines.join('\n');

  // Validate the rendered note
  const validation = validateNote(note);
  if (!validation.valid) {
    throw new ValidationError(
      `Rendered note failed validation: ${validation.error}`,
      {
        charCount: validation.charCount,
        lineCount: validation.lineCount,
        lines: validation.lines
      }
    );
  }

  return note;
}

/**
 * Sanitize Note - Enforce Length and Format Constraints
 *
 * Ensures note meets requirements:
 * - ≤ 350 characters total
 * - Exactly 4 lines
 * - Safe characters only
 *
 * @param note - Raw note to sanitize
 * @param truncate - If true, truncate to fit; if false, throw error
 * @returns Sanitized note
 * @throws ValidationError if invalid and truncate=false
 */
export function sanitizeNote(note: string, truncate: boolean = false): string {
  // Sanitize each character
  let sanitized = sanitizeString(note, 350);

  // Ensure exactly 4 lines
  const lines = sanitized.split('\n');

  if (lines.length < 4) {
    throw new ValidationError(
      `Note has only ${lines.length} lines, need exactly 4`,
      { lineCount: lines.length }
    );
  }

  if (lines.length > 4) {
    if (truncate) {
      // Keep first 4 lines
      sanitized = lines.slice(0, 4).join('\n');
    } else {
      throw new ValidationError(
        `Note has ${lines.length} lines, need exactly 4`,
        { lineCount: lines.length }
      );
    }
  }

  // Check total length
  if (sanitized.length > 350) {
    if (truncate) {
      // Truncate to 350 chars, keeping line structure if possible
      sanitized = sanitized.substring(0, 350);

      // Try to preserve line endings
      const lastNewline = sanitized.lastIndexOf('\n');
      if (lastNewline > 0 && lastNewline > 300) {
        // If we're close to a line break, truncate there
        sanitized = sanitized.substring(0, lastNewline);
      }
    } else {
      throw new ValidationError(
        `Note exceeds 350 characters (${sanitized.length})`,
        { charCount: sanitized.length }
      );
    }
  }

  return sanitized;
}

/**
 * Infer Category from Note Content
 *
 * Uses keyword matching to determine most likely category.
 * Keywords are case-insensitive.
 *
 * Priority order (first match wins):
 * 1. Outage - service down, no connection, total loss
 * 2. WiFi - wireless, wi-fi, wifi, signal, SSID
 * 3. CGNAT - CGNAT, carrier-grade NAT, port forwarding
 * 4. Wiring - cable, wire, physical, ONT, fiber
 * 5. EquipmentReturn - return, replace, swap, defective equipment
 * 6. Unknown - no keywords matched
 *
 * @param note - Note text to analyze
 * @returns Inferred category
 */
export function inferCategory(note: string): Category {
  const lowerNote = note.toLowerCase();

  // Outage keywords
  if (
    lowerNote.includes('outage') ||
    lowerNote.includes('service down') ||
    lowerNote.includes('no service') ||
    lowerNote.includes('no internet') ||
    lowerNote.includes('total loss') ||
    lowerNote.includes('complete outage')
  ) {
    return Category.Outage;
  }

  // WiFi keywords
  if (
    lowerNote.includes('wifi') ||
    lowerNote.includes('wi-fi') ||
    lowerNote.includes('wireless') ||
    lowerNote.includes('signal') ||
    lowerNote.includes('ssid') ||
    lowerNote.includes('5ghz') ||
    lowerNote.includes('2.4ghz')
  ) {
    return Category.WiFi;
  }

  // CGNAT keywords
  if (
    lowerNote.includes('cgnat') ||
    lowerNote.includes('carrier-grade nat') ||
    lowerNote.includes('port forward') ||
    lowerNote.includes('port mapping') ||
    lowerNote.includes('public ip')
  ) {
    return Category.CGNAT;
  }

  // Wiring keywords
  if (
    lowerNote.includes('cable') ||
    lowerNote.includes('wiring') ||
    lowerNote.includes('wire') ||
    lowerNote.includes('physical') ||
    lowerNote.includes('ont') ||
    lowerNote.includes('fiber') ||
    lowerNote.includes('ethernet')
  ) {
    return Category.Wiring;
  }

  // Equipment Return keywords
  if (
    lowerNote.includes('return') ||
    lowerNote.includes('replace') ||
    lowerNote.includes('swap') ||
    lowerNote.includes('defective') ||
    lowerNote.includes('broken') ||
    lowerNote.includes('faulty equipment')
  ) {
    return Category.EquipmentReturn;
  }

  // No keywords matched
  return Category.Unknown;
}

/**
 * Infer Escalation Reason from Note Content
 *
 * Uses keyword matching to determine escalation reason.
 * Keywords are case-insensitive.
 *
 * Priority order (first match wins):
 * 1. CallerRequested - agent, speak to, talk to, human
 * 2. SafetyRisk - safety, danger, risk, emergency
 * 3. BillingOrAccount - billing, payment, account, charge
 * 4. TwoStepsNoResolve - not resolved, still broken, didn't work
 * 5. OutOfScope - complex, advanced, beyond, outside scope
 * 6. Other - no keywords matched
 *
 * @param note - Note text to analyze
 * @returns Inferred escalation reason
 */
export function inferEscalationReason(note: string): EscalationReason {
  const lowerNote = note.toLowerCase();

  // Caller requested keywords
  if (
    lowerNote.includes('agent') ||
    lowerNote.includes('speak to') ||
    lowerNote.includes('talk to') ||
    lowerNote.includes('human') ||
    lowerNote.includes('representative') ||
    lowerNote.includes('customer requested')
  ) {
    return EscalationReason.CallerRequested;
  }

  // Safety risk keywords
  if (
    lowerNote.includes('safety') ||
    lowerNote.includes('danger') ||
    lowerNote.includes('risk') ||
    lowerNote.includes('emergency') ||
    lowerNote.includes('urgent') ||
    lowerNote.includes('hazard')
  ) {
    return EscalationReason.SafetyRisk;
  }

  // Billing keywords
  if (
    lowerNote.includes('billing') ||
    lowerNote.includes('payment') ||
    lowerNote.includes('account') ||
    lowerNote.includes('charge') ||
    lowerNote.includes('invoice') ||
    lowerNote.includes('refund')
  ) {
    return EscalationReason.BillingOrAccount;
  }

  // Not resolved keywords
  if (
    lowerNote.includes('not resolved') ||
    lowerNote.includes('still broken') ||
    lowerNote.includes("didn't work") ||
    lowerNote.includes('tried twice') ||
    lowerNote.includes('multiple attempts')
  ) {
    return EscalationReason.TwoStepsNoResolve;
  }

  // Out of scope keywords
  if (
    lowerNote.includes('complex') ||
    lowerNote.includes('advanced') ||
    lowerNote.includes('beyond') ||
    lowerNote.includes('outside scope') ||
    lowerNote.includes('specialized')
  ) {
    return EscalationReason.OutOfScope;
  }

  // No keywords matched
  return EscalationReason.Other;
}

/**
 * Parse Note Lines - Extract Structured Data from Note
 *
 * Parses 4-line note format back into structured components.
 * Useful for validation and processing existing notes.
 *
 * @param note - 4-line formatted note
 * @returns Parsed components
 * @throws ValidationError if format is invalid
 */
export function parseNote(note: string): {
  category: string;
  escalationReason: string;
  summary: string;
  confidence: string;
} {
  const validation = validateNote(note);
  if (!validation.valid || !validation.lines) {
    throw new ValidationError(
      `Cannot parse invalid note: ${validation.error}`,
      validation
    );
  }

  const lines = validation.lines;

  // Extract values after colons
  const extractValue = (line: string, prefix: string): string => {
    const value = line.substring(prefix.length).trim();
    if (!value) {
      throw new ValidationError(`Empty value for ${prefix}`, { line });
    }
    return value;
  };

  return {
    category: extractValue(lines[0], 'Category:'),
    escalationReason: extractValue(lines[1], 'Reason:'),
    summary: extractValue(lines[2], 'Summary:'),
    confidence: extractValue(lines[3], 'Confidence:')
  };
}
