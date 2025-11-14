/**
 * MCP Tool: ispn_analytics_customer_patterns
 *
 * Identifies customers with repeat issues, chronic problems, and patterns
 * requiring proactive intervention.
 */

import { z } from 'zod';
import { createISPNClient } from '../services/ispn-client.js';
import { logger } from '../utils/logger.js';
import { groupEscalationsByCustomer, extractKeywords, topN, type Ticket } from '../utils/analytics-helpers.js';

const inputSchema = z.object({
  days_back: z.number().optional().describe('Number of days to analyze (default: 90)'),
  min_tickets: z.number().optional().describe('Minimum tickets to flag customer (default: 5)'),
  min_escalations: z.number().optional().describe('Minimum escalations to flag customer (default: 2)')
});

export const customerPatternsAnalyticsTool = {
  definition: {
    name: 'ispn_analytics_customer_patterns',
    description: 'Identify customers with repeat issues and chronic problems. Shows high-touch customers, common issue patterns, and recommends proactive outreach. Use for customer retention and proactive support.',
    inputSchema: {
      type: 'object',
      properties: {
        days_back: {
          type: 'number',
          description: 'Number of days to analyze (default: 90 for quarterly view)'
        },
        min_tickets: {
          type: 'number',
          description: 'Minimum tickets to flag as high-touch customer (default: 5)'
        },
        min_escalations: {
          type: 'number',
          description: 'Minimum escalations to flag as at-risk (default: 2)'
        }
      }
    }
  },

  async handler(args: unknown) {
    try {
      const input = inputSchema.parse(args);

      const apiUrl = process.env.ISPN_API_URL;
      const authCode = process.env.ISPN_AUTH_CODE;

      if (!apiUrl || !authCode) {
        throw new Error('ISPN_API_URL and ISPN_AUTH_CODE must be set');
      }

      const client = createISPNClient();

      const daysBack = input.days_back || 90;
      const minTickets = input.min_tickets || 5;
      const minEscalations = input.min_escalations || 2;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysBack);

      const beginStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      logger.info({ daysBack, minTickets, minEscalations }, 'Analyzing customer patterns');

      const [tickets, escalations] = await Promise.all([
        client.listTicketsByDateRange(beginStr, endStr),
        client.listEscalationsByDateRange(beginStr, endStr)
      ]);

      if (!tickets || tickets.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              analysis_period: `${daysBack} days`,
              message: 'No ticket data available'
            }, null, 2)
          }]
        };
      }

      // Group tickets by customer
      const ticketsByCustomer: Record<string, Ticket[]> = {};
      tickets.forEach(ticket => {
        const billid = ticket.billid || 'Unknown';
        if (!ticketsByCustomer[billid]) {
          ticketsByCustomer[billid] = [];
        }
        ticketsByCustomer[billid].push(ticket);
      });

      // Group escalations by customer
      const escByCustomer = groupEscalationsByCustomer(escalations);

      // Identify high-touch customers
      const highTouchCustomers = Object.entries(ticketsByCustomer)
        .filter(([_, tickets]) => tickets.length >= minTickets || (escByCustomer[_]?.length || 0) >= minEscalations)
        .map(([billid, tickets]) => {
          const escs = escByCustomer[billid] || [];

          // Find primary issue (most common service/category)
          const services: Record<string, number> = {};
          tickets.forEach(t => {
            const svc = t.categories?.service || 'Unknown';
            const cat = t.categories?.category || '';
            const key = cat ? `${svc} - ${cat}` : svc;
            services[key] = (services[key] || 0) + 1;
          });

          const primaryIssue = Object.entries(services).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

          // Calculate issue frequency
          const daysBetween = (new Date(tickets[0].entrytime || "").getTime()) / (1000 * 60 * 60 * 24);
          const frequency = tickets.length > 1 ? `Every ${Math.round(daysBetween / tickets.length)} days avg` : 'Single occurrence';

          // Latest contact
          const latestTicket = tickets.reduce((max, t) =>
            new Date(tickets[0].entrytime || "") ? t : max
          );

          // Recommendation
          let recommendation = '';
          if (escs.length >= 3) {
            recommendation = `URGENT: ${escs.length} escalations - schedule executive review`;
          } else if (escs.length >= minEscalations) {
            recommendation = `Schedule proactive call - recurring ${primaryIssue} issues`;
          } else if (tickets.length >= 10) {
            recommendation = `High volume customer - consider account review`;
          } else {
            recommendation = `Monitor for patterns`;
          }

          return {
            billid,
            total_tickets: tickets.length,
            total_escalations: escs.length,
            primary_issue: primaryIssue,
            issue_frequency: frequency,
            last_contact: latestTicket.entrytime || "".split(' ')[0],
            recommendation,
            ticket_history: tickets.slice(-5).map(t => ({
              date: t.entrytime || "".split(' ')[0],
              issue: t.categories?.service || 'Unknown'
            }))
          };
        })
        .sort((a, b) => (b.total_escalations * 10 + b.total_tickets) - (a.total_escalations * 10 + a.total_tickets))
        .slice(0, 20); // Top 20

      // Extract issue patterns from descriptions
      const allDescriptions = tickets.map(t => t.description || '');
      const keywords = extractKeywords(allDescriptions);
      const topKeywords = Object.entries(keywords)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, count]) => ({ keyword: word, count }));

      // Identify common patterns (simplified - group by service+category)
      const patterns: Record<string, { count: number; customers: Set<string> }> = {};
      tickets.forEach(t => {
        const pattern = `${t.categories?.service || 'Unknown'} - ${t.categories?.category || 'General'}`;
        if (!patterns[pattern]) {
          patterns[pattern] = { count: 0, customers: new Set() };
        }
        patterns[pattern].count++;
        if (t.billid) patterns[pattern].customers.add(t.billid);
      });

      const issuePatterns = Object.entries(patterns)
        .map(([pattern, data]) => ({
          pattern,
          affected_customers: data.customers.size,
          total_occurrences: data.count,
          recommendation: data.customers.size > 10 ? 'Systemic issue - investigate root cause' : 'Monitor trend'
        }))
        .sort((a, b) => b.affected_customers - a.affected_customers)
        .slice(0, 10);

      const result = {
        success: true,
        analysis_period: `${daysBack} days`,
        high_touch_customers: highTouchCustomers,
        issue_patterns: issuePatterns,
        top_keywords: topKeywords,
        summary: {
          total_customers_analyzed: Object.keys(ticketsByCustomer).length,
          high_touch_count: highTouchCustomers.length,
          customers_with_escalations: Object.keys(escByCustomer).length,
          most_common_issue: issuePatterns[0]?.pattern || 'N/A'
        }
      };

      logger.info({
        customersAnalyzed: Object.keys(ticketsByCustomer).length,
        highTouch: highTouchCustomers.length
      }, 'Customer pattern analysis complete');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'Customer pattern analysis failed');

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
