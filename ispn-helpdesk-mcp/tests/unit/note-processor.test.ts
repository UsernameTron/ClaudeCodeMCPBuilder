/**
 * Unit Tests: Note Processor
 *
 * Tests for note processing functions in src/services/note-processor.ts
 */

import { describe, it, expect } from 'vitest';
import {
  renderNote,
  sanitizeNote,
  inferCategory,
  inferEscalationReason,
  parseNote
} from '../../src/services/note-processor';
import { Category, EscalationReason } from '../../src/types';
import { ValidationError } from '../../src/errors/custom-errors';

describe('renderNote', () => {
  it('should render valid 4-line note from components', () => {
    const result = renderNote({
      category: 'WiFi',
      escalationReason: 'CallerRequested',
      summary: 'Customer reports intermittent WiFi drops',
      confidence: '0.85'
    });

    expect(result).toContain('Category: WiFi');
    expect(result).toContain('Reason: CallerRequested');
    expect(result).toContain('Summary: Customer reports');
    expect(result).toContain('Confidence: 0.85');
    expect(result.split('\n').length).toBe(4);
  });

  it('should throw if rendered note exceeds 350 chars', () => {
    const longSummary = 'x'.repeat(400);
    expect(() => renderNote({
      category: 'WiFi',
      escalationReason: 'CallerRequested',
      summary: longSummary,
      confidence: '0.85'
    })).toThrow(ValidationError);
  });
});

describe('sanitizeNote', () => {
  it('should sanitize note with valid format', () => {
    const note = `Category: WiFi
Reason: CallerRequested
Summary: Test summary
Confidence: 0.85`;
    const result = sanitizeNote(note);
    expect(result).toBe(note.trim());
  });

  it('should throw if note has too few lines', () => {
    const note = `Category: WiFi
Reason: CallerRequested`;
    expect(() => sanitizeNote(note)).toThrow(ValidationError);
  });

  it('should truncate if note has too many lines and truncate=true', () => {
    const note = `Category: WiFi
Reason: CallerRequested
Summary: Test
Confidence: 0.85
Extra line`;
    const result = sanitizeNote(note, true);
    expect(result.split('\n').length).toBe(4);
  });

  it('should throw if note has too many lines and truncate=false', () => {
    const note = `Category: WiFi
Reason: CallerRequested
Summary: Test
Confidence: 0.85
Extra line`;
    expect(() => sanitizeNote(note, false)).toThrow(ValidationError);
  });
});

describe('inferCategory', () => {
  it('should infer Outage from keywords', () => {
    expect(inferCategory('service down no internet')).toBe(Category.Outage);
    expect(inferCategory('complete outage reported')).toBe(Category.Outage);
    expect(inferCategory('total loss of connectivity')).toBe(Category.Outage);
  });

  it('should infer WiFi from keywords', () => {
    expect(inferCategory('wifi not working properly')).toBe(Category.WiFi);
    expect(inferCategory('wireless signal issues')).toBe(Category.WiFi);
    expect(inferCategory('5GHz band problems')).toBe(Category.WiFi);
  });

  it('should infer CGNAT from keywords', () => {
    expect(inferCategory('cgnat issues with port forwarding')).toBe(Category.CGNAT);
    expect(inferCategory('need public ip address')).toBe(Category.CGNAT);
  });

  it('should infer Wiring from keywords', () => {
    expect(inferCategory('cable connection problem')).toBe(Category.Wiring);
    expect(inferCategory('ont not responding properly')).toBe(Category.Wiring);
    expect(inferCategory('fiber wiring issue')).toBe(Category.Wiring);
    expect(inferCategory('physical ethernet cable damaged')).toBe(Category.Wiring);
  });

  it('should infer EquipmentReturn from keywords', () => {
    expect(inferCategory('need to return defective equipment')).toBe(Category.EquipmentReturn);
    expect(inferCategory('router replacement required')).toBe(Category.EquipmentReturn);
  });

  it('should return Unknown for no matching keywords', () => {
    expect(inferCategory('random text with no keywords')).toBe(Category.Unknown);
  });

  it('should prioritize Outage over other categories', () => {
    expect(inferCategory('wifi down service outage')).toBe(Category.Outage);
  });
});

describe('inferEscalationReason', () => {
  it('should infer CallerRequested from keywords', () => {
    expect(inferEscalationReason('customer wants to speak to agent')).toBe(EscalationReason.CallerRequested);
    expect(inferEscalationReason('talk to human representative')).toBe(EscalationReason.CallerRequested);
  });

  it('should infer SafetyRisk from keywords', () => {
    expect(inferEscalationReason('safety concern emergency')).toBe(EscalationReason.SafetyRisk);
    expect(inferEscalationReason('dangerous situation urgent')).toBe(EscalationReason.SafetyRisk);
  });

  it('should infer BillingOrAccount from keywords', () => {
    expect(inferEscalationReason('billing issue with payment')).toBe(EscalationReason.BillingOrAccount);
    expect(inferEscalationReason('account charge dispute')).toBe(EscalationReason.BillingOrAccount);
  });

  it('should infer TwoStepsNoResolve from keywords', () => {
    expect(inferEscalationReason('still broken not resolved')).toBe(EscalationReason.TwoStepsNoResolve);
    expect(inferEscalationReason('tried twice didnt work')).toBe(EscalationReason.TwoStepsNoResolve);
  });

  it('should infer OutOfScope from keywords', () => {
    expect(inferEscalationReason('complex advanced configuration')).toBe(EscalationReason.OutOfScope);
    expect(inferEscalationReason('beyond automated scope')).toBe(EscalationReason.OutOfScope);
  });

  it('should return Other for no matching keywords', () => {
    expect(inferEscalationReason('random text with no keywords')).toBe(EscalationReason.Other);
  });
});

describe('parseNote', () => {
  const validNote = `Category: WiFi
Reason: CallerRequested
Summary: Customer reports intermittent WiFi drops
Confidence: 0.85`;

  it('should parse valid note correctly', () => {
    const result = parseNote(validNote);
    expect(result.category).toBe('WiFi');
    expect(result.escalationReason).toBe('CallerRequested');
    expect(result.summary).toBe('Customer reports intermittent WiFi drops');
    expect(result.confidence).toBe('0.85');
  });

  it('should throw on invalid note format', () => {
    const invalidNote = `Category: WiFi
Reason: CallerRequested`;
    expect(() => parseNote(invalidNote)).toThrow(ValidationError);
  });

  it('should throw on empty values', () => {
    const emptyValue = `Category:
Reason: CallerRequested
Summary: Test
Confidence: 0.85`;
    expect(() => parseNote(emptyValue)).toThrow(ValidationError);
  });
});
