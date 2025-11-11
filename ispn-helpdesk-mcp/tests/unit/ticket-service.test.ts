/**
 * Unit Tests: Ticket Service
 *
 * Tests for ticket service logic in src/services/ticket-service.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  findOrCreateTicket,
  appendNoteToTicket,
  createTicketDirect,
  getTicketStoreStats
} from '../../src/services/ticket-service';
import { Category, EscalationReason, Source } from '../../src/types';
import { ticketStore } from '../../src/services/ticket-store';
import { MockHelpdeskClient } from '../../src/services/helpdesk-client';

describe('Ticket Service', () => {
  // Clear ticket store before each test
  beforeEach(() => {
    ticketStore.clear();
    // Clear mock helpdesk tickets
    const mockClient = new MockHelpdeskClient();
    mockClient.clearAllTickets();
  });

  describe('findOrCreateTicket', () => {
    it('should create new ticket when no oaKey or callerNumber provided', async () => {
      const result = await findOrCreateTicket({
        description: 'Test issue',
        category: Category.WiFi,
        escalationReason: EscalationReason.CallerRequested
      });

      expect(result.created).toBe(true);
      expect(result.ticketId).toBeTruthy();
      expect(result.ticketUrl).toBeTruthy();
    });

    it('should find existing ticket by oaKey', async () => {
      // First call - creates ticket
      const first = await findOrCreateTicket({
        description: 'WiFi issue',
        category: Category.WiFi,
        escalationReason: EscalationReason.CallerRequested,
        oaKey: 'OA-TEST-001'
      });

      expect(first.created).toBe(true);

      // Second call - finds existing ticket
      const second = await findOrCreateTicket({
        description: 'WiFi issue again',
        category: Category.WiFi,
        escalationReason: EscalationReason.CallerRequested,
        oaKey: 'OA-TEST-001'
      });

      expect(second.created).toBe(false);
      expect(second.ticketId).toBe(first.ticketId);
    });

    it('should find existing ticket by callerNumber + category', async () => {
      // First call - creates ticket
      const first = await findOrCreateTicket({
        description: 'Outage reported',
        category: Category.Outage,
        escalationReason: EscalationReason.CallerRequested,
        callerNumber: '+12345678900'
      });

      expect(first.created).toBe(true);

      // Second call - finds existing ticket (same caller, same category)
      const second = await findOrCreateTicket({
        description: 'Still have outage',
        category: Category.Outage,
        escalationReason: EscalationReason.CallerRequested,
        callerNumber: '+12345678900'
      });

      expect(second.created).toBe(false);
      expect(second.ticketId).toBe(first.ticketId);
    });

    it('should create new ticket for same caller but different category', async () => {
      // First call - WiFi issue
      const first = await findOrCreateTicket({
        description: 'WiFi problem',
        category: Category.WiFi,
        escalationReason: EscalationReason.CallerRequested,
        callerNumber: '+12345678900'
      });

      // Second call - Outage issue (different category)
      const second = await findOrCreateTicket({
        description: 'Now have outage',
        category: Category.Outage,
        escalationReason: EscalationReason.CallerRequested,
        callerNumber: '+12345678900'
      });

      expect(first.created).toBe(true);
      expect(second.created).toBe(true);
      expect(second.ticketId).not.toBe(first.ticketId);
    });

    it('should infer category when not provided', async () => {
      const result = await findOrCreateTicket({
        description: 'wifi not working properly',
        escalationReason: EscalationReason.CallerRequested
      });

      expect(result.created).toBe(true);
      expect(result.ticketId).toBeTruthy();
    });

    it('should infer escalation reason when not provided', async () => {
      const result = await findOrCreateTicket({
        description: 'customer wants to speak to agent',
        category: Category.WiFi
      });

      expect(result.created).toBe(true);
      expect(result.ticketId).toBeTruthy();
    });

    it('should use Source.Other as default', async () => {
      const result = await findOrCreateTicket({
        description: 'Test issue',
        category: Category.WiFi,
        escalationReason: EscalationReason.CallerRequested
      });

      expect(result.created).toBe(true);
    });
  });

  describe('appendNoteToTicket', () => {
    it('should append note to existing ticket', async () => {
      // Create a ticket first
      const ticket = await findOrCreateTicket({
        description: 'Test issue',
        category: Category.WiFi,
        escalationReason: EscalationReason.CallerRequested
      });

      // Append note
      const result = await appendNoteToTicket({
        ticketId: ticket.ticketId,
        note: 'Additional information'
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain(ticket.ticketId);
    });

    it('should throw on non-existent ticket', async () => {
      await expect(appendNoteToTicket({
        ticketId: 'NON-EXISTENT',
        note: 'Test note'
      })).rejects.toThrow();
    });
  });

  describe('createTicketDirect', () => {
    it('should create ticket without deduplication', async () => {
      const result = await createTicketDirect({
        description: 'Direct ticket',
        category: Category.WiFi,
        escalationReason: EscalationReason.CallerRequested
      });

      expect(result.ticketId).toBeTruthy();
      expect(result.ticketUrl).toBeTruthy();
    });

    it('should always create new ticket even with same oaKey', async () => {
      // Use findOrCreate first
      const first = await findOrCreateTicket({
        description: 'Test',
        category: Category.WiFi,
        escalationReason: EscalationReason.CallerRequested,
        oaKey: 'OA-DIRECT-TEST'
      });

      // Use direct create with same oaKey
      const second = await createTicketDirect({
        description: 'Test again',
        category: Category.WiFi,
        escalationReason: EscalationReason.CallerRequested
      });

      // Should create new ticket (no deduplication)
      expect(second.ticketId).not.toBe(first.ticketId);
    });
  });

  describe('getTicketStoreStats', () => {
    it('should return empty stats initially', () => {
      const stats = getTicketStoreStats();
      expect(stats.size).toBe(0);
      expect(stats.ticketIds).toEqual([]);
    });

    it('should return correct stats after ticket creation', async () => {
      await findOrCreateTicket({
        description: 'Test 1',
        category: Category.WiFi,
        escalationReason: EscalationReason.CallerRequested,
        oaKey: 'OA-STATS-1'
      });

      await findOrCreateTicket({
        description: 'Test 2',
        category: Category.Outage,
        escalationReason: EscalationReason.CallerRequested,
        oaKey: 'OA-STATS-2'
      });

      const stats = getTicketStoreStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.ticketIds.length).toBeGreaterThan(0);
    });
  });
});
