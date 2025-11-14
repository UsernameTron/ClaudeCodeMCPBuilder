/**
 * MCP Tool: ispn_analytics_ticket_volume
 *
 * Analyzes ticket volume trends by date range, service, and category.
 * Provides daily/weekly/monthly aggregations with trend analysis.
 */

import { z } from 'zod';
import { createISPNClient } from '../services/ispn-client.js';
import { getCategoryMapper } from '../services/category-mapper.js';
import { logger } from '../utils/logger.js';
import {
  groupTicketsByDate,
  groupTicketsByService,
  groupTicketsByCategory,
  calculateTrend,
  topN,
  percentage,
  getDaysBetween,
  type Ticket
} from '../utils/analytics-helpers.js';

const inputSchema = z.object({
  begin: z.string().describe('Begin date (YYYY-MM-DD)'),
  end: z.string().optional().describe('End date (YYYY-MM-DD, defaults to today)'),
  granularity: z.enum(['daily', 'weekly', 'monthly']).optional().describe('Aggregation level (default: daily)')
});

export const ticketVolumeAnalyticsTool = {
  definition: {
    name: 'ispn_analytics_ticket_volume',
    description: 'Analyze ticket volume trends over time. Shows total tickets, breakdown by service/category, daily averages, trends, and peak periods. Use for capacity planning and identifying volume spikes.',
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
        granularity: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly'],
          description: 'How to group the data: daily, weekly, or monthly (default: daily)'
        }
      },
      required: ['begin']
    }
  },

  async handler(args: unknown) {
    try {
      const input = inputSchema.parse(args);

      // Initialize clients
      const apiUrl = process.env.ISPN_API_URL;
      const authCode = process.env.ISPN_AUTH_CODE;

      if (!apiUrl || !authCode) {
        throw new Error('ISPN_API_URL and ISPN_AUTH_CODE must be set');
      }

      const client = createISPNClient();
      const categoryMapper = getCategoryMapper();

      // Default end date to today
      const endDate = input.end || new Date().toISOString().split('T')[0];
      const granularity = input.granularity || 'daily';

      logger.info({ begin: input.begin, end: endDate, granularity }, 'Analyzing ticket volume');

      // Fetch tickets for date range
      const tickets = await client.listTicketsByDateRange(input.begin, endDate);

      if (!tickets || tickets.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              period: `${input.begin} to ${endDate}`,
              total_tickets: 0,
              message: 'No tickets found in this date range'
            }, null, 2)
          }]
        };
      }

      // Fetch services for mapping
      const services = await categoryMapper.getServices();
      const categories = await categoryMapper.getCategories();

      // Calculate basic metrics
      const totalTickets = tickets.length;
      const dayCount = getDaysBetween(input.begin, endDate) || 1;
      const dailyAverage = parseFloat((totalTickets / dayCount).toFixed(1));

      // Group by date
      const byDate = groupTicketsByDate(tickets, granularity);
      const dateCounts = Object.entries(byDate)
        .map(([date, tickets]) => ({ date, count: tickets.length }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate trend (compare first half vs second half)
      const midpoint = Math.floor(dateCounts.length / 2);
      const firstHalf = dateCounts.slice(0, midpoint).reduce((sum, d) => sum + d.count, 0) / midpoint;
      const secondHalf = dateCounts.slice(midpoint).reduce((sum, d) => sum + d.count, 0) / (dateCounts.length - midpoint);
      const trend = calculateTrend(secondHalf, firstHalf);

      // Group by service
      const byService = groupTicketsByService(tickets);
      const serviceStats = Object.entries(byService).map(([service, tickets]) => {
        // Calculate service trend
        const serviceCounts = dateCounts.map(d =>
          byDate[d.date]?.filter(t => t.categories?.service === service).length || 0
        );
        const serviceMid = Math.floor(serviceCounts.length / 2);
        const serviceFirstHalf = serviceCounts.slice(0, serviceMid).reduce((sum, c) => sum + c, 0) / serviceMid;
        const serviceSecondHalf = serviceCounts.slice(serviceMid).reduce((sum, c) => sum + c, 0) / (serviceCounts.length - serviceMid);
        const serviceTrend = calculateTrend(serviceSecondHalf, serviceFirstHalf);

        return {
          service,
          count: tickets.length,
          percentage: percentage(tickets.length, totalTickets),
          trend: serviceTrend.direction,
          trend_percentage: serviceTrend.formatted
        };
      }).sort((a, b) => b.count - a.count);

      // Group by category
      const byCategory = groupTicketsByCategory(tickets);
      const categoryStats = topN(byCategory, 10).map(item => ({
        category: item.key,
        count: item.count,
        percentage: percentage(item.count, totalTickets)
      }));

      // Find peak days
      const peakDays = dateCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(d => ({ date: d.date, count: d.count }));

      const result = {
        success: true,
        period: `${input.begin} to ${endDate}`,
        granularity,
        total_tickets: totalTickets,
        days_analyzed: dayCount,
        daily_average: dailyAverage,
        trend: trend.direction,
        trend_percentage: trend.formatted,
        by_service: serviceStats,
        by_category: categoryStats,
        peak_periods: peakDays,
        timeline: dateCounts.length <= 31 ? dateCounts : undefined, // Include timeline for <= 31 data points
        summary: {
          most_active_service: serviceStats[0]?.service || 'None',
          most_common_category: categoryStats[0]?.category || 'None',
          busiest_day: peakDays[0]?.date || 'N/A'
        }
      };

      logger.info({
        totalTickets,
        services: serviceStats.length,
        categories: categoryStats.length
      }, 'Ticket volume analysis complete');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'Ticket volume analysis failed');

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
