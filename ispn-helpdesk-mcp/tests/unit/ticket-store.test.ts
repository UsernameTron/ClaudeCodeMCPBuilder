/**
 * Unit Tests: Ticket Store
 *
 * Tests for ticket storage and deduplication in src/services/ticket-store.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TicketStore } from '../../src/services/ticket-store';
import { TicketEntry } from '../../src/types';

describe('TicketStore', () => {
  let store: TicketStore;

  beforeEach(() => {
    store = new TicketStore(4); // 4-hour TTL
  });

  afterEach(() => {
    store.destroy();
  });

  describe('storeByOaKey', () => {
    it('should store ticket by oaKey', () => {
      const entry: TicketEntry = {
        ticketId: 'TKT-001',
        ticketUrl: 'https://helpdesk.example.com/TKT-001',
        timestamp: Date.now(),
        oaKey: 'OA-12345'
      };

      store.storeByOaKey('OA-12345', entry);
      const found = store.findByOaKey('OA-12345');

      expect(found).toBeTruthy();
      expect(found?.ticketId).toBe('TKT-001');
    });
  });

  describe('findByOaKey', () => {
    it('should find ticket by oaKey', () => {
      const entry: TicketEntry = {
        ticketId: 'TKT-002',
        ticketUrl: 'https://helpdesk.example.com/TKT-002',
        timestamp: Date.now(),
        oaKey: 'OA-67890'
      };

      store.storeByOaKey('OA-67890', entry);
      const found = store.findByOaKey('OA-67890');

      expect(found).not.toBeNull();
      expect(found?.ticketId).toBe('TKT-002');
    });

    it('should return null for non-existent oaKey', () => {
      const found = store.findByOaKey('NON-EXISTENT');
      expect(found).toBeNull();
    });

    it('should return null for expired entries', () => {
      const expiredEntry: TicketEntry = {
        ticketId: 'TKT-003',
        ticketUrl: 'https://helpdesk.example.com/TKT-003',
        timestamp: Date.now() - (5 * 60 * 60 * 1000), // 5 hours ago (expired)
        oaKey: 'OA-EXPIRED'
      };

      store.storeByOaKey('OA-EXPIRED', expiredEntry);
      const found = store.findByOaKey('OA-EXPIRED');

      expect(found).toBeNull();
    });
  });

  describe('storeByCallerCategory', () => {
    it('should store ticket by caller and category', () => {
      const entry: TicketEntry = {
        ticketId: 'TKT-004',
        ticketUrl: 'https://helpdesk.example.com/TKT-004',
        timestamp: Date.now(),
        callerNumber: '+12345678900',
        category: 'WiFi'
      };

      store.storeByCallerCategory('+12345678900', 'WiFi', entry);
      const found = store.findByCallerCategory('+12345678900', 'WiFi');

      expect(found).toBeTruthy();
      expect(found?.ticketId).toBe('TKT-004');
    });
  });

  describe('findByCallerCategory', () => {
    it('should find ticket by caller and category', () => {
      const entry: TicketEntry = {
        ticketId: 'TKT-005',
        ticketUrl: 'https://helpdesk.example.com/TKT-005',
        timestamp: Date.now(),
        callerNumber: '+19876543210',
        category: 'Outage'
      };

      store.storeByCallerCategory('+19876543210', 'Outage', entry);
      const found = store.findByCallerCategory('+19876543210', 'Outage');

      expect(found).not.toBeNull();
      expect(found?.ticketId).toBe('TKT-005');
    });

    it('should return null for different category', () => {
      const entry: TicketEntry = {
        ticketId: 'TKT-006',
        ticketUrl: 'https://helpdesk.example.com/TKT-006',
        timestamp: Date.now(),
        callerNumber: '+11234567890',
        category: 'WiFi'
      };

      store.storeByCallerCategory('+11234567890', 'WiFi', entry);
      const found = store.findByCallerCategory('+11234567890', 'Outage');

      expect(found).toBeNull();
    });
  });

  describe('size', () => {
    it('should return correct size', () => {
      expect(store.size()).toBe(0);

      const entry: TicketEntry = {
        ticketId: 'TKT-007',
        ticketUrl: 'https://helpdesk.example.com/TKT-007',
        timestamp: Date.now()
      };

      store.storeByOaKey('OA-TEST-1', entry);
      expect(store.size()).toBe(1);

      store.storeByOaKey('OA-TEST-2', entry);
      expect(store.size()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      const entry: TicketEntry = {
        ticketId: 'TKT-008',
        ticketUrl: 'https://helpdesk.example.com/TKT-008',
        timestamp: Date.now()
      };

      store.storeByOaKey('OA-TEST', entry);
      expect(store.size()).toBe(1);

      store.clear();
      expect(store.size()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries on cleanup', async () => {
      // Create entry that's already expired
      const expiredEntry: TicketEntry = {
        ticketId: 'TKT-009',
        ticketUrl: 'https://helpdesk.example.com/TKT-009',
        timestamp: Date.now() - (5 * 60 * 60 * 1000), // 5 hours ago
        oaKey: 'OA-CLEANUP-TEST'
      };

      store.storeByOaKey('OA-CLEANUP-TEST', expiredEntry);

      // Manually trigger cleanup (normally runs every 30 min)
      // @ts-ignore - accessing private method for testing
      store.cleanup();

      const found = store.findByOaKey('OA-CLEANUP-TEST');
      expect(found).toBeNull();
    });

    it('should not remove non-expired entries', () => {
      const recentEntry: TicketEntry = {
        ticketId: 'TKT-010',
        ticketUrl: 'https://helpdesk.example.com/TKT-010',
        timestamp: Date.now(), // Just now
        oaKey: 'OA-RECENT'
      };

      store.storeByOaKey('OA-RECENT', recentEntry);

      // @ts-ignore - accessing private method for testing
      store.cleanup();

      const found = store.findByOaKey('OA-RECENT');
      expect(found).not.toBeNull();
    });
  });
});
