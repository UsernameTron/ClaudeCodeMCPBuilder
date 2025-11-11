/**
 * Health Check Routes
 *
 * Two endpoints:
 * - GET /healthz: Basic health check (liveness probe) - always returns 200
 * - GET /readyz: Readiness check - verifies dependencies (helpdesk API)
 *
 * No authentication required (public endpoints)
 */

import { Router, Request, Response } from 'express';
import { helpdeskClient } from '../services/helpdesk-client.js';
import { logger } from '../utils/logger.js';

export const healthRouter = Router();

/**
 * Health Check (Liveness Probe)
 *
 * Returns 200 if service is running.
 * Use for Kubernetes liveness probe or basic monitoring.
 */
healthRouter.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'ispn-helpdesk-bridge',
    timestamp: new Date().toISOString()
  });
});

/**
 * Readiness Check
 *
 * Verifies all dependencies are healthy:
 * - Helpdesk API connectivity
 *
 * Returns:
 * - 200 if all dependencies healthy
 * - 503 if any dependency unavailable
 *
 * Use for Kubernetes readiness probe or load balancer health checks.
 */
healthRouter.get('/readyz', async (req: Request, res: Response) => {
  try {
    // Check helpdesk API connectivity
    const helpdeskHealthy = await helpdeskClient.healthCheck();

    if (!helpdeskHealthy) {
      return res.status(503).json({
        status: 'unavailable',
        service: 'ispn-helpdesk-bridge',
        checks: {
          helpdesk: 'unhealthy'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      status: 'ready',
      service: 'ispn-helpdesk-bridge',
      checks: {
        helpdesk: 'healthy'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Readiness check failed');
    res.status(503).json({
      status: 'unavailable',
      service: 'ispn-helpdesk-bridge',
      error: 'Readiness check failed',
      timestamp: new Date().toISOString()
    });
  }
});
