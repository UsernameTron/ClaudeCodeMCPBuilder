/**
 * Authentication Middleware
 *
 * Supports two authentication modes:
 * 1. Shared Token: Simple token-based auth (x-auth-token header)
 * 2. HMAC Signature: Webhook signature validation with replay protection
 *
 * HMAC Format: sha256=<hex_digest_of_hmac(timestamp + rawBody)>
 * Replay Protection: 5-minute timestamp window + signature deduplication
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../errors/custom-errors.js';

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const recentSignatures = new Set<string>();

/**
 * Validate Shared Token
 *
 * Compares provided token against AUTH_TOKEN environment variable.
 *
 * @param token - Token from x-auth-token header
 * @returns True if token is valid
 * @throws Error if AUTH_TOKEN not configured
 */
export function validateSharedToken(token: string): boolean {
  const authToken = process.env.AUTH_TOKEN;
  if (!authToken) {
    throw new Error('AUTH_TOKEN not configured');
  }
  return token === authToken;
}

/**
 * Validate HMAC Signature
 *
 * Validates HMAC signature with replay attack prevention:
 * 1. Check timestamp is within 5-minute window
 * 2. Check signature hasn't been used before
 * 3. Validate HMAC signature using timing-safe comparison
 *
 * @param rawBody - Raw request body string
 * @param signature - HMAC signature from x-signature header
 * @param timestamp - Unix timestamp (ms) from x-timestamp header
 * @returns True if signature is valid
 * @throws AuthenticationError if validation fails
 */
export function validateHMACSignature(
  rawBody: string,
  signature: string,
  timestamp: string
): boolean {
  // Check timestamp to prevent replay attacks
  const requestTime = parseInt(timestamp, 10);
  const now = Date.now();

  if (isNaN(requestTime)) {
    throw new AuthenticationError('Invalid timestamp format');
  }

  if (Math.abs(now - requestTime) > REPLAY_WINDOW_MS) {
    throw new AuthenticationError('Request timestamp outside valid window (5 minutes)');
  }

  // Check if signature already used (replay protection)
  if (recentSignatures.has(signature)) {
    throw new AuthenticationError('Signature already used (replay attack detected)');
  }

  // Validate HMAC: sign (timestamp + rawBody) with secret
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('WEBHOOK_SECRET not configured');
  }

  const payload = timestamp + rawBody;
  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  const valid = crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(signature)
  );

  if (valid) {
    recentSignatures.add(signature);
    // Cleanup old signatures after window expires
    setTimeout(() => recentSignatures.delete(signature), REPLAY_WINDOW_MS);
  }

  return valid;
}

/**
 * Authentication Middleware
 *
 * Checks for either:
 * - x-auth-token header (shared token auth)
 * - x-signature + x-timestamp headers (HMAC auth)
 *
 * Returns 401 if no auth provided or invalid
 * Returns 403 if auth fails (e.g., replay attack detected)
 */
export function authMiddleware(req: any, res: Response, next: NextFunction) {
  const token = req.headers['x-auth-token'] as string;
  const signature = req.headers['x-signature'] as string;
  const timestamp = req.headers['x-timestamp'] as string;

  try {
    if (token) {
      // Shared token authentication
      if (!validateSharedToken(token)) {
        return res.status(401).json({
          status: 'error',
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token'
        });
      }
    } else if (signature && timestamp) {
      // HMAC signature authentication
      if (!validateHMACSignature(req.rawBody, signature, timestamp)) {
        return res.status(401).json({
          status: 'error',
          code: 'INVALID_SIGNATURE',
          message: 'Invalid HMAC signature'
        });
      }
    } else {
      return res.status(401).json({
        status: 'error',
        code: 'AUTH_REQUIRED',
        message: 'Authentication required (provide x-auth-token or x-signature + x-timestamp)'
      });
    }
    next();
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return res.status(403).json({
        status: 'error',
        code: 'AUTH_FAILED',
        message: err.message
      });
    }
    throw err;
  }
}
