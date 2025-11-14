/**
 * MCP Tool: ispn_analytics_service_health
 *
 * Comprehensive service health dashboard combining tickets, escalations,
 * and network metrics into actionable health scores.
 */

import { z } from 'zod';
import { createISPNClient } from '../services/ispn-client.js';
import { getCategoryMapper } from '../services/category-mapper.js';
import { logger } from '../utils/logger.js';
import {
  groupTicketsByService,
  calculateTrend,
  calculateResolutionTime,
  calculateHealthScore,
  healthStatus,
  percentage,
  calculateStats,
  type Ticket,
  type Escalation
} from '../utils/analytics-helpers.js';

const inputSchema = z.object({
  days_back: z.number().optional().describe('Number of days to analyze (default: 7)')
});

export const serviceHealthAnalyticsTool = {
  definition: {
    name: 'ispn_analytics_service_health',
    description: 'Service health dashboard showing real-time operational status. Combines ticket volume, escalation rates, resolution times, and network metrics into health scores (0-100) for each service. Use for daily operational reviews and resource prioritization.',
    inputSchema: {
      type: 'object',
      properties: {
        days_back: {
          type: 'number',
          description: 'Number of days to analyze (default: 7 for weekly view)'
        }
      }
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

      const daysBack = input.days_back || 7;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysBack);

      const beginStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      logger.info({ daysBack, begin: beginStr, end: endStr }, 'Generating service health dashboard');

      // Fetch data in parallel
      const [tickets, escalations, services] = await Promise.all([
        client.listTicketsByDateRange(beginStr, endStr),
        client.listEscalationsByDateRange(beginStr, endStr),
        categoryMapper.getServices()
      ]);

      if (!tickets || tickets.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              timestamp: new Date().toISOString(),
              period: `last ${daysBack} days`,
              message: 'No ticket data available for health analysis'
            }, null, 2)
          }]
        };
      }

      // Group tickets and escalations by service
      const ticketsByService = groupTicketsByService(tickets);
      const escalationsByService: Record<string, Escalation[]> = {};

      escalations.forEach(esc => {
        // Find matching ticket to get service
        const matchingTicket = tickets.find(t => t.ticketid === esc.ticketid);
        const service = matchingTicket?.categories?.service || 'Unknown';

        if (!escalationsByService[service]) {
          escalationsByService[service] = [];
        }
        escalationsByService[service].push(esc);
      });

      // Calculate health for each service
      const serviceHealth = Object.entries(ticketsByService).map(([service, svcTickets]) => {
        const svcEscalations = escalationsByService[service] || [];

        // Calculate trend (first half vs second half)
        const midpoint = Math.floor(svcTickets.length / 2);
        const sortedTickets = [...svcTickets].sort((a, b) =>
          new Date(a.entrytime).getTime() - new Date(b.entrytime).getTime()
        );
        const firstHalf = sortedTickets.slice(0, midpoint).length;
        const secondHalf = sortedTickets.slice(midpoint).length;
        const trend = calculateTrend(secondHalf, firstHalf);

        // Calculate escalation rate
        const escalationRate = percentage(svcEscalations.length, svcTickets.length);

        // Calculate average resolution time
        const resolutionTimes = svcEscalations
          .map(esc => calculateResolutionTime(esc))
          .filter(t => t !== null) as number[];

        const avgResolution = resolutionTimes.length > 0
          ? calculateStats(resolutionTimes).mean
          : 0;

        // Calculate health score
        const healthScore = calculateHealthScore({
          ticketVolume: svcTickets.length,
          escalationRate,
          avgResolutionHours: avgResolution,
          trend: trend.direction
        });

        const status = healthStatus(healthScore);

        // Generate recommendation
        let recommendation = '';
        if (status === 'healthy') {
          recommendation = 'Performing well';
        } else if (status === 'needs_attention') {
          if (escalationRate > 10) {
            recommendation = `High escalation rate (${escalationRate.toFixed(1)}%) - investigate root causes`;
          } else if (trend.direction === 'increasing') {
            recommendation = 'Ticket volume increasing - monitor capacity';
          } else {
            recommendation = 'Monitor for improvement opportunities';
          }
        } else {
          // Critical
          const issues = [];
          if (escalationRate > 20) issues.push('very high escalation rate');
          if (avgResolution > 24) issues.push('slow resolution times');
          if (trend.direction === 'increasing') issues.push('volume spike');

          recommendation = `CRITICAL: ${issues.join(', ')}`;
        }

        return {
          name: service,
          health_score: healthScore,
          status,
          tickets_total: svcTickets.length,
          tickets_trend: trend.direction,
          tickets_trend_pct: trend.formatted,
          escalations: svcEscalations.length,
          escalation_rate: parseFloat(escalationRate.toFixed(1)),
          avg_resolution_hours: parseFloat(avgResolution.toFixed(1)),
          recommendation
        };
      }).sort((a, b) => a.health_score - b.health_score); // Sort by health (worst first)

      // Overall status
      const avgHealthScore = serviceHealth.reduce((sum, s) => sum + s.health_score, 0) / serviceHealth.length;
      const overallStatus = healthStatus(avgHealthScore);

      // Top issues
      const topIssues: string[] = [];
      serviceHealth.forEach(svc => {
        if (svc.status === 'critical') {
          topIssues.push(`${svc.name}: ${svc.recommendation}`);
        }
      });

      // Add capacity warnings
      const highVolumeServices = serviceHealth.filter(s => s.tickets_total > 100);
      highVolumeServices.forEach(svc => {
        topIssues.push(`${svc.name}: High volume (${svc.tickets_total} tickets)`);
      });

      const result = {
        success: true,
        timestamp: new Date().toISOString(),
        period_analyzed: `last ${daysBack} days`,
        overall_health_score: parseFloat(avgHealthScore.toFixed(1)),
        overall_status: overallStatus,
        services: serviceHealth,
        top_issues: topIssues.slice(0, 5), // Top 5 issues
        summary: {
          total_tickets: tickets.length,
          total_escalations: escalations.length,
          services_monitored: serviceHealth.length,
          critical_services: serviceHealth.filter(s => s.status === 'critical').length,
          healthy_services: serviceHealth.filter(s => s.status === 'healthy').length
        }
      };

      logger.info({
        overallHealth: avgHealthScore,
        services: serviceHealth.length,
        criticalServices: result.summary.critical_services
      }, 'Service health dashboard generated');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'Service health analysis failed');

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
