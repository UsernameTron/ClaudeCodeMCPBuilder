/**
 * Helpdesk Client - Abstract interface for helpdesk API operations
 *
 * This file provides:
 * 1. Interface defining helpdesk operations
 * 2. Mock implementation for development/testing
 * 3. TODO markers for real API integration
 *
 * PRODUCTION TODO:
 * Replace MockHelpdeskClient with RealHelpdeskClient that calls your
 * actual helpdesk API (e.g., Zendesk, Freshdesk, ServiceNow, custom).
 */

import { Category, EscalationReason, Source, HelpdeskTicket, HelpdeskNote } from '../types/index.js';
import { HelpdeskError } from '../errors/custom-errors.js';

/**
 * Helpdesk Client Interface
 *
 * Define the contract that any helpdesk implementation must follow.
 */
export interface IHelpdeskClient {
  /**
   * Create a new helpdesk ticket
   *
   * @returns Ticket ID and URL
   * @throws HelpdeskError if creation fails
   */
  createTicket(params: {
    description: string;
    category: Category;
    escalationReason: EscalationReason;
    callerNumber?: string;
    source?: Source;
    metadata?: Record<string, any>;
  }): Promise<{ ticketId: string; ticketUrl: string }>;

  /**
   * Append a note to an existing ticket
   *
   * @returns Success status
   * @throws HelpdeskError if append fails
   */
  appendNote(params: {
    ticketId: string;
    note: string;
    author?: string;
  }): Promise<{ success: boolean; message: string }>;

  /**
   * Get ticket by ID (optional, for advanced features)
   *
   * @returns Ticket details
   * @throws HelpdeskError if ticket not found
   */
  getTicket?(ticketId: string): Promise<HelpdeskTicket>;

  /**
   * Health check - verify API connectivity
   *
   * @returns True if API is reachable
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Mock Helpdesk Client - For Development & Testing
 *
 * Simulates helpdesk API responses without making real API calls.
 * Use this for development, then swap for RealHelpdeskClient in production.
 */
export class MockHelpdeskClient implements IHelpdeskClient {
  private ticketCounter = 1000;
  private tickets = new Map<string, HelpdeskTicket>();

  async createTicket(params: {
    description: string;
    category: Category;
    escalationReason: EscalationReason;
    callerNumber?: string;
    source?: Source;
    metadata?: Record<string, any>;
  }): Promise<{ ticketId: string; ticketUrl: string }> {
    // Simulate API delay
    await this.delay(100);

    // Generate mock ticket ID
    const ticketId = `TKT-${this.ticketCounter++}`;
    const ticketUrl = `https://helpdesk.example.com/tickets/${ticketId}`;

    // Store mock ticket
    const ticket: HelpdeskTicket = {
      id: ticketId,
      url: ticketUrl,
      status: 'open',
      category: params.category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: params.description,
      callerPhone: params.callerNumber,
      notes: []
    };

    this.tickets.set(ticketId, ticket);

    console.log(`[MockHelpdeskClient] Created ticket: ${ticketId}`);
    console.log(`  Category: ${params.category}`);
    console.log(`  Escalation: ${params.escalationReason}`);
    console.log(`  Caller: ${params.callerNumber || 'N/A'}`);

    return { ticketId, ticketUrl };
  }

  async appendNote(params: {
    ticketId: string;
    note: string;
    author?: string;
  }): Promise<{ success: boolean; message: string }> {
    // Simulate API delay
    await this.delay(50);

    const ticket = this.tickets.get(params.ticketId);

    if (!ticket) {
      throw new HelpdeskError(`Ticket ${params.ticketId} not found`, 404);
    }

    // Add note to mock ticket
    const note: HelpdeskNote = {
      id: `NOTE-${Date.now()}`,
      content: params.note,
      createdAt: new Date().toISOString(),
      author: params.author || 'ISPN-Agent'
    };

    ticket.notes = ticket.notes || [];
    ticket.notes.push(note);
    ticket.updatedAt = new Date().toISOString();

    console.log(`[MockHelpdeskClient] Appended note to ticket: ${params.ticketId}`);
    console.log(`  Note length: ${params.note.length} chars`);

    return {
      success: true,
      message: `Note appended to ticket ${params.ticketId}`
    };
  }

  async getTicket(ticketId: string): Promise<HelpdeskTicket> {
    await this.delay(50);

    const ticket = this.tickets.get(ticketId);

    if (!ticket) {
      throw new HelpdeskError(`Ticket ${ticketId} not found`, 404);
    }

    return ticket;
  }

  async healthCheck(): Promise<boolean> {
    // Mock always returns healthy
    await this.delay(10);
    return true;
  }

  /**
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get all tickets (for testing/debugging)
   */
  getAllTickets(): Map<string, HelpdeskTicket> {
    return new Map(this.tickets);
  }

  /**
   * Clear all tickets (for testing)
   */
  clearAllTickets(): void {
    this.tickets.clear();
    this.ticketCounter = 1000;
  }
}

/**
 * TODO: Real Helpdesk Client Implementation
 *
 * Replace MockHelpdeskClient with your actual helpdesk API client.
 *
 * Example structure for real implementation:
 *
 * ```typescript
 * export class RealHelpdeskClient implements IHelpdeskClient {
 *   private apiUrl: string;
 *   private apiKey: string;
 *
 *   constructor() {
 *     this.apiUrl = process.env.HELPDESK_API_URL!;
 *     this.apiKey = process.env.HELPDESK_API_KEY!;
 *   }
 *
 *   async createTicket(params): Promise<{ ticketId: string; ticketUrl: string }> {
 *     try {
 *       const response = await fetch(`${this.apiUrl}/tickets`, {
 *         method: 'POST',
 *         headers: {
 *           'Authorization': `Bearer ${this.apiKey}`,
 *           'Content-Type': 'application/json'
 *         },
 *         body: JSON.stringify({
 *           subject: `${params.category} - ${params.escalationReason}`,
 *           description: params.description,
 *           category: params.category,
 *           // Map to your helpdesk API's field names
 *         })
 *       });
 *
 *       if (!response.ok) {
 *         throw new HelpdeskError(`API error: ${response.statusText}`, response.status);
 *       }
 *
 *       const data = await response.json();
 *       return {
 *         ticketId: data.id,
 *         ticketUrl: data.url
 *       };
 *     } catch (error) {
 *       throw new HelpdeskError(`Failed to create ticket: ${error.message}`);
 *     }
 *   }
 *
 *   async appendNote(params): Promise<{ success: boolean; message: string }> {
 *     // Similar implementation for your API
 *   }
 *
 *   async healthCheck(): Promise<boolean> {
 *     try {
 *       const response = await fetch(`${this.apiUrl}/health`);
 *       return response.ok;
 *     } catch {
 *       return false;
 *     }
 *   }
 * }
 * ```
 */

/**
 * Singleton instance
 *
 * In production, replace with:
 * export const helpdeskClient = new RealHelpdeskClient();
 */
export const helpdeskClient: IHelpdeskClient = new MockHelpdeskClient();
