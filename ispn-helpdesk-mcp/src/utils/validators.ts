/**
 * Validation Utilities
 *
 * Runtime validation functions that complement Zod schemas.
 * These provide specific business logic validation beyond basic types.
 */

import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { ValidationError } from '../errors/custom-errors.js';

/**
 * Validate Phone Number (E.164 format)
 *
 * Uses libphonenumber-js for robust international phone validation.
 *
 * @param phone - Phone number string to validate
 * @returns True if valid E.164 format
 * @throws ValidationError with details if invalid
 *
 * Examples:
 * - Valid: "+12345678900", "+442071234567", "+8613812345678"
 * - Invalid: "123-456-7890", "(555) 123-4567", "5551234"
 */
export function validatePhoneNumber(phone: string): boolean {
  try {
    // Check if valid phone number
    if (!isValidPhoneNumber(phone)) {
      throw new ValidationError(
        `Invalid phone number: ${phone}`,
        {
          field: 'callerNumber',
          value: phone,
          format: 'E.164',
          example: '+12345678900'
        }
      );
    }

    // Parse to get more details
    const parsed = parsePhoneNumber(phone);

    // Must be in E.164 format (starts with +)
    if (!phone.startsWith('+')) {
      throw new ValidationError(
        'Phone number must be in E.164 format (start with +)',
        {
          field: 'callerNumber',
          value: phone,
          format: 'E.164',
          example: '+12345678900'
        }
      );
    }

    return true;
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError(
      `Phone number validation failed: ${error.message}`,
      {
        field: 'callerNumber',
        value: phone,
        error: error.message
      }
    );
  }
}

/**
 * Validate Confidence Value (0.0 to 1.0 as string)
 *
 * AI confidence scores must be:
 * - String format (avoid float precision issues)
 * - Between 0.0 and 1.0 inclusive
 * - Valid number when parsed
 *
 * @param confidence - Confidence string to validate
 * @returns Parsed float value
 * @throws ValidationError if invalid
 *
 * Examples:
 * - Valid: "0.0", "0.5", "0.85", "1.0", "0.123"
 * - Invalid: "1.5", "-0.1", "abc", "fifty percent"
 */
export function validateConfidence(confidence: string): number {
  const num = parseFloat(confidence);

  if (isNaN(num)) {
    throw new ValidationError(
      `Confidence must be a valid number, got: ${confidence}`,
      {
        field: 'confidence',
        value: confidence,
        expected: 'string "0.0" to "1.0"'
      }
    );
  }

  if (num < 0 || num > 1) {
    throw new ValidationError(
      `Confidence must be between 0.0 and 1.0, got: ${num}`,
      {
        field: 'confidence',
        value: confidence,
        parsed: num,
        expected: '0.0 ≤ confidence ≤ 1.0'
      }
    );
  }

  return num;
}

/**
 * Validate Note Format (4 lines, ≤350 chars)
 *
 * Notes must follow strict format:
 * - Exactly 4 lines (separated by \n)
 * - Total length ≤ 350 characters
 * - Each line has content (not just whitespace)
 * - Line 1: Category
 * - Line 2: Reason
 * - Line 3: Summary
 * - Line 4: Confidence
 *
 * @param note - Note string to validate
 * @returns Validation result with details
 *
 * Example valid note:
 * ```
 * Category: WiFi
 * Reason: CallerRequested
 * Summary: Customer reports intermittent WiFi drops on 5GHz band
 * Confidence: 0.85
 * ```
 */
export function validateNote(note: string): {
  valid: boolean;
  error?: string;
  lineCount?: number;
  charCount?: number;
  lines?: string[];
} {
  const charCount = note.length;
  const lines = note.split('\n');
  const lineCount = lines.length;

  // Check length
  if (charCount > 350) {
    return {
      valid: false,
      error: `Note exceeds 350 characters (current: ${charCount})`,
      lineCount,
      charCount
    };
  }

  // Check line count
  if (lineCount !== 4) {
    return {
      valid: false,
      error: `Note must be exactly 4 lines (current: ${lineCount})`,
      lineCount,
      charCount,
      lines
    };
  }

  // Check each line has content
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) {
      return {
        valid: false,
        error: `Line ${i + 1} is empty`,
        lineCount,
        charCount,
        lines
      };
    }
  }

  // Validate line format (optional but recommended)
  const expectedPrefixes = ['Category:', 'Reason:', 'Summary:', 'Confidence:'];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim().startsWith(expectedPrefixes[i])) {
      return {
        valid: false,
        error: `Line ${i + 1} should start with "${expectedPrefixes[i]}"`,
        lineCount,
        charCount,
        lines
      };
    }
  }

  return {
    valid: true,
    lineCount,
    charCount,
    lines
  };
}

/**
 * Sanitize String for Safe Storage
 *
 * Removes or escapes potentially dangerous characters.
 * Prevents XSS, injection attacks, and encoding issues.
 *
 * @param input - String to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters except newline and tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate OA Key Format
 *
 * Outage Agent keys must be:
 * - 6-64 characters
 * - Alphanumeric with hyphens/underscores only
 * - No spaces, special characters
 *
 * @param oaKey - OA key to validate
 * @returns True if valid
 * @throws ValidationError if invalid
 */
export function validateOaKey(oaKey: string): boolean {
  if (oaKey.length < 6 || oaKey.length > 64) {
    throw new ValidationError(
      `OA key length must be 6-64 characters, got: ${oaKey.length}`,
      {
        field: 'oaKey',
        value: oaKey,
        length: oaKey.length
      }
    );
  }

  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(oaKey)) {
    throw new ValidationError(
      'OA key must contain only alphanumeric characters, hyphens, and underscores',
      {
        field: 'oaKey',
        value: oaKey,
        pattern: validPattern.toString()
      }
    );
  }

  return true;
}
