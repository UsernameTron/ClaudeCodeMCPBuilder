/**
 * MCP Tool: ispn.query.list_categories
 *
 * List available ticket categories and services from ISPN.
 */

import { z } from 'zod';
import { getCategoryMapper } from '../services/category-mapper.js';
import { logger } from '../utils/logger.js';

const inputSchema = z.object({
  refresh: z.boolean().optional().describe('Force refresh cache (default: false)'),
});

export const queryCategoryTool = {
  definition: {
    name: 'ispn.query.list_categories',
    description: 'List all available ticket categories and services from ISPN Helpdesk. Returns category IDs and names for ticket creation.',
    inputSchema: {
      type: 'object',
      properties: {
        refresh: {
          type: 'boolean',
          description: 'Force refresh cache (default: false)'
        }
      }
    }
  },

  async handler(args: unknown) {
    try {
      const input = inputSchema.parse(args);

      // Initialize category mapper
      const apiUrl = process.env.ISPN_API_URL;
      const authCode = process.env.ISPN_AUTH_CODE;

      if (!apiUrl || !authCode) {
        throw new Error('ISPN_API_URL and ISPN_AUTH_CODE must be set in environment');
      }

      const mapper = getCategoryMapper(apiUrl, authCode);

      // Clear cache if refresh requested
      if (input.refresh) {
        mapper.clearCache();
        logger.info('Category cache cleared');
      }

      logger.info('Fetching categories and services');

      // Fetch both categories and services
      const [categories, services] = await Promise.all([
        mapper.getCategories(),
        mapper.getServices()
      ]);

      const result = {
        success: true,
        metadata: {
          categories_count: categories.length,
          services_count: services.length,
          cached: !input.refresh
        },
        services: services,
        categories: categories
      };

      logger.info({
        categories: categories.length,
        services: services.length
      }, 'Categories and services retrieved');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'List categories failed');

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
