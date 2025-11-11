/**
 * Unit Tests: MCP Tools
 *
 * Comprehensive tests for all 5 MCP tools:
 * - helpdesk.create_ticket
 * - helpdesk.append_note
 * - helpdesk.find_or_create_ticket
 * - ingest.render_note
 * - ingest.oa_handoff
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTicketTool } from '../../src/tools/helpdesk-create-ticket';
import { appendNoteTool } from '../../src/tools/helpdesk-append-note';
import { findOrCreateTicketTool } from '../../src/tools/helpdesk-find-or-create-ticket';
import { renderNoteTool } from '../../src/tools/ingest-render-note';
import { oaHandoffTool } from '../../src/tools/ingest-oa-handoff';
import { helpdeskClient } from '../../src/services/helpdesk-client';
import { findOrCreateTicket } from '../../src/services/ticket-service';
import { renderNote } from '../../src/services/note-processor';

// Mock dependencies
vi.mock('../../src/services/helpdesk-client');
vi.mock('../../src/services/ticket-service');
vi.mock('../../src/services/note-processor');

describe('MCP Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('helpdesk.create_ticket', () => {
    it('should create ticket with valid input', async () => {
      const mockResult = {
        ticketId: 'TKT-1000',
        ticketUrl: 'https://helpdesk.example.com/tickets/1000'
      };

      vi.mocked(helpdeskClient.createTicket).mockResolvedValue(mockResult);

      const result = await createTicketTool.handler({
        description: 'Customer needs help with WiFi',
        category: 'WiFi',
        escalationReason: 'TwoStepsNoResolve'
      });

      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('TKT-1000');
      expect(result.isError).toBeUndefined();
    });

    it('should return error for invalid input (missing required fields)', async () => {
      const result = await createTicketTool.handler({
        description: 'Test'
        // Missing category and escalationReason
      });

      expect(result.content[0].text).toContain('"success": false');
      expect(result.isError).toBe(true);
    });

    it('should return error for invalid input (description too short)', async () => {
      const result = await createTicketTool.handler({
        description: 'Too short',
        category: 'WiFi',
        escalationReason: 'Other'
      });

      expect(result.content[0].text).toContain('"success": false');
      expect(result.isError).toBe(true);
    });

    it('should pass optional fields to helpdeskClient', async () => {
      const mockResult = {
        ticketId: 'TKT-1001',
        ticketUrl: 'https://helpdesk.example.com/tickets/1001'
      };

      vi.mocked(helpdeskClient.createTicket).mockResolvedValue(mockResult);

      await createTicketTool.handler({
        description: 'Customer needs help',
        category: 'Outage',
        escalationReason: 'CallerRequested',
        callerNumber: '+12345678900',
        source: 'ATOM',
        metadata: { priority: 'high' }
      });

      expect(helpdeskClient.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          callerNumber: '+12345678900',
          source: 'ATOM',
          metadata: { priority: 'high' }
        })
      );
    });
  });

  describe('helpdesk.append_note', () => {
    it('should append note to existing ticket', async () => {
      const mockResult = {
        success: true,
        message: 'Note appended successfully'
      };

      vi.mocked(helpdeskClient.appendNote).mockResolvedValue(mockResult);

      const result = await appendNoteTool.handler({
        ticketId: 'TKT-1000',
        note: 'Follow-up: Customer confirmed issue resolved'
      });

      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('TKT-1000');
      expect(result.isError).toBeUndefined();
    });

    it('should return error for invalid ticket ID', async () => {
      vi.mocked(helpdeskClient.appendNote).mockRejectedValue(
        new Error('Ticket not found')
      );

      const result = await appendNoteTool.handler({
        ticketId: 'INVALID',
        note: 'This should fail'
      });

      expect(result.content[0].text).toContain('"success": false');
      expect(result.isError).toBe(true);
    });

    it('should default author to "ISPN-Agent"', async () => {
      const mockResult = {
        success: true,
        message: 'Note appended'
      };

      vi.mocked(helpdeskClient.appendNote).mockResolvedValue(mockResult);

      await appendNoteTool.handler({
        ticketId: 'TKT-1000',
        note: 'Test note without author'
      });

      expect(helpdeskClient.appendNote).toHaveBeenCalledWith(
        expect.objectContaining({
          author: 'ISPN-Agent'
        })
      );
    });
  });

  describe('helpdesk.find_or_create_ticket', () => {
    it('should create new ticket when no existing ticket found', async () => {
      const mockResult = {
        ticketId: 'TKT-1002',
        ticketUrl: 'https://helpdesk.example.com/tickets/1002',
        created: true
      };

      vi.mocked(findOrCreateTicket).mockResolvedValue(mockResult);

      const result = await findOrCreateTicketTool.handler({
        description: 'New customer issue',
        category: 'WiFi',
        escalationReason: 'TwoStepsNoResolve',
        callerNumber: '+12345678900'
      });

      expect(result.content[0].text).toContain('"created": true');
      expect(result.content[0].text).toContain('New ticket created');
    });

    it('should find existing ticket by oaKey', async () => {
      const mockResult = {
        ticketId: 'TKT-1000',
        ticketUrl: 'https://helpdesk.example.com/tickets/1000',
        created: false
      };

      vi.mocked(findOrCreateTicket).mockResolvedValue(mockResult);

      const result = await findOrCreateTicketTool.handler({
        description: 'Duplicate issue',
        category: 'WiFi',
        escalationReason: 'TwoStepsNoResolve',
        oaKey: 'oa-12345'
      });

      expect(result.content[0].text).toContain('"created": false');
      expect(result.content[0].text).toContain('Existing ticket found');
    });

    it('should find existing ticket by caller+category', async () => {
      const mockResult = {
        ticketId: 'TKT-1001',
        ticketUrl: 'https://helpdesk.example.com/tickets/1001',
        created: false
      };

      vi.mocked(findOrCreateTicket).mockResolvedValue(mockResult);

      const result = await findOrCreateTicketTool.handler({
        description: 'Same caller, same issue',
        category: 'Outage',
        escalationReason: 'CallerRequested',
        callerNumber: '+12345678900'
      });

      expect(result.content[0].text).toContain('"created": false');
      expect(result.content[0].text).toContain('deduplication');
    });

    it('should return error for invalid input', async () => {
      const result = await findOrCreateTicketTool.handler({
        description: 'Short',
        category: 'WiFi'
        // Missing escalationReason
      });

      expect(result.content[0].text).toContain('"success": false');
      expect(result.isError).toBe(true);
    });
  });

  describe('ingest.render_note', () => {
    it('should render note with valid components', async () => {
      const mockNote = 'Category: WiFi\nReason: TwoStepsNoResolve\nSummary: Test\nConfidence: 0.85';

      vi.mocked(renderNote).mockReturnValue(mockNote);

      const result = await renderNoteTool.handler({
        category: 'WiFi',
        escalationReason: 'TwoStepsNoResolve',
        summary: 'Test summary',
        confidence: '0.85'
      });

      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('"lineCount": 4');
      expect(result.isError).toBeUndefined();
    });

    it('should return error for note exceeding 350 chars', async () => {
      vi.mocked(renderNote).mockImplementation(() => {
        throw new Error('Note exceeds 350 characters');
      });

      const result = await renderNoteTool.handler({
        category: 'WiFi',
        escalationReason: 'TwoStepsNoResolve',
        summary: 'A'.repeat(300), // Very long summary
        confidence: '0.85'
      });

      expect(result.content[0].text).toContain('"success": false');
      expect(result.isError).toBe(true);
    });

    it('should return error for invalid confidence format', async () => {
      const result = await renderNoteTool.handler({
        category: 'WiFi',
        escalationReason: 'TwoStepsNoResolve',
        summary: 'Valid summary',
        confidence: 'invalid' // Should be 0.0-1.0 format
      });

      expect(result.content[0].text).toContain('"success": false');
      expect(result.isError).toBe(true);
    });
  });

  describe('ingest.oa_handoff', () => {
    it('should complete handoff with valid input', async () => {
      const mockResult = {
        ticketId: 'TKT-1003',
        ticketUrl: 'https://helpdesk.example.com/tickets/1003',
        created: true
      };

      vi.mocked(findOrCreateTicket).mockResolvedValue(mockResult);

      const result = await oaHandoffTool.handler({
        note: 'Category: WiFi\nReason: TwoStepsNoResolve\nSummary: Test\nConfidence: 0.85',
        category: 'WiFi',
        escalationReason: 'TwoStepsNoResolve',
        confidence: '0.85',
        oaKey: 'oa-12345',
        source: 'OutageAgent'
      });

      expect(result.content[0].text).toContain('"success": true');
      expect(result.content[0].text).toContain('TKT-1003');
      expect(result.isError).toBeUndefined();
    });

    it('should handle missing optional fields with defaults', async () => {
      const mockResult = {
        ticketId: 'TKT-1004',
        ticketUrl: 'https://helpdesk.example.com/tickets/1004',
        created: true
      };

      vi.mocked(findOrCreateTicket).mockResolvedValue(mockResult);

      await oaHandoffTool.handler({
        note: 'Category: Unknown\nReason: Other\nSummary: Minimal\nConfidence: 0.0'
        // All optional fields omitted
      });

      expect(findOrCreateTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'Other', // Default from schema
          metadata: expect.objectContaining({
            confidence: '0.0' // Default from schema
          })
        })
      );
    });

    it('should return error for invalid note format', async () => {
      const result = await oaHandoffTool.handler({
        note: 'Too short',
        category: 'WiFi'
      });

      expect(result.content[0].text).toContain('"success": false');
      expect(result.isError).toBe(true);
    });

    it('should include echo fields in response', async () => {
      const mockResult = {
        ticketId: 'TKT-1005',
        ticketUrl: 'https://helpdesk.example.com/tickets/1005',
        created: false
      };

      vi.mocked(findOrCreateTicket).mockResolvedValue(mockResult);

      const result = await oaHandoffTool.handler({
        note: 'Category: Outage\nReason: CallerRequested\nSummary: Test\nConfidence: 0.9',
        category: 'Outage',
        escalationReason: 'CallerRequested',
        callerNumber: '+12345678900',
        oaKey: 'oa-99999'
      });

      expect(result.content[0].text).toContain('"oaKey": "oa-99999"');
      expect(result.content[0].text).toContain('"+12345678900"');
    });
  });

  describe('Tool Definitions', () => {
    it('should have valid tool names', () => {
      expect(createTicketTool.definition.name).toBe('helpdesk.create_ticket');
      expect(appendNoteTool.definition.name).toBe('helpdesk.append_note');
      expect(findOrCreateTicketTool.definition.name).toBe('helpdesk.find_or_create_ticket');
      expect(renderNoteTool.definition.name).toBe('ingest.render_note');
      expect(oaHandoffTool.definition.name).toBe('ingest.oa_handoff');
    });

    it('should have descriptions for all tools', () => {
      expect(createTicketTool.definition.description).toBeTruthy();
      expect(appendNoteTool.definition.description).toBeTruthy();
      expect(findOrCreateTicketTool.definition.description).toBeTruthy();
      expect(renderNoteTool.definition.description).toBeTruthy();
      expect(oaHandoffTool.definition.description).toBeTruthy();
    });

    it('should have inputSchema for all tools', () => {
      expect(createTicketTool.definition.inputSchema).toBeTruthy();
      expect(appendNoteTool.definition.inputSchema).toBeTruthy();
      expect(findOrCreateTicketTool.definition.inputSchema).toBeTruthy();
      expect(renderNoteTool.definition.inputSchema).toBeTruthy();
      expect(oaHandoffTool.definition.inputSchema).toBeTruthy();
    });
  });
});
