/**
 * MCP Tool: ispn.customer.get_details
 *
 * Get full customer details including contact info, services, and metadata.
 */

import { z } from 'zod';
import { createISPNClient } from '../services/ispn-client.js';
import { logger } from '../utils/logger.js';

const inputSchema = z.object({
  billid: z.string().min(1).describe('Internal Billing ID'),
});

export const customerDetailsTool = {
  definition: {
    name: 'ispn_customer_get_details',
    description: 'Get full customer details including contact info, phones, and account information from ISPN Helpdesk. Requires billing ID.',
    inputSchema: {
      type: 'object',
      properties: {
        billid: {
          type: 'string',
          description: 'Internal Billing ID (e.g., "999")'
        }
      },
      required: ['billid']
    }
  },

  async handler(args: unknown) {
    try {
      const input = inputSchema.parse(args);
      const client = createISPNClient();

      logger.info({ billid: input.billid }, 'Getting customer details');

      // Get customer basic info
      const customer = await client.getCustomerByBillId(input.billid);

      if (!customer) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Customer not found: ${input.billid}`
            }, null, 2)
          }],
          isError: true
        };
      }

      // Get additional customer data
      const [phones, contacts, notes] = await Promise.all([
        client.listCustomerPhones(input.billid).catch(() => []),
        client.listCustomerContacts(input.billid).catch(() => []),
        client.listCustomerNotes(input.billid).catch(() => [])
      ]);

      const result = {
        success: true,
        customer: {
          ...customer,
          additional_phones: phones,
          authorized_contacts: contacts,
          notes: notes,
          metadata: {
            phones_count: phones.length,
            contacts_count: contacts.length,
            notes_count: notes.length
          }
        }
      };

      logger.info({ billid: input.billid }, 'Customer details retrieved');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'Get customer details failed');

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
