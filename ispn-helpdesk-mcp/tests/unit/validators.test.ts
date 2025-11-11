/**
 * Unit Tests: Validators
 *
 * Tests for validation utilities in src/utils/validators.ts
 */

import { describe, it, expect } from 'vitest';
import {
  validatePhoneNumber,
  validateConfidence,
  validateNote,
  sanitizeString,
  validateOaKey
} from '../../src/utils/validators';
import { ValidationError } from '../../src/errors/custom-errors';

describe('validatePhoneNumber', () => {
  it('should accept valid E.164 phone numbers', () => {
    expect(validatePhoneNumber('+12345678900')).toBe(true);
    expect(validatePhoneNumber('+442071234567')).toBe(true);
    expect(validatePhoneNumber('+8613812345678')).toBe(true);
  });

  it('should reject phone numbers without + prefix', () => {
    expect(() => validatePhoneNumber('12345678900')).toThrow(ValidationError);
  });

  it('should reject invalid phone numbers', () => {
    expect(() => validatePhoneNumber('123-456-7890')).toThrow(ValidationError);
    expect(() => validatePhoneNumber('(555) 123-4567')).toThrow(ValidationError);
    expect(() => validatePhoneNumber('abc123')).toThrow(ValidationError);
  });

  it('should reject too short numbers', () => {
    expect(() => validatePhoneNumber('+123')).toThrow(ValidationError);
  });
});

describe('validateConfidence', () => {
  it('should accept valid confidence strings', () => {
    expect(validateConfidence('0.0')).toBe(0.0);
    expect(validateConfidence('0.5')).toBe(0.5);
    expect(validateConfidence('0.85')).toBe(0.85);
    expect(validateConfidence('1.0')).toBe(1.0);
  });

  it('should reject values outside 0-1 range', () => {
    expect(() => validateConfidence('1.5')).toThrow(ValidationError);
    expect(() => validateConfidence('-0.1')).toThrow(ValidationError);
    expect(() => validateConfidence('2.0')).toThrow(ValidationError);
  });

  it('should reject non-numeric strings', () => {
    expect(() => validateConfidence('abc')).toThrow(ValidationError);
    expect(() => validateConfidence('fifty percent')).toThrow(ValidationError);
  });
});

describe('validateNote', () => {
  const validNote = `Category: WiFi
Reason: CallerRequested
Summary: Customer reports intermittent WiFi drops on 5GHz band
Confidence: 0.85`;

  it('should accept valid 4-line notes', () => {
    const result = validateNote(validNote);
    expect(result.valid).toBe(true);
    expect(result.lineCount).toBe(4);
    expect(result.charCount).toBeLessThanOrEqual(350);
  });

  it('should reject notes with wrong line count', () => {
    const threeLines = `Category: WiFi
Reason: CallerRequested
Summary: Test`;
    const result = validateNote(threeLines);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('4 lines');
  });

  it('should reject notes exceeding 350 characters', () => {
    const longSummary = 'x'.repeat(400);
    const longNote = `Category: WiFi
Reason: CallerRequested
Summary: ${longSummary}
Confidence: 0.85`;
    const result = validateNote(longNote);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('350 characters');
  });

  it('should reject notes with empty lines', () => {
    const emptyLine = `Category: WiFi

Summary: Test
Confidence: 0.85`;
    const result = validateNote(emptyLine);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('should reject notes with incorrect line prefixes', () => {
    const wrongPrefix = `Category: WiFi
Escalation: CallerRequested
Summary: Test
Confidence: 0.85`;
    const result = validateNote(wrongPrefix);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Reason:');
  });
});

describe('sanitizeString', () => {
  it('should remove null bytes', () => {
    const input = 'test\0string';
    const result = sanitizeString(input);
    expect(result).toBe('teststring');
  });

  it('should remove control characters', () => {
    const input = 'test\x00\x01\x02string';
    const result = sanitizeString(input);
    expect(result).toBe('teststring');
  });

  it('should trim whitespace', () => {
    const input = '  test string  ';
    const result = sanitizeString(input);
    expect(result).toBe('test string');
  });

  it('should truncate to max length', () => {
    const input = 'x'.repeat(200);
    const result = sanitizeString(input, 100);
    expect(result.length).toBe(100);
  });
});

describe('validateOaKey', () => {
  it('should accept valid OA keys', () => {
    expect(validateOaKey('OA-12345')).toBe(true);
    expect(validateOaKey('outage_abc123')).toBe(true);
    expect(validateOaKey('incident-2024-001')).toBe(true);
  });

  it('should reject keys too short', () => {
    expect(() => validateOaKey('ab')).toThrow(ValidationError);
    expect(() => validateOaKey('12345')).toThrow(ValidationError);
  });

  it('should reject keys too long', () => {
    const longKey = 'x'.repeat(100);
    expect(() => validateOaKey(longKey)).toThrow(ValidationError);
  });

  it('should reject keys with invalid characters', () => {
    expect(() => validateOaKey('test@key')).toThrow(ValidationError);
    expect(() => validateOaKey('test key')).toThrow(ValidationError);
    expect(() => validateOaKey('test.key')).toThrow(ValidationError);
  });
});
