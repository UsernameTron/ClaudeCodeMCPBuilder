/**
 * MCP Tool: ispn.customer.lookup
 *
 * Look up customer by billing ID, phone number, or email address.
 * Returns customer information from ISPN Helpdesk.
 */

import { z } from 'zod';
import { createISPNClient } from '../services/ispn-client.js';
import { normalizePhoneForISPN } from '../utils/phone-normalizer.js';
import { logger } from '../utils/logger.js';

const inputSchema = z.object({
  billid: z.string().optional().describe('Internal Billing ID'),
  phone: z.string().optional().describe('Phone number (any format)'),
  email: z.string().email().optional().describe('Email address'),
}).refine(
  data => data.billid || data.phone || data.email,
  { message: 'Must provide at least one of: billid, phone, or email' }
);

export const customerLookupTool = {
  definition: {
    name: 'ispn.customer.lookup',
    description: 'Look up customer by billing ID, phone number, or email address. Returns customer information from ISPN Helpdesk.',
    inputSchema: {
      type: 'object',
      properties: {
        billid: {
          type: 'string',
          description: 'Internal Billing ID (e.g., "999")'
        },
        phone: {
          type: 'string',
          description: 'Phone number in any format (e.g., "+12345678900" or "123-456-7890")'
        },
        email: {
          type: 'string',
          description: 'Email address (e.g., "customer@example.com")'
        }
      }
    }
  },

  async handler(args: unknown) {
    try {
      const input = inputSchema.parse(args);
      const client = createISPNClient();

      let result: any = null;

      // Lookup by billid (direct)
      if (input.billid) {
        logger.info({ billid: input.billid }, 'Looking up customer by billid');
        result = await client.getCustomerByBillId(input.billid);

        if (!result) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Customer not found for billid: ${input.billid}`
              }, null, 2)
            }],
            isError: true
          };
        }
      }
      // Lookup by email (indirect via mailbox check)
      else if (input.email) {
        logger.info({ email: input.email }, 'Looking up customer by email');
        const mailboxCheck = await client.checkMailbox(input.email);

        if (!mailboxCheck.exists || !mailboxCheck.billid) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `No customer found for email: ${input.email}`
              }, null, 2)
            }],
            isError: true
          };
        }

        // Now get full customer details
        result = await client.getCustomerByBillId(mailboxCheck.billid);
        result.lookup_method = 'email';
        result.mailbox_status = mailboxCheck.status;
      }
      // Lookup by phone (indirect - search all customers)
      else if (input.phone) {
        const normalizedPhone = normalizePhoneForISPN(input.phone);
        logger.info({ phone: normalizedPhone }, 'Looking up customer by phone');

        // Unfortunately ISPN doesn't have a direct phone lookup
        // We need to list all customers and filter
        const allCustomers = await client.listAllCustomers();

        result = allCustomers.find(c =>
          c.hphone === normalizedPhone ||
          c.wphone === normalizedPhone ||
          c.mphone === normalizedPhone
        );

        if (!result) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `No customer found for phone: ${input.phone}`,
                note: 'Phone lookup searches all customers - may be slow for large databases'
              }, null, 2)
            }],
            isError: true
          };
        }

        result.lookup_method = 'phone';
      }

      logger.info({ billid: result.billid }, 'Customer found');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            customer: result
          }, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'Customer lookup failed');

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
