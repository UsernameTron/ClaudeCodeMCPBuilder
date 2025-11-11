/**
 * Logger Configuration - Structured Logging with Pino
 *
 * Features:
 * - Structured JSON logging
 * - PII redaction for sensitive fields
 * - Pretty formatting for development
 * - Configurable log level via environment variable
 */

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  },
  redact: {
    paths: [
      'req.body.note',
      'req.body.description',
      'req.body.callerNumber',
      'req.headers["x-auth-token"]',
      'req.headers["x-signature"]'
    ],
    remove: true
  }
});
