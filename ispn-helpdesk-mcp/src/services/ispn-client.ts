/**
 * ISPN Helpdesk Client - Read-Only Query Interface
 *
 * Provides read-only access to ISPN Helpdesk API for Claude Desktop.
 * All methods query existing data without modifying anything.
 */

import { parseISPNResponse, parseXMLResponse, parseTextResponse, isXMLResponse } from '../utils/ispn-parser.js';
import { normalizePhoneForISPN } from '../utils/phone-normalizer.js';
import { logger } from '../utils/logger.js';
import { HelpdeskError } from '../errors/custom-errors.js';

export interface ISPNClientConfig {
  apiUrl: string;
  authCode: string;
}

export interface CustomerInfo {
  billid: string;
  fname?: string;
  lname?: string;
  cmpny?: string;
  hphone?: string;
  wphone?: string;
  mphone?: string;
  addr1?: string;
  addr2?: string;
  cty?: string;
  ste?: string;
  zip?: string;
  email?: string;
  [key: string]: any;
}

export interface TicketInfo {
  ticketid: string;
  parentid?: string;
  entrytime?: string;
  description?: string;
  categories?: {
    service?: string;
    category?: string;
  };
  [key: string]: any;
}

export interface EscalationInfo {
  escalid: string;
  ticketid?: string;
  status?: string;
  billid?: string;
  entrytime?: string;
  summary?: string;
  detail?: string;
  closetime?: string;
  closenotes?: string;
  [key: string]: any;
}

/**
 * ISPN Helpdesk Client - Read-Only Operations
 */
export class ISPNClient {
  private apiUrl: string;
  private authCode: string;

  constructor(config: ISPNClientConfig) {
    this.apiUrl = config.apiUrl;
    this.authCode = config.authCode;
  }

  /**
   * Execute ISPN API command
   */
  private async executeCommand(cmd: string, params: Record<string, string> = {}): Promise<string> {
    const url = new URL(this.apiUrl);
    url.searchParams.set('auth', this.authCode);
    url.searchParams.set('cmd', cmd);

    // Add additional parameters
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    }

    logger.info({ cmd, params }, 'Executing ISPN command');

