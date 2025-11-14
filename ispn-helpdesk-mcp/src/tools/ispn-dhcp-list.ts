/**
 * MCP Tool: ispn.dhcp.list
 *
 * List DHCP reservations by customer or IP pool.
 */

import { z } from 'zod';
import { createISPNClient } from '../services/ispn-client.js';
import { logger } from '../utils/logger.js';

const inputSchema = z.object({
  billid: z.string().optional().describe('Filter by customer billing ID'),
  pool: z.string().optional().describe('Filter by DHCP pool name'),
  poolstatus: z.string().optional().describe('Filter by pool status'),
  limit: z.number().int().positive().optional().describe('Maximum number of results'),
  ip: z.string().optional().describe('Filter by specific IP address'),
});

export const dhcpListTool = {
  definition: {
    name: 'ispn.dhcp.list',
    description: 'List DHCP reservations. Can filter by customer, pool, status, or IP address. Used for network diagnostics and IP management.',
    inputSchema: {
      type: 'object',
      properties: {
        billid: {
          type: 'string',
          description: 'Filter by customer billing ID (optional)'
        },
        pool: {
          type: 'string',
          description: 'Filter by DHCP pool name (optional)'
        },
        poolstatus: {
          type: 'string',
          description: 'Filter by pool status (optional)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (optional)'
        },
        ip: {
          type: 'string',
          description: 'Filter by specific IP address (optional)'
        }
      }
    }
  },

  async handler(args: unknown) {
    try {
      const input = inputSchema.parse(args);
      const client = createISPNClient();

      logger.info({ filters: input }, 'Listing DHCP reservations');

      const dhcpEntries = await client.listDHCP({
        billid: input.billid,
        pool: input.pool,
        poolstatus: input.poolstatus,
        limit: input.limit,
        ip: input.ip
      });

      const result = {
        success: true,
        count: dhcpEntries.length,
        filters: {
          billid: input.billid || 'none',
          pool: input.pool || 'none',
          poolstatus: input.poolstatus || 'none',
          limit: input.limit || 'none',
          ip: input.ip || 'none'
        },
        dhcp_reservations: dhcpEntries
      };

      logger.info({ count: dhcpEntries.length }, 'DHCP reservations listed');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'List DHCP failed');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message
          }, null, 2)
        }],
        isError: true
      };
    }
  }
};
