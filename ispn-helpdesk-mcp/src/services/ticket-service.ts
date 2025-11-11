/**
 * Ticket Service - Core Business Logic for Ticket Management
 *
 * Implements the deduplication and ticket creation logic:
 * 1. findOrCreateTicket() - Main entry point with deduplication
 * 2. Uses oaKey first (if provided)
 * 3. Falls back to callerNumber + category + time window
 * 4. Creates new ticket if no match found
 *
 * Deduplication Strategy:
 * - oaKey match → append to existing ticket
 * - callerNumber + category within 4 hours → append to existing ticket
 * - No match → create new ticket
 */

import { Category, EscalationReason, Source, TicketEntry } from '../types/index.js';
import { helpdeskClient } from './helpdesk-client.js';
import { ticketStore } from './ticket-store.js';
import { inferCategory, inferEscalationReason } from './note-processor.js';

/**
 * Find or Create Ticket - Main Deduplication Logic
 *
 * This is the core function that implements the business rules:
 *
 * 1. If oaKey provided:
 *    a. Look up existing ticket by oaKey
 *    b. If found and not expired → return existing ticket (created=false)
 *
 * 2. If callerNumber + category provided:
 *    a. Look up existing ticket by caller + category
 *    b. If found and within 4-hour window → return existing ticket (created=false)
 *
 * 3. If no match found:
 *    a. Create new ticket in helpdesk
 *    b. Store in ticket-store for future deduplication
 *    c. Return new ticket (created=true)
 *
 * @returns Ticket ID, URL, and whether it was created or found
 */
export async function findOrCreateTicket(params: {
  description: string;
  category?: Category;
  escalationReason?: EscalationReason;
  callerNumber?: string;
  oaKey?: string;
  source?: Source;
  metadata?: Record<string, any>;
}): Promise<{
  ticketId: string;
  ticketUrl: string;
  created: boolean;
}> {
  // Apply defaults and inference
  const category = params.category || inferCategory(params.description);
  const escalationReason = params.escalationReason || inferEscalationReason(params.description);
  const source = params.source || Source.Other;

  // Step 1: Try to find by oaKey (highest priority)
  if (params.oaKey) {
    const existingByOaKey = ticketStore.findByOaKey(params.oaKey);

    if (existingByOaKey) {
      console.log(`[TicketService] Found existing ticket by oaKey: ${existingByOaKey.ticketId}`);
      return {
        ticketId: existingByOaKey.ticketId,
        ticketUrl: existingByOaKey.ticketUrl,
        created: false
      };
    }
  }

  // Step 2: Try to find by callerNumber + category
  if (params.callerNumber) {
    const existingByCallerCategory = ticketStore.findByCallerCategory(
      params.callerNumber,
      category
    );

    if (existingByCallerCategory) {
      console.log(
        `[TicketService] Found existing ticket by caller+category: ${existingByCallerCategory.ticketId}`
      );
      return {
        ticketId: existingByCallerCategory.ticketId,
        ticketUrl: existingByCallerCategory.ticketUrl,
        created: false
      };
    }
  }

  // Step 3: No existing ticket found, create new one
  console.log('[TicketService] No existing ticket found, creating new ticket');

  const result = await helpdeskClient.createTicket({
    description: params.description,
    category,
    escalationReason,
    callerNumber: params.callerNumber,
    source,
    metadata: params.metadata
  });

  // Store the new ticket for future deduplication
  const ticketEntry: TicketEntry = {
    ticketId: result.ticketId,
    ticketUrl: result.ticketUrl,
    timestamp: Date.now(),
    oaKey: params.oaKey,
    callerNumber: params.callerNumber,
    category
  };

  // Store by oaKey if provided
  if (params.oaKey) {
    ticketStore.storeByOaKey(params.oaKey, ticketEntry);
  }

  // Store by caller + category if provided
  if (params.callerNumber) {
    ticketStore.storeByCallerCategory(params.callerNumber, category, ticketEntry);
  }

  console.log(`[TicketService] Created new ticket: ${result.ticketId}`);

  return {
    ticketId: result.ticketId,
    ticketUrl: result.ticketUrl,
    created: true
  };
}

/**
 * Append Note to Ticket
 *
 * Simple wrapper around helpdesk client's appendNote.
 * Adds logging and error handling.
 *
 * @returns Success status and message
 */
export async function appendNoteToTicket(params: {
  ticketId: string;
  note: string;
  author?: string;
}): Promise<{
  success: boolean;
  message: string;
}> {
  console.log(`[TicketService] Appending note to ticket: ${params.ticketId}`);

  try {
    const result = await helpdeskClient.appendNote({
      ticketId: params.ticketId,
      note: params.note,
      author: params.author || 'ISPN-Agent'
    });

    console.log(`[TicketService] Successfully appended note to ${params.ticketId}`);

    return result;
  } catch (error) {
    console.error(`[TicketService] Failed to append note to ${params.ticketId}:`, error);
    throw error;
  }
}

/**
 * Create Ticket (Without Deduplication)
 *
 * Directly creates a new ticket, bypassing deduplication logic.
 * Use this when you explicitly want a new ticket (e.g., from MCP tools).
 *
 * @returns Ticket ID and URL
 */
export async function createTicketDirect(params: {
  description: string;
  category: Category;
  escalationReason: EscalationReason;
  callerNumber?: string;
  source?: Source;
  metadata?: Record<string, any>;
}): Promise<{
  ticketId: string;
  ticketUrl: string;
}> {
  console.log('[TicketService] Creating ticket directly (no deduplication)');

  const result = await helpdeskClient.createTicket(params);

  console.log(`[TicketService] Created ticket directly: ${result.ticketId}`);

  return result;
}

/**
 * Get Ticket Store Stats (For Monitoring)
 *
 * Returns statistics about the ticket store for monitoring/debugging.
 */
export function getTicketStoreStats(): {
  size: number;
  ticketIds: string[];
} {
  const allEntries = ticketStore.getAll();
  const ticketIds = Array.from(allEntries.values()).map(entry => entry.ticketId);

  return {
    size: ticketStore.size(),
    ticketIds
  };
}