    try {
      const response = await fetch(url.toString());
      const text = await response.text();

      if (!response.ok) {
        throw new HelpdeskError(
          `ISPN API error: ${response.statusText}`,
          response.status
        );
      }

      logger.debug({ cmd, responseLength: text.length }, 'ISPN command completed');

      // Check for error in text response
      if (!isXMLResponse(text)) {
        const parsed = parseTextResponse(text);
        if (!parsed.success) {
          throw new HelpdeskError(`ISPN API error: ${parsed.message}`, 400);
        }
      }

      return text;
    } catch (error: any) {
      logger.error({ cmd, error: error.message }, 'ISPN command failed');
      throw error;
    }
  }

  // ============================================================
  // CUSTOMER QUERY METHODS
  // ============================================================

  /**
   * Get customer details by billing ID
   */
  async getCustomerByBillId(billid: string): Promise<CustomerInfo | null> {
    const response = await this.executeCommand('list', { billid });

    if (response.includes('Nothing Found')) {
      return null;
    }

    const parsed = parseXMLResponse(response);

    // Extract customer object (may be nested)
    const customer = parsed.customer || parsed;

    return customer;
  }

  /**
   * List all customers (use with caution - may be large)
   */
  async listAllCustomers(limit?: number): Promise<CustomerInfo[]> {
    const response = await this.executeCommand('list');

    if (response.includes('Nothing Found')) {
      return [];
    }

    const parsed = parseXMLResponse(response);

    let customers = parsed.customers || [];

    if (!Array.isArray(customers)) {
      customers = [customers];
    }

    if (limit && customers.length > limit) {
      customers = customers.slice(0, limit);
    }

    return customers;
  }

  /**
   * Check if username exists
   */
  async checkUsername(username: string): Promise<{
    exists: boolean;
    type?: string;
    message: string;
  }> {
    try {
      const response = await this.executeCommand('usercheck', { user: username });
      const parsed = parseTextResponse(response);

      if (parsed.success) {
        // Extract type from message: "1; User Exists; EMAIL"
        const type = parsed.message.split(';').pop()?.trim();
        return {
          exists: true,
          type,
          message: parsed.message
        };
      }

      return {
        exists: false,
        message: 'User Not Found'
      };
    } catch (error: any) {
      return {
        exists: false,
        message: error.message
      };
    }
  }

  /**
   * Check if mailbox/email exists
   */
  async checkMailbox(email: string): Promise<{
    exists: boolean;
    billid?: string;
    status?: string;
    message: string;
  }> {
    try {
      const response = await this.executeCommand('mboxcheck', { email });
      const parsed = parseTextResponse(response);

      if (parsed.success) {
        // Parse: "1; User Exists; EMAIL (Qualified); Bill ID [999]; Status [active]"
        const message = parsed.message;
        const billidMatch = message.match(/Bill ID \[?(\w+)\]?/i);
        const statusMatch = message.match(/Status \[?(\w+)\]?/i);

        return {
          exists: true,
          billid: billidMatch ? billidMatch[1] : undefined,
          status: statusMatch ? statusMatch[1] : undefined,
          message
        };
      }

      return {
        exists: false,
        message: 'Email Not Found'
      };
    } catch (error: any) {
      return {
        exists: false,
        message: error.message
      };
    }
  }

  /**
   * List customer phones
   */
  async listCustomerPhones(billid: string, phone?: string): Promise<any[]> {
    const params: Record<string, string> = { billid };

    if (phone) {
      params.phone = normalizePhoneForISPN(phone);
    }

    const response = await this.executeCommand('listphone', params);

    if (response.includes('Nothing Found')) {
      return [];
    }

    const parsed = parseXMLResponse(response);

    let phones = parsed.phones || [];

    if (!Array.isArray(phones)) {
      phones = [phones];
    }

    return phones;
  }

  /**
   * List customer contacts
   */
  async listCustomerContacts(billid: string): Promise<any[]> {
    const response = await this.executeCommand('listcontacts', { billid });

    if (response.includes('Nothing Found')) {
      return [];
    }

    const parsed = parseXMLResponse(response);

    let contacts = parsed.contacts || parsed.contact || [];

    if (!Array.isArray(contacts)) {
      contacts = [contacts];
    }

    return contacts;
  }

  /**
   * List customer notes
   */
  async listCustomerNotes(billid: string): Promise<any[]> {
    const response = await this.executeCommand('listnotes', { billid });

    if (response.includes('Nothing Found')) {
      return [];
    }

    const parsed = parseXMLResponse(response);

    let notes = parsed.notes || parsed.note || [];

    if (!Array.isArray(notes)) {
      notes = [notes];
    }

    return notes;
  }

  // ============================================================
  // TICKET QUERY METHODS
  // ============================================================

  /**
   * List tickets by customer (billid)
   */
  async listTicketsByCustomer(billid: string, limit?: number, ticketid?: string): Promise<TicketInfo[]> {
    const params: Record<string, string> = { billid };

    if (limit) {
      params.limit = limit.toString();
    }

    if (ticketid) {
      params.ticketid = ticketid;
    }

    const response = await this.executeCommand('listtix', params);

    if (response.includes('Nothing Found')) {
      return [];
    }

    const parsed = parseXMLResponse(response);

    let tickets = parsed.tickets || parsed.ticket || [];

    if (!Array.isArray(tickets)) {
      tickets = [tickets];
    }

    return tickets;
  }

  /**
   * List all tickets in date range
   */
  async listTicketsByDateRange(begin: string, end: string, hour?: boolean): Promise<TicketInfo[]> {
    const params: Record<string, string> = { begin, end };

    if (hour) {
      params.hour = '1';
    }

    const response = await this.executeCommand('listtixall', params);

    if (response.includes('Nothing Found')) {
      return [];
    }

    const parsed = parseXMLResponse(response);

    let tickets = parsed.tickets || parsed.ticket || [];

    if (!Array.isArray(tickets)) {
      tickets = [tickets];
    }

    return tickets;
  }

  /**
   * List escalations by date range
   */
  async listEscalationsByDateRange(
    begin: string,
    end: string,
    status?: '0' | '1', // 0 = closed, 1 = open, undefined = both
    hour?: boolean
  ): Promise<EscalationInfo[]> {
    const params: Record<string, string> = { begin, end };

    if (status) {
      params.status = status;
    }

    if (hour) {
      params.hour = '1';
    }

    const response = await this.executeCommand('listescalall', params);

    if (response.includes('Nothing Found')) {
      return [];
    }

    const parsed = parseXMLResponse(response);

    let escalations = parsed.escalations || parsed.escalation || [];

    if (!Array.isArray(escalations)) {
      escalations = [escalations];
    }

    return escalations;
  }

  /**
   * Get escalation by ID
   */
  async getEscalationById(escid: string): Promise<EscalationInfo | null> {
    try {
      const response = await this.executeCommand('listescal', { escid });

      if (response.includes('Nothing Found')) {
        return null;
      }

      const parsed = parseXMLResponse(response);
      return parsed.escalation || parsed;
    } catch (error: any) {
      if (error.message.includes('Nothing Found')) {
        return null;
      }
      throw error;
    }
  }

  // ============================================================
  // NETWORK/DHCP QUERY METHODS
  // ============================================================

  /**
   * List DHCP reservations
   */
  async listDHCP(params?: {
    billid?: string;
    pool?: string;
    poolstatus?: string;
    limit?: number;
    ip?: string;
  }): Promise<any[]> {
    const cmdParams: Record<string, string> = {};

    if (params?.billid) cmdParams.billid = params.billid;
    if (params?.pool) cmdParams.pool = params.pool;
    if (params?.poolstatus) cmdParams.poolstatus = params.poolstatus;
    if (params?.limit) cmdParams.limit = params.limit.toString();
    if (params?.ip) cmdParams.ip = params.ip;

    const response = await this.executeCommand('listdhcp', cmdParams);

    if (response.includes('Nothing Found')) {
      return [];
    }

    const parsed = parseXMLResponse(response);

    let dhcp = parsed.dhcps || parsed.dhcp || [];

    if (!Array.isArray(dhcp)) {
      dhcp = [dhcp];
    }

    return dhcp;
  }

  // ============================================================
  // HEALTH CHECK
  // ============================================================

  /**
   * Health check - verify API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use listsupportsvc as a lightweight health check
      await this.executeCommand('listsupportsvc');
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create ISPN client instance from environment variables
 */
export function createISPNClient(): ISPNClient {
  const apiUrl = process.env.ISPN_API_URL;
  const authCode = process.env.ISPN_AUTH_CODE;

  if (!apiUrl || !authCode) {
    throw new Error(
      'ISPN client configuration missing. Set ISPN_API_URL and ISPN_AUTH_CODE environment variables.'
    );
  }

  return new ISPNClient({ apiUrl, authCode });
}
