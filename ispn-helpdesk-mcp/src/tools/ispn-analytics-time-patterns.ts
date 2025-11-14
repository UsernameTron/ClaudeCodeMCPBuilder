/**
 * MCP Tool: ispn_analytics_time_patterns
 *
 * Analyzes ticket volume by time of day, day of week, and identifies
 * peak periods for staffing optimization.
 */

import { z } from 'zod';
import { createISPNClient } from '../services/ispn-client.js';
import { logger } from '../utils/logger.js';
import {
  groupTicketsByHour,
  groupTicketsByDayOfWeek,
  formatHour,
  type Ticket
} from '../utils/analytics-helpers.js';

const inputSchema = z.object({
  days_back: z.number().optional().describe('Number of days to analyze (default: 30)')
});

export const timePatternsAnalyticsTool = {
  definition: {
    name: 'ispn_analytics_time_patterns',
    description: 'Analyze ticket volume patterns by time of day and day of week. Identifies peak periods and provides data-driven staffing recommendations. Use for workforce scheduling and capacity planning.',
    inputSchema: {
      type: 'object',
      properties: {
        days_back: {
          type: 'number',
          description: 'Number of days to analyze (default: 30 for monthly patterns)'
        }
      }
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

      const daysBack = input.days_back || 30;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysBack);

      const beginStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      logger.info({ daysBack, begin: beginStr, end: endStr }, 'Analyzing time patterns');

      // Fetch tickets
      const tickets = await client.listTicketsByDateRange(beginStr, endStr);

      if (!tickets || tickets.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              period: `last ${daysBack} days`,
              message: 'No tickets found for time pattern analysis'
            }, null, 2)
          }]
        };
      }

      // Group by hour of day
      const byHour = groupTicketsByHour(tickets);
      const hourlyDistribution = Object.entries(byHour).map(([hour, tickets]) => ({
        hour: formatHour(parseInt(hour)),
        count: tickets.length,
        avg_per_day: parseFloat((tickets.length / daysBack).toFixed(1))
      })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

      // Find peak hours
      const peakHours = [...hourlyDistribution]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(h => `${h.hour} (avg ${h.avg_per_day}/day)`);

      // Group by day of week
      const byDayOfWeek = groupTicketsByDayOfWeek(tickets);
      const dayOfWeekDistribution = Object.entries(byDayOfWeek).map(([day, tickets]) => {
        // Count number of each day in the date range
        const dayCount = Math.floor(daysBack / 7) + 1;
        return {
          day,
          count: tickets.length,
          avg_per_occurrence: parseFloat((tickets.length / dayCount).toFixed(1))
        };
      });

      // Identify patterns
      const busiestDay = dayOfWeekDistribution.reduce((max, day) =>
        day.count > max.count ? day : max
      );

      const quietestDay = dayOfWeekDistribution.reduce((min, day) =>
        day.count < min.count ? day : min
      );

      // Calculate staffing recommendations based on volume
      const maxHourlyVolume = Math.max(...hourlyDistribution.map(h => h.avg_per_day));
      const avgHourlyVolume = hourlyDistribution.reduce((sum, h) => sum + h.avg_per_day, 0) / hourlyDistribution.length;

      // Assuming 1 tech can handle 5-8 tickets/hour
      const ticketsPerTechPerHour = 6;

      const staffingRecommendations = {
        weekday_peak: Math.ceil(maxHourlyVolume / ticketsPerTechPerHour),
        weekday_off_peak: Math.max(2, Math.ceil(avgHourlyVolume / ticketsPerTechPerHour)),
        weekend: Math.max(1, Math.ceil((dayOfWeekDistribution.find(d => d.day === 'Saturday')?.avg_per_occurrence || 5) / 24 / ticketsPerTechPerHour))
      };

      // Identify peak periods (consecutive hours with high volume)
      const peakPeriods: string[] = [];
      for (let i = 0; i < hourlyDistribution.length - 2; i++) {
        const current = hourlyDistribution[i];
        const next = hourlyDistribution[i + 1];
        const afterNext = hourlyDistribution[i + 2];

        const avgVolume = (current.avg_per_day + next.avg_per_day + afterNext.avg_per_day) / 3;

        if (avgVolume > avgHourlyVolume * 1.5) {
          const startHour = current.hour;
          const endHour = afterNext.hour.split(':')[0];
          peakPeriods.push(`${startHour}-${parseInt(endHour) + 1}:00 (avg ${avgVolume.toFixed(1)}/hour)`);
          i += 2; // Skip ahead to avoid overlap
        }
      }

      const result = {
        success: true,
        period: `last ${daysBack} days`,
        total_tickets: tickets.length,
        hourly_distribution: hourlyDistribution,
        day_of_week_distribution: dayOfWeekDistribution,
        peak_hours: peakHours,
        peak_periods: peakPeriods.length > 0 ? peakPeriods : ['No significant peak periods identified'],
        patterns: {
          busiest_day: `${busiestDay.day} (avg ${busiestDay.avg_per_occurrence} tickets)`,
          quietest_day: `${quietestDay.day} (avg ${quietestDay.avg_per_occurrence} tickets)`,
          busiest_hour: hourlyDistribution.reduce((max, h) => h.count > max.count ? h : max).hour,
          avg_tickets_per_hour: parseFloat(avgHourlyVolume.toFixed(1))
        },
        staffing_recommendations: {
          minimum_required: {
            weekday_peak: staffingRecommendations.weekday_peak,
            weekday_off_peak: staffingRecommendations.weekday_off_peak,
            weekend: staffingRecommendations.weekend
          },
          optimal: {
            weekday_peak: staffingRecommendations.weekday_peak + 2,
            weekday_off_peak: staffingRecommendations.weekday_off_peak + 1,
            weekend: staffingRecommendations.weekend + 1
          },
          note: 'Based on 6 tickets/hour/tech capacity. Adjust for your team\'s actual throughput.'
        }
      };

      logger.info({
        totalTickets: tickets.length,
        peakHour: result.patterns.busiest_hour,
        busiestDay: busiestDay.day
      }, 'Time pattern analysis complete');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'Time pattern analysis failed');

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
