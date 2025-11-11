/**
 * Rate Limiting Middleware
 *
 * Token bucket algorithm via express-rate-limit
 * - 10 requests per second per client
 * - Key by auth token or IP address
 * - Standard rate limit headers (RateLimit-*)
 */

import rateLimit from 'express-rate-limit';
import { Request } from 'express';

export const rateLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // 10 requests per second
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  keyGenerator: (req: Request) => {
    // Rate limit by auth token if present, otherwise use default (IP)
    const token = req.headers['x-auth-token'] as string;
    if (token) {
      return `token:${token}`;
    }
    // Return undefined to use default IP-based key generator (handles IPv6)
    return undefined as any;
  },
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Rate limit: 10 requests per second',
      retryAfter: 1 // seconds
    });
  }
});
