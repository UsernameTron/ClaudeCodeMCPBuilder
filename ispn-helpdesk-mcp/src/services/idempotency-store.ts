/**
 * Idempotency Store - Duplicate Request Detection
 *
 * Caches responses for 15 minutes to detect and prevent duplicate
 * request processing. Uses Idempotency-Key header + payload hash.
 *
 * Ensures:
 * 1. Same Idempotency-Key with same payload → return cached response
 * 2. Same Idempotency-Key with different payload → reject (conflict)
 * 3. No Idempotency-Key → process normally
 *
 * Note: This is an in-memory store. For production with multiple
 * server instances, replace with Redis or persistent store.
 */

import { IdempotencyEntry } from '../types/index.js';

export class IdempotencyStore {
  private cache = new Map<string, IdempotencyEntry>();
  private cleanupInterval: NodeJS.Timeout;
  private readonly TTL_MS: number;

  constructor(ttlMinutes: number = 15) {
    this.TTL_MS = ttlMinutes * 60 * 1000;

    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request is duplicate
   *
   * @returns Cached entry if duplicate, null if new request
   */
  get(idempotencyKey: string, payloadHash: string): IdempotencyEntry | null {
    const entry = this.cache.get(idempotencyKey);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(idempotencyKey);
      return null;
    }

    // Check if payload matches (detect conflicts)
    if (entry.payloadHash !== payloadHash) {
      // Same key, different payload = conflict
      // This is a serious issue - client is reusing keys incorrectly
      throw new Error(
        `Idempotency key conflict: key '${idempotencyKey}' already used with different payload`
      );
    }

    return entry;
  }

  /**
   * Store response for future duplicate detection
   */
  set(
    idempotencyKey: string,
    payloadHash: string,
    response: any,
    statusCode: number = 200
  ): void {
    const entry: IdempotencyEntry = {
      response,
      timestamp: Date.now(),
      payloadHash,
      statusCode
    };

    this.cache.set(idempotencyKey, entry);
  }

  /**
   * Check if entry has expired
   */
  private isExpired(entry: IdempotencyEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) > this.TTL_MS;
  }

  /**
   * Clean up expired entries
   * Called automatically every 5 minutes
   */
  private cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL_MS) {
        expired.push(key);
      }
    }

    expired.forEach(key => this.cache.delete(key));

    if (expired.length > 0) {
      // Note: logger will be available after we create it
      console.log(`[IdempotencyStore] Cleaned up ${expired.length} expired idempotency keys`);
    }
  }

  /**
   * Get current size (for monitoring)
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Destroy the store and cleanup interval
   * Call this on server shutdown
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }

  /**
   * Get all entries (for debugging)
   */
  getAll(): Map<string, IdempotencyEntry> {
    return new Map(this.cache);
  }
}

/**
 * Singleton instance
 * Import this in middleware that needs idempotency checking
 */
export const idempotencyStore = new IdempotencyStore(15); // 15-minute TTL
