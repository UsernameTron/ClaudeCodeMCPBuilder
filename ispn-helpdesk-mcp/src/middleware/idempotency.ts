/**
 * Idempotency Middleware
 *
 * Prevents duplicate request processing using Idempotency-Key header:
 * 1. Hash request body to detect payload changes
 * 2. Check if we've seen this key before
 * 3. If found, return cached response (200/201, NOT 409)
 * 4. If not found, intercept res.json() to cache response
 *
 * If same key used with different payload → 409 Conflict
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { idempotencyStore } from '../services/idempotency-store.js';
import { logger } from '../utils/logger.js';

export function idempotencyMiddleware(req: any, res: Response, next: NextFunction) {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    // No idempotency key provided, process normally
    return next();
  }

  try {
    // Hash the request body
    const payloadHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body))
      .digest('hex');

    // Check if we've seen this request before
    const cached = idempotencyStore.get(idempotencyKey, payloadHash);

    if (cached) {
      logger.info({ idempotencyKey }, 'Returning cached response for idempotent request');
      // Return cached response with original status code (NOT 409)
      return res.status(cached.statusCode || 200).json(cached.response);
    }

    // Store the response when it's sent
    const originalJson = res.json.bind(res);
    res.json = function(body: any) {
      idempotencyStore.set(idempotencyKey, payloadHash, body, res.statusCode);
      return originalJson(body);
    };

    next();
  } catch (error: any) {
    // If payload hash conflict detected, idempotency-store will throw
    logger.error({ error: error.message, idempotencyKey }, 'Idempotency check failed');
    return res.status(409).json({
      status: 'error',
      code: 'IDEMPOTENCY_CONFLICT',
      message: 'Idempotency key reused with different payload'
    });
  }
}
