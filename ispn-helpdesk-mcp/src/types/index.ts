/**
 * TypeScript Type Definitions for ISPN Helpdesk MCP Server
 *
 * Core enums and interfaces that define the data structures used
 * throughout the application for ticket management and agent handoffs.
 */

/**
 * Category - Primary classification of the support issue
 *
 * Used to route tickets to appropriate support teams and apply
 * category-specific handling logic.
 */
export enum Category {
  /** Service outage or connectivity loss */
  Outage = 'Outage',
  /** Wireless networking issues */
  WiFi = 'WiFi',
  /** Carrier-Grade NAT related issues */
  CGNAT = 'CGNAT',
  /** Physical wiring or infrastructure problems */
  Wiring = 'Wiring',
  /** Equipment return or replacement requests */
  EquipmentReturn = 'EquipmentReturn',
  /** Unable to categorize or requires human assessment */
  Unknown = 'Unknown'
}

/**
 * EscalationReason - Why the ticket requires escalation
 *
 * Tracks the business reason for escalating beyond automated handling,
 * enabling reporting and process improvement.
 */
export enum EscalationReason {
  /** Customer explicitly requested agent assistance */
  CallerRequested = 'CallerRequested',
  /** Issue not resolved after two troubleshooting attempts */
  TwoStepsNoResolve = 'TwoStepsNoResolve',
  /** Issue is outside automation capability scope */
  OutOfScope = 'OutOfScope',
  /** Safety or physical risk identified */
  SafetyRisk = 'SafetyRisk',
  /** Billing, account, or payment related */
  BillingOrAccount = 'BillingOrAccount',
  /** Other reason not captured above */
  Other = 'Other'
}

/**
 * Source - Originating system for the handoff
 *
 * Identifies which automated agent initiated the handoff,
 * enabling source-specific handling and reporting.
 */
export enum Source {
  /** ATOM automated troubleshooting system */
  ATOM = 'ATOM',
  /** Outage-specific agent system */
  OutageAgent = 'OutageAgent',
  /** Other or unspecified source */
  Other = 'Other'
}

/**
 * IngestPayload - Request body for agent handoff
 *
 * Represents the data structure sent by ElevenLabs agents or
 * external systems when handing off to human support.
 */
export interface IngestPayload {
  /** 4-line formatted note (≤350 chars total) describing the interaction */
  note: string;

  /** Primary issue category (optional, will be inferred if not provided) */
  category?: Category;

  /** Reason for escalation (optional, will be inferred if not provided) */
  escalationReason?: EscalationReason;

  /** AI confidence level as string "0.0" to "1.0" (optional) */
  confidence?: string;

  /** Customer phone number in E.164 format (e.g., +12345678900) */
  callerNumber?: string;

  /** Outage Agent key for deduplication and ticket lookup */
  oaKey?: string;

  /** Source system identifier (optional, defaults to 'Other') */
  source?: Source;
}

/**
 * TicketResponse - Successful handoff response
 *
 * Standardized response returned to calling systems after successful
 * ticket creation or note append operation.
 */
export interface TicketResponse {
  /** Always 'ok' for successful responses */
  status: 'ok';

  /** True if new ticket created, false if note appended to existing */
  created: boolean;

  /** Helpdesk ticket identifier (e.g., "TKT-12345") */
  ticketId: string;

  /** Full URL to view ticket in helpdesk system */
  ticketUrl: string;

  /** Final category applied (after inference if needed) */
  category: string;

  /** Final escalation reason applied (after inference if needed) */
  escalationReason: string;

  /** Confidence value used (defaults to "0.0" if not provided) */
  confidence: string;

  /** Echo back identifiers for caller verification */
  echo: {
    oaKey?: string;
    callerNumber?: string;
  };
}

/**
 * TicketEntry - Internal ticket store record
 *
 * Used by ticket-store.ts for deduplication and lookup within
 * the 4-hour time window.
 */
export interface TicketEntry {
  ticketId: string;
  ticketUrl: string;
  timestamp: number;
  oaKey?: string;
  callerNumber?: string;
  category?: string;
}

/**
 * IdempotencyEntry - Internal idempotency cache record
 *
 * Used by idempotency-store.ts to detect and prevent duplicate
 * request processing within the 15-minute window.
 */
export interface IdempotencyEntry {
  response: any;
  timestamp: number;
  payloadHash: string;
  statusCode?: number;
}

/**
 * HelpdeskTicket - Helpdesk API ticket structure
 *
 * Represents a ticket in the helpdesk system. This is a placeholder
 * structure that should be updated based on your actual helpdesk API.
 */
export interface HelpdeskTicket {
  id: string;
  url: string;
  status: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  callerPhone?: string;
  notes?: HelpdeskNote[];
}

/**
 * HelpdeskNote - Note/comment on a helpdesk ticket
 *
 * Represents a note or comment added to a ticket.
 */
export interface HelpdeskNote {
  id: string;
  content: string;
  createdAt: string;
  author: string;
}

/**
 * CreateTicketParams - Parameters for creating a new ticket
 *
 * Used by helpdesk-client.ts when creating tickets via API.
 */
export interface CreateTicketParams {
  description: string;
  category: Category;
  escalationReason: EscalationReason;
  callerNumber?: string;
  source?: Source;
  metadata?: Record<string, any>;
}

/**
 * AppendNoteParams - Parameters for appending a note to existing ticket
 *
 * Used by helpdesk-client.ts when adding notes via API.
 */
export interface AppendNoteParams {
  ticketId: string;
  note: string;
  author?: string;
}
