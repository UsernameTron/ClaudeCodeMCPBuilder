/**
 * Ingest Route Handler
 *
 * POST /oa-handoff endpoint for ElevenLabs agent handoffs
 *
 * Flow:
 * 1. Validate request payload with Zod schema
 * 2. Call findOrCreateTicket() from ticket-service
 * 3. Return structured response with ticket details
 *
 * Protected by: auth, rate limiting, idempotency middleware
 */

import { Router, Request, Response } from 'express';
import { ingestPayloadSchema } from '../schemas/ingest-schemas.js';
import { findOrCreateTicket } from '../services/ticket-service.js';
import { ValidationError } from '../errors/custom-errors.js';
import { logger } from '../utils/logger.js';

export const ingestRouter = Router();

ingestRouter.post('/oa-handoff', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = ingestPayloadSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new ValidationError(
        'Invalid request payload',
        validationResult.error.format()
      );
    }

    const payload = validationResult.data;

    logger.info({
      oaKey: payload.oaKey,
      callerNumber: payload.callerNumber,
      category: payload.category,
      source: payload.source
    }, 'Processing ingest request');

    // Find or create ticket
    const result = await findOrCreateTicket({
      description: payload.note,
      category: payload.category,
      escalationReason: payload.escalationReason,
      callerNumber: payload.callerNumber,
      oaKey: payload.oaKey,
      source: payload.source,
      metadata: {
        confidence: payload.confidence || '0.0',
        ingestedAt: new Date().toISOString()
      }
    });

    // Return response
    const response = {
      status: 'ok' as const,
      created: result.created,
      ticketId: result.ticketId,
      ticketUrl: result.ticketUrl,
      category: payload.category || 'Unknown',
      escalationReason: payload.escalationReason || 'Other',
      confidence: payload.confidence || '0.0',
      echo: {
        oaKey: payload.oaKey,
        callerNumber: payload.callerNumber
      }
    };

    logger.info({
      ticketId: result.ticketId,
      created: result.created
    }, 'Ingest request completed');

    return res.status(200).json(response);

  } catch (error: any) {
    if (error instanceof ValidationError) {
      logger.warn({ error: error.message, details: error.details }, 'Validation error');
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.details
      });
    }

    logger.error({ error: error.message }, 'Ingest request failed');
    return res.status(500).json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    });
  }
});
