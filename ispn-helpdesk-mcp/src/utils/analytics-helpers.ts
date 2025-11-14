/**
 * Analytics Helper Utilities
 *
 * Shared functions for data aggregation, statistical analysis,
 * and trend calculation across analytics tools.
 */

// Re-export types from ISPN client for consistency
export type { TicketInfo as Ticket, EscalationInfo as Escalation } from '../services/ispn-client.js';

/**
 * DHCP Reservation interface
 */
export interface DHCPReservation {
  billid?: string;
  pool?: string;
  poolstatus?: string;
  ip?: string;
  mac?: string;
  hostname?: string;
}

/**
 * Calculate trend from two values
 */
export function calculateTrend(current: number, previous: number): {
  direction: 'increasing' | 'decreasing' | 'stable';
  percentage: number;
  formatted: string;
} {
  if (previous === 0) {
    return {
      direction: current > 0 ? 'increasing' : 'stable',
      percentage: current > 0 ? 100 : 0,
      formatted: current > 0 ? '+100%' : '0%'
    };
  }

  const change = ((current - previous) / previous) * 100;
  const direction = Math.abs(change) < 5 ? 'stable' : change > 0 ? 'increasing' : 'decreasing';

  return {
    direction,
    percentage: Math.abs(change),
    formatted: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
  };
}

/**
 * Parse ISPN datetime string to Date object
 */
export function parseISPNDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();
  // Format: "2009-05-08 16:26:29" or "2025-01-15"
  return new Date(dateStr.replace(' ', 'T'));
}

/**
 * Calculate hours between two dates
 */
export function hoursBetween(start: string | Date, end: string | Date): number {
  const startDate = typeof start === 'string' ? parseISPNDate(start) : start;
  const endDate = typeof end === 'string' ? parseISPNDate(end) : end;

  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Group tickets by date (day, week, or month)
 */
export function groupTicketsByDate(
  tickets: any[],
  granularity: 'daily' | 'weekly' | 'monthly' = 'daily'
): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  tickets.forEach(ticket => {
    if (!ticket.entrytime) return; // Skip tickets without time

    const date = parseISPNDate(ticket.entrytime);
    let key: string;

    switch (granularity) {
      case 'daily':
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'monthly':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(ticket);
  });

  return grouped;
}

/**
 * Group tickets by service category
 */
export function groupTicketsByService(tickets: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  tickets.forEach(ticket => {
    const service = ticket.categories?.service || 'Unknown';

    if (!grouped[service]) {
      grouped[service] = [];
    }
    grouped[service].push(ticket);
  });

  return grouped;
}

/**
 * Group tickets by category
 */
export function groupTicketsByCategory(tickets: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  tickets.forEach(ticket => {
    const category = ticket.categories?.category || 'Unknown';

    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(ticket);
  });

  return grouped;
}

/**
 * Group tickets by hour of day (0-23)
 */
export function groupTicketsByHour(tickets: any[]): Record<number, any[]> {
  const grouped: Record<number, any[]> = {};

  for (let i = 0; i < 24; i++) {
    grouped[i] = [];
  }

  tickets.forEach(ticket => {
    const date = parseISPNDate(ticket.entrytime);
    const hour = date.getHours();
    grouped[hour].push(ticket);
  });

  return grouped;
}

/**
 * Group tickets by day of week (0=Sunday, 6=Saturday)
 */
export function groupTicketsByDayOfWeek(tickets: any[]): Record<string, any[]> {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const grouped: Record<string, any[]> = {};

  dayNames.forEach(day => {
    grouped[day] = [];
  });

  tickets.forEach(ticket => {
    const date = parseISPNDate(ticket.entrytime);
    const dayName = dayNames[date.getDay()];
    grouped[dayName].push(ticket);
  });

  return grouped;
}

/**
 * Calculate statistical summary
 */
export function calculateStats(values: number[]): {
  mean: number;
  median: number;
  min: number;
  max: number;
  stddev: number;
} {
  if (values.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, stddev: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  const median = values.length % 2 === 0
    ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
    : sorted[Math.floor(values.length / 2)];

  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stddev = Math.sqrt(variance);

  return {
    mean: parseFloat(mean.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stddev: parseFloat(stddev.toFixed(2))
  };
}

/**
 * Calculate escalation resolution time
 */
export function calculateResolutionTime(escalation: any): number | null {
  if (!escalation.closetime || escalation.closetime === '0000-00-00 00:00:00') {
    return null; // Still open
  }

  if (!escalation.entrytime) return null;

  return hoursBetween(escalation.entrytime, escalation.closetime);
}

/**
 * Group escalations by customer
 */
export function groupEscalationsByCustomer(escalations: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  escalations.forEach(esc => {
    const billid = esc.billid || 'Unknown';

    if (!grouped[billid]) {
      grouped[billid] = [];
    }
    grouped[billid].push(esc);
  });

  return grouped;
}

/**
 * Find top N items by count
 */
export function topN<T>(
  items: Record<string, T[]>,
  n: number
): Array<{ key: string; count: number; items: T[] }> {
  return Object.entries(items)
    .map(([key, items]) => ({ key, count: items.length, items }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

/**
 * Calculate percentage
 */
export function percentage(part: number, total: number): number {
  if (total === 0) return 0;
  return parseFloat(((part / total) * 100).toFixed(1));
}

/**
 * Format hour for display (e.g., 9 -> "09:00")
 */
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/**
 * Get date range days
 */
export function getDaysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Categorize resolution time
 */
export function categorizeResolutionTime(hours: number): string {
  if (hours < 4) return '< 4 hours';
  if (hours < 8) return '4-8 hours';
  if (hours < 24) return '8-24 hours';
  return '> 24 hours';
}

/**
 * Extract common issue keywords from descriptions
 */
export function extractKeywords(descriptions: string[]): Record<string, number> {
  const keywords: Record<string, number> = {};

  // Common stopwords to ignore
  const stopwords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'that', 'this', 'it', 'be', 'are', 'was', 'were', 'has', 'have', 'had']);

  descriptions.forEach(desc => {
    if (!desc) return;

    // Extract words (lowercase, alphanumeric only)
    const words = desc.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopwords.has(word));

    words.forEach(word => {
      keywords[word] = (keywords[word] || 0) + 1;
    });
  });

  return keywords;
}

/**
 * Health score calculator
 * Combines multiple factors into 0-100 score
 */
export function calculateHealthScore(factors: {
  ticketVolume: number;
  escalationRate: number;
  avgResolutionHours: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}): number {
  let score = 100;

  // Escalation rate penalty (0-30 points)
  if (factors.escalationRate > 20) score -= 30;
  else if (factors.escalationRate > 10) score -= 20;
  else if (factors.escalationRate > 5) score -= 10;

  // Resolution time penalty (0-30 points)
  if (factors.avgResolutionHours > 24) score -= 30;
  else if (factors.avgResolutionHours > 12) score -= 20;
  else if (factors.avgResolutionHours > 8) score -= 10;

  // Volume trend penalty (0-20 points)
  if (factors.trend === 'increasing') score -= 20;

  // High volume penalty (0-20 points)
  if (factors.ticketVolume > 100) score -= 20;
  else if (factors.ticketVolume > 50) score -= 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Health status from score
 */
export function healthStatus(score: number): 'healthy' | 'needs_attention' | 'critical' {
  if (score >= 75) return 'healthy';
  if (score >= 50) return 'needs_attention';
  return 'critical';
}
