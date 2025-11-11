/**
 * Unit Tests: Idempotency Store
 *
 * Tests for idempotency checking in src/services/idempotency-store.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IdempotencyStore } from '../../src/services/idempotency-store';

describe('IdempotencyStore', () => {
  let store: IdempotencyStore;

  beforeEach(() => {
    store = new IdempotencyStore(15); // 15-minute TTL
  });

  afterEach(() => {
    store.destroy();
  });

  describe('set and get', () => {
    it('should store and retrieve idempotent response', () => {
      const response = { status: 'ok', ticketId: 'TKT-001' };
      store.set('key-001', 'hash-001', response, 200);

      const cached = store.get('key-001', 'hash-001');
      expect(cached).toBeTruthy();
      expect(cached?.response).toEqual(response);
      expect(cached?.statusCode).toBe(200);
    });

    it('should return null for non-existent key', () => {
      const cached = store.get('non-existent', 'hash');
      expect(cached).toBeNull();
    });

    it('should throw on payload hash mismatch (conflict)', () => {
      const response = { status: 'ok' };
      store.set('key-002', 'hash-abc', response);

      expect(() => store.get('key-002', 'hash-xyz')).toThrow(/conflict/i);
    });
  });

  describe('expiry', () => {
    it('should return null for expired entries', () => {
      const expiredEntry = {
        response: { status: 'ok' },
        timestamp: Date.now() - (20 * 60 * 1000), // 20 minutes ago (expired)
        payloadHash: 'hash-expired',
        statusCode: 200
      };

      // Manually inject expired entry
      // @ts-ignore - accessing private field for testing
      store.cache.set('expired-key', expiredEntry);

      const cached = store.get('expired-key', 'hash-expired');
      expect(cached).toBeNull();
    });

    it('should not expire recent entries', () => {
      const response = { status: 'ok' };
      store.set('recent-key', 'hash-recent', response);

      const cached = store.get('recent-key', 'hash-recent');
      expect(cached).not.toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries on cleanup', () => {
      const expiredEntry = {
        response: { status: 'ok' },
        timestamp: Date.now() - (20 * 60 * 1000), // 20 minutes ago
        payloadHash: 'hash-old',
        statusCode: 200
      };

      // @ts-ignore
      store.cache.set('old-key', expiredEntry);
      expect(store.size()).toBe(1);

      // @ts-ignore - accessing private method for testing
      store.cleanup();

      expect(store.size()).toBe(0);
    });

    it('should not remove non-expired entries', () => {
      store.set('recent-key', 'hash-recent', { status: 'ok' });
      expect(store.size()).toBe(1);

      // @ts-ignore
      store.cleanup();

      expect(store.size()).toBe(1);
    });
  });

  describe('size', () => {
    it('should return correct size', () => {
      expect(store.size()).toBe(0);

      store.set('key-1', 'hash-1', {});
      expect(store.size()).toBe(1);

      store.set('key-2', 'hash-2', {});
      expect(store.size()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      store.set('key-1', 'hash-1', {});
      store.set('key-2', 'hash-2', {});
      expect(store.size()).toBe(2);

      store.clear();
      expect(store.size()).toBe(0);
    });
  });
});
