/**
 * MCP Tool: ispn.account.check
 *
 * Verify if username or email exists in ISPN Helpdesk.
 */

import { z } from 'zod';
import { createISPNClient } from '../services/ispn-client.js';
import { logger } from '../utils/logger.js';

const inputSchema = z.object({
  username: z.string().optional().describe('Username to check'),
  email: z.string().email().optional().describe('Email address to check'),
}).refine(
  data => data.username || data.email,
  { message: 'Must provide either username or email' }
);

export const accountCheckTool = {
  definition: {
    name: 'ispn_account_check',
    description: 'Check if a username or email address exists in ISPN Helpdesk. Returns existence status and account type.',
    inputSchema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'Username to check (e.g., "jdoe")'
        },
        email: {
          type: 'string',
          description: 'Email address to check (e.g., "jdoe@example.com")'
        }
      }
    }
  },

  async handler(args: unknown) {
    try {
      const input = inputSchema.parse(args);
      const client = createISPNClient();

      let result: any = {
        success: true
      };

      // Check username
      if (input.username) {
        logger.info({ username: input.username }, 'Checking username');

        const usernameCheck = await client.checkUsername(input.username);

        result.username = {
          value: input.username,
          exists: usernameCheck.exists,
          type: usernameCheck.type,
          message: usernameCheck.message
        };
      }

      // Check email
      if (input.email) {
        logger.info({ email: input.email }, 'Checking email');

        const emailCheck = await client.checkMailbox(input.email);

        result.email = {
          value: input.email,
          exists: emailCheck.exists,
          billid: emailCheck.billid,
          status: emailCheck.status,
          message: emailCheck.message
        };
      }

      logger.info('Account check completed');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'Account check failed');

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
