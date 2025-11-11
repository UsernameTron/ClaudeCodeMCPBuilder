/**
 * Ticket Store - In-Memory Ticket Cache for Deduplication
 *
 * Stores recent tickets for 4-hour window to enable:
 * 1. Deduplication by oaKey (find existing ticket for same issue)
 * 2. Deduplication by caller + category + time (prevent duplicates)
 *
 * Note: This is an in-memory store. For production with multiple
 * server instances, replace with Redis or persistent store.
 */

import { TicketEntry } from '../types/index.js';

export class TicketStore {
  private tickets = new Map<string, TicketEntry>();
  private cleanupInterval: NodeJS.Timeout;
  private readonly TTL_MS: number;

  constructor(ttlHours: number = 4) {
    this.TTL_MS = ttlHours * 60 * 60 * 1000;

    // Run cleanup every 30 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 30 * 60 * 1000);
  }

  /**
   * Store a ticket by oaKey (primary deduplication key)
   */
  storeByOaKey(oaKey: string, entry: TicketEntry): void {
    this.tickets.set(`oa:${oaKey}`, entry);
  }

  /**
   * Store a ticket by caller + category (secondary deduplication)
   */
  storeByCallerCategory(callerNumber: string, category: string, entry: TicketEntry): void {
    const key = `caller:${callerNumber}:${category}`;
    this.tickets.set(key, entry);
  }

  /**
   * Find ticket by oaKey
   */
  findByOaKey(oaKey: string): TicketEntry | null {
    const entry = this.tickets.get(`oa:${oaKey}`);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.tickets.delete(`oa:${oaKey}`);
      return null;
    }

    return entry;
  }

  /**
   * Find ticket by caller + category within time window
   */
  findByCallerCategory(callerNumber: string, category: string): TicketEntry | null {
    const key = `caller:${callerNumber}:${category}`;
    const entry = this.tickets.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.tickets.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Check if entry has expired
   */
  private isExpired(entry: TicketEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) > this.TTL_MS;
  }

  /**
   * Clean up expired entries
   * Called automatically every 30 minutes
   */
  private cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [key, entry] of this.tickets.entries()) {
      if (now - entry.timestamp > this.TTL_MS) {
        expired.push(key);
      }
    }

    expired.forEach(key => this.tickets.delete(key));

    if (expired.length > 0) {
      // Note: logger will be available after we create it
      console.log(`[TicketStore] Cleaned up ${expired.length} expired tickets`);
    }
  }

  /**
   * Get current size (for monitoring)
   */
  size(): number {
    return this.tickets.size;
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.tickets.clear();
  }

  /**
   * Destroy the store and cleanup interval
   * Call this on server shutdown
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.tickets.clear();
  }

  /**
   * Get all entries (for debugging)
   */
  getAll(): Map<string, TicketEntry> {
    return new Map(this.tickets);
  }
}

/**
 * Singleton instance
 * Import this in services that need ticket lookup
 */
export const ticketStore = new TicketStore(4); // 4-hour TTL
