/**
 * MCP Tool: ispn_analytics_escalation_metrics
 *
 * Analyzes escalation performance metrics including resolution times,
 * repeat customers, and chronic issue identification.
 */

import { z } from 'zod';
import { createISPNClient } from '../services/ispn-client.js';
import { logger } from '../utils/logger.js';
import {
  calculateResolutionTime,
  groupEscalationsByCustomer,
  calculateStats,
  categorizeResolutionTime,
  percentage,
  type Escalation
} from '../utils/analytics-helpers.js';

const inputSchema = z.object({
  begin: z.string().describe('Begin date (YYYY-MM-DD)'),
  end: z.string().optional().describe('End date (YYYY-MM-DD, defaults to today)'),
  status: z.enum(['0', '1']).optional().describe('Filter by status: 0=closed, 1=open (optional)'),
  min_escalations_per_customer: z.number().optional().describe('Minimum escalations to flag as repeat customer (default: 2)')
});

export const escalationMetricsAnalyticsTool = {
  definition: {
    name: 'ispn_analytics_escalation_metrics',
    description: 'Analyze escalation performance metrics. Shows resolution times, repeat customers with chronic issues, slowest resolutions, and escalation patterns. Use for SLA monitoring and identifying problem accounts.',
    inputSchema: {
      type: 'object',
      properties: {
        begin: {
          type: 'string',
          description: 'Begin date (YYYY-MM-DD format, e.g., "2025-01-01")'
        },
        end: {
          type: 'string',
          description: 'End date (YYYY-MM-DD format, optional, defaults to today)'
        },
        status: {
          type: 'string',
          enum: ['0', '1'],
          description: 'Filter by status: "0" = closed only, "1" = open only (optional, omit for both)'
        },
        min_escalations_per_customer: {
          type: 'number',
          description: 'Minimum escalations to flag as repeat customer (default: 2)'
        }
      },
      required: ['begin']
    }
  },

  async handler(args: unknown) {
    try {
      const input = inputSchema.parse(args);

      // Initialize client
      const apiUrl = process.env.ISPN_API_URL;
      const authCode = process.env.ISPN_AUTH_CODE;

      if (!apiUrl || !authCode) {
        throw new Error('ISPN_API_URL and ISPN_AUTH_CODE must be set');
      }

      const client = createISPNClient();

      // Default values
      const endDate = input.end || new Date().toISOString().split('T')[0];
      const minEscalations = input.min_escalations_per_customer || 2;

      logger.info({ begin: input.begin, end: endDate, status: input.status }, 'Analyzing escalation metrics');

      // Fetch escalations
      const escalations = await client.listEscalationsByDateRange(input.begin, endDate, input.status);

      if (!escalations || escalations.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              period: `${input.begin} to ${endDate}`,
              total_escalations: 0,
              message: 'No escalations found in this date range'
            }, null, 2)
          }]
        };
      }

      // Calculate resolution times for closed escalations
      const resolutionTimes: number[] = [];
      const closedEscalations = escalations.filter(esc => {
        const hours = calculateResolutionTime(esc);
        if (hours !== null) {
          resolutionTimes.push(hours);
          return true;
        }
        return false;
      });

      const openEscalations = escalations.filter(esc => calculateResolutionTime(esc) === null);

      // Calculate statistics
      const stats = resolutionTimes.length > 0 ? calculateStats(resolutionTimes) : null;

      // Categorize resolution times
      const resolutionDistribution: Record<string, number> = {
        '< 4 hours': 0,
        '4-8 hours': 0,
        '8-24 hours': 0,
        '> 24 hours': 0
      };

      resolutionTimes.forEach(hours => {
        const category = categorizeResolutionTime(hours);
        resolutionDistribution[category]++;
      });

      // Group by customer
      const byCustomer = groupEscalationsByCustomer(escalations);

      // Find repeat customers (>= minEscalations)
      const repeatCustomers = Object.entries(byCustomer)
        .filter(([_, escs]) => escs.length >= minEscalations)
        .map(([billid, escs]) => {
          // Find most common issue (from summary)
          const summaries = escs.map(e => e.summary || '').filter(s => s.length > 0);
          const commonIssue = summaries.length > 0 ? summaries[0] : 'Unknown'; // Simplified

          // Find latest escalation
          const latest = escs.reduce((max, esc) =>
            new Date(esc.entrytime) > new Date(max.entrytime) ? esc : max
          );

          return {
            billid,
            escalation_count: escs.length,
            last_escalation: latest.entrytime.split(' ')[0], // Date only
            last_escalation_id: latest.escalid,
            common_issue: commonIssue.substring(0, 100) // Truncate
          };
        })
        .sort((a, b) => b.escalation_count - a.escalation_count)
        .slice(0, 10); // Top 10

      // Find slowest resolutions
      const slowestResolutions = closedEscalations
        .map(esc => ({
          escalid: esc.escalid,
          billid: esc.billid,
          ticketid: esc.ticketid,
          hours: calculateResolutionTime(esc)!,
          issue: (esc.summary || 'Unknown').substring(0, 100)
        }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 10); // Top 10 slowest

      const result = {
        success: true,
        period: `${input.begin} to ${endDate}`,
        total_escalations: escalations.length,
        open: openEscalations.length,
        closed: closedEscalations.length,
        avg_resolution_time_hours: stats?.mean || null,
        median_resolution_time_hours: stats?.median || null,
        min_resolution_time_hours: stats?.min || null,
        max_resolution_time_hours: stats?.max || null,
        resolution_time_distribution: resolutionDistribution,
        repeat_customers: repeatCustomers,
        slowest_resolutions: slowestResolutions,
        summary: {
          escalation_rate: percentage(escalations.length, escalations.length), // Would need total tickets for true rate
          avg_resolution: stats ? `${stats.mean.toFixed(1)} hours` : 'N/A',
          repeat_customer_count: repeatCustomers.length,
          longest_resolution: slowestResolutions[0]?.hours ? `${slowestResolutions[0].hours.toFixed(1)} hours` : 'N/A'
        }
      };

      logger.info({
        totalEscalations: escalations.length,
        repeatCustomers: repeatCustomers.length,
        avgResolution: stats?.mean
      }, 'Escalation metrics analysis complete');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'Escalation metrics analysis failed');

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
