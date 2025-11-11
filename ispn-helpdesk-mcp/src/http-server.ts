/**
 * HTTP Server - ISPN Helpdesk Bridge
 *
 * Express server for ElevenLabs agent handoffs via HTTP API.
 * Separate process from MCP server (can run independently).
 *
 * Features:
 * - Helmet security headers
 * - Raw body parser for HMAC validation
 * - Request logging
 * - Health endpoints (no auth)
 * - Protected ingest routes (auth + rate limiting + idempotency)
 * - Global error handler
 * - Graceful shutdown
 */

import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { logger } from './utils/logger.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimiter } from './middleware/rate-limit.js';
import { idempotencyMiddleware } from './middleware/idempotency.js';
import { ingestRouter } from './routes/ingest.js';
import { healthRouter } from './routes/health.js';
import { ValidationError, HelpdeskError } from './errors/custom-errors.js';
import { ticketStore } from './services/ticket-store.js';
import { idempotencyStore } from './services/idempotency-store.js';

const app = express();

// Security headers
app.use(helmet());

// Trust proxy (for rate limiting by IP in production behind load balancer)
app.set('trust proxy', 1);

// Raw body parser for HMAC validation
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip
    }, 'Request completed');
  });

  next();
});

// Health endpoints (no auth required)
app.use('/', healthRouter);

// Protected routes
app.use('/ingest', rateLimiter, authMiddleware, idempotencyMiddleware, ingestRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    err: err.message,
    stack: err.stack,
    path: req.path
  }, 'Request error');

  if (err instanceof ValidationError) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: err.message,
      details: err.details
    });
  }

  if (err instanceof HelpdeskError) {
    return res.status(err.statusCode || 500).json({
      status: 'error',
      code: 'HELPDESK_ERROR',
      message: err.message
    });
  }

  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'HTTP server started');
});

/**
 * Graceful Shutdown Handler
 *
 * Handles SIGTERM and SIGINT signals:
 * 1. Stop accepting new connections
 * 2. Wait for existing requests to complete
 * 3. Cleanup stores (clear intervals)
 * 4. Exit after timeout if not completed
 */
const shutdown = async () => {
  logger.info('Shutdown signal received, closing server gracefully');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Cleanup stores
  ticketStore.destroy();
  idempotencyStore.destroy();

  // Force exit after 30 seconds if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
