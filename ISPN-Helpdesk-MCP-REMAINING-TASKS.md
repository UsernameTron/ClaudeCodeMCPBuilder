# ISPN Helpdesk Bridge MCP - Remaining Implementation Tasks

**Status:** Phases 1-4 Complete (Steps 1-14) ✅
**Current Phase:** Phase 5 (HTTP Server & Enhanced Middleware)
**Test Results:** 75/75 tests passing (100% pass rate)

---

## ✅ COMPLETED PHASES (Steps 1-14)

### Phase 1: Project Setup & Structure ✅
- Project directory structure
- `.gitignore`, `tsconfig.json`, `package.json`
- All dependencies installed (23 packages)
- Vitest configuration

### Phase 2: Core Type Definitions & Error Classes ✅
- 5 custom error classes
- 3 enums, 8 interfaces
- 3 Zod schema files (common, ingest, tool)

### Phase 3: Storage with TTL Cleanup ✅
- `ticket-store.ts` (4-hour TTL, cleanup every 30 min)
- `idempotency-store.ts` (15-min TTL, cleanup every 5 min)
- `helpdesk-client.ts` (Mock implementation with interface)

### Phase 4: Validation & Business Logic ✅
- `validators.ts` (libphonenumber-js integration)
- `note-processor.ts` (render, sanitize, infer, parse)
- `ticket-service.ts` (3-step deduplication logic)

**All 75 unit tests passing** ✅

---

## 🚀 REMAINING PHASES

---

## Phase 5: HTTP Server & Enhanced Middleware (Steps 15-21)

### Step 15: Create Logger with Pino
**File:** `src/utils/logger.ts`

**Requirements:**
- Structured logging with Pino
- PII redaction for sensitive fields
- Pretty formatting for development
- Log level from environment variable

**Implementation:**
```typescript
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
```

---

### Step 16: Create Authentication Middleware
**File:** `src/middleware/auth.ts`

**Requirements:**
- Support two auth modes: Shared token OR HMAC signature
- HMAC includes replay attack prevention (5-minute window)
- Timing-safe signature comparison
- Track recent signatures to prevent reuse

**Implementation:**
```typescript
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../errors/custom-errors';

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const recentSignatures = new Set<string>();

export function validateSharedToken(token: string): boolean {
  const authToken = process.env.AUTH_TOKEN;
  if (!authToken) {
    throw new Error('AUTH_TOKEN not configured');
  }
  return token === authToken;
}

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
```

---

### Step 17: Create Rate Limiting Middleware
**File:** `src/middleware/rate-limit.ts`

**Requirements:**
- Token bucket algorithm via express-rate-limit
- 10 requests per second per client
- Key by auth token or IP address
- Standard rate limit headers

**Implementation:**
```typescript
import rateLimit from 'express-rate-limit';
import { Request } from 'express';

export const rateLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // 10 requests per second
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  keyGenerator: (req: Request) => {
    // Rate limit by auth token if present, otherwise by IP
    const token = req.headers['x-auth-token'] as string;
    return token || req.ip || 'unknown';
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
```

---

### Step 18: Create Idempotency Middleware
**File:** `src/middleware/idempotency.ts`

**Requirements:**
- Check `Idempotency-Key` header
- Hash request body to detect payload changes
- Return cached response if duplicate (200/201, NOT 409)
- Intercept `res.json()` to store response

**Implementation:**
```typescript
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { idempotencyStore } from '../services/idempotency-store';
import { logger } from '../utils/logger';

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
  } catch (error) {
    // If payload hash conflict detected, idempotency-store will throw
    logger.error({ error, idempotencyKey }, 'Idempotency check failed');
    return res.status(409).json({
      status: 'error',
      code: 'IDEMPOTENCY_CONFLICT',
      message: 'Idempotency key reused with different payload'
    });
  }
}
```

---

### Step 19: Create Ingest Route Handler
**File:** `src/routes/ingest.ts`

**Requirements:**
- POST `/oa-handoff` endpoint
- Validate payload with Zod schema
- Call `findOrCreateTicket()` from ticket-service
- Return structured response with ticket details

**Implementation:**
```typescript
import { Router, Request, Response } from 'express';
import { ingestPayloadSchema } from '../schemas/ingest-schemas';
import { findOrCreateTicket } from '../services/ticket-service';
import { ValidationError } from '../errors/custom-errors';
import { logger } from '../utils/logger';

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

  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn({ error: error.message, details: error.details }, 'Validation error');
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.details
      });
    }

    logger.error({ error }, 'Ingest request failed');
    return res.status(500).json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    });
  }
});
```

---

### Step 20: Create Health Check Routes
**File:** `src/routes/health.ts`

**Requirements:**
- GET `/healthz` - Basic health check (always 200)
- GET `/readyz` - Readiness check (verify helpdesk connectivity)

**Implementation:**
```typescript
import { Router, Request, Response } from 'express';
import { helpdeskClient } from '../services/helpdesk-client';
import { logger } from '../utils/logger';

export const healthRouter = Router();

// Basic health check (liveness probe)
healthRouter.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'ispn-helpdesk-bridge',
    timestamp: new Date().toISOString()
  });
});

// Readiness check (verify dependencies)
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
  } catch (error) {
    logger.error({ error }, 'Readiness check failed');
    res.status(503).json({
      status: 'unavailable',
      service: 'ispn-helpdesk-bridge',
      error: 'Readiness check failed',
      timestamp: new Date().toISOString()
    });
  }
});
```

---

### Step 21: Create HTTP Server Entry Point
**File:** `src/http-server.ts`

**Requirements:**
- Express app with helmet security headers
- Raw body parser for HMAC validation
- Request logging middleware
- Health routes (no auth)
- Protected ingest routes (with auth, rate limiting, idempotency)
- Global error handler
- Graceful shutdown

**Implementation:**
```typescript
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { logger } from './utils/logger';
import { authMiddleware } from './middleware/auth';
import { rateLimiter } from './middleware/rate-limit';
import { idempotencyMiddleware } from './middleware/idempotency';
import { ingestRouter } from './routes/ingest';
import { healthRouter } from './routes/health';
import { ValidationError, HelpdeskError } from './errors/custom-errors';
import { ticketStore } from './services/ticket-store';
import { idempotencyStore } from './services/idempotency-store';

const app = express();

// Security headers
app.use(helmet());

// Trust proxy (for rate limiting by IP)
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

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutdown signal received, closing server gracefully');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Cleanup stores
  ticketStore.destroy();
  idempotencyStore.destroy();

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000); // Force exit after 30 seconds
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

---

### Phase 5 Testing Requirements

After completing all steps 15-21, run comprehensive tests:

#### Integration Tests to Create:
**File:** `tests/integration/http-server.test.ts`

**Test Cases (15 tests minimum):**
1. ✅ Health check (GET /healthz → 200)
2. ✅ Readiness check (GET /readyz → 200 when healthy)
3. ✅ Readiness check (GET /readyz → 503 when unhealthy)
4. ✅ Auth required (POST /ingest/oa-handoff without auth → 401)
5. ✅ Invalid token (POST with bad x-auth-token → 401)
6. ✅ Invalid HMAC signature (POST with bad x-signature → 401/403)
7. ✅ Expired timestamp (POST with old x-timestamp → 403)
8. ✅ Happy path create (POST with valid payload → 200, created:true)
9. ✅ Idempotent replay (same Idempotency-Key → 200, same response)
10. ✅ Idempotency conflict (same key, different payload → 409)
11. ✅ Append path (same oaKey, new note → 200, created:false)
12. ✅ Category inference (note with "wifi" → WiFi category)
13. ✅ Escalation inference (note with "agent" → CallerRequested)
14. ✅ Invalid phone (non-E.164 → 400)
15. ✅ Rate limiting (11+ rapid requests → 429)

#### Manual Testing:
```bash
# 1. Start HTTP server
npm run dev:http

# 2. Test health endpoints
curl http://localhost:3000/healthz
curl http://localhost:3000/readyz

# 3. Test with valid token
curl -X POST http://localhost:3000/ingest/oa-handoff \
  -H "Content-Type: application/json" \
  -H "x-auth-token: your-token-here" \
  -d '{
    "note": "Category: WiFi\nReason: CallerRequested\nSummary: Test\nConfidence: 0.85",
    "oaKey": "test-key-123",
    "source": "OutageAgent"
  }'

# 4. Test rate limiting (run 11+ times rapidly)
for i in {1..12}; do curl -X POST http://localhost:3000/ingest/oa-handoff -H "x-auth-token: test"; done
```

#### Success Criteria:
- ✅ All 15 integration tests pass
- ✅ Manual curl tests work as expected
- ✅ Server starts without errors
- ✅ Logs are structured and PII-free
- ✅ Graceful shutdown works (Ctrl+C)

**DO NOT PROCEED TO PHASE 6 UNTIL ALL PHASE 5 TESTS PASS**

---

## Phase 6: MCP Tools Implementation (Steps 22-26)

### Step 22: Create Helpdesk Create Ticket Tool
**File:** `src/tools/helpdesk-create-ticket.ts`

**Requirements:**
- MCP tool definition with Zod schema
- Call `helpdeskClient.createTicket()` directly
- Return ticket ID and URL

**Implementation:**
```typescript
import { z } from 'zod';
import { helpdeskClient } from '../services/helpdesk-client';
import { createTicketInputSchema } from '../schemas/tool-schemas';
import { logger } from '../utils/logger';

export const createTicketTool = {
  definition: {
    name: 'helpdesk.create_ticket',
    description: 'Create a new helpdesk ticket (bypasses deduplication)',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Ticket description (10-1000 characters)'
        },
        category: {
          type: 'string',
          enum: ['Outage', 'WiFi', 'CGNAT', 'Wiring', 'EquipmentReturn', 'Unknown']
        },
        escalationReason: {
          type: 'string',
          enum: ['CallerRequested', 'TwoStepsNoResolve', 'OutOfScope', 'SafetyRisk', 'BillingOrAccount', 'Other']
        },
        callerNumber: {
          type: 'string',
          description: 'E.164 phone number (optional)'
        },
        source: {
          type: 'string',
          enum: ['ATOM', 'OutageAgent', 'Other'],
          default: 'Other'
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata (optional)'
        }
      },
      required: ['description', 'category', 'escalationReason']
    }
  },

  async handler(args: unknown) {
    try {
      // Validate input
      const input = createTicketInputSchema.parse(args);

      logger.info({ category: input.category }, 'Creating helpdesk ticket');

      // Create ticket
      const result = await helpdeskClient.createTicket(input);

      logger.info({ ticketId: result.ticketId }, 'Ticket created successfully');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            ticketId: result.ticketId,
            ticketUrl: result.ticketUrl,
            category: input.category,
            escalationReason: input.escalationReason
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to create ticket');

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
```

---

### Step 23: Create Helpdesk Append Note Tool
**File:** `src/tools/helpdesk-append-note.ts`

**Requirements:**
- MCP tool definition with Zod schema
- Call `helpdeskClient.appendNote()`
- Return success status

**Implementation:**
```typescript
import { z } from 'zod';
import { helpdeskClient } from '../services/helpdesk-client';
import { appendNoteInputSchema } from '../schemas/tool-schemas';
import { logger } from '../utils/logger';

export const appendNoteTool = {
  definition: {
    name: 'helpdesk.append_note',
    description: 'Append a note to an existing helpdesk ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'Ticket ID to append note to'
        },
        note: {
          type: 'string',
          description: 'Note content (10-350 characters)'
        },
        author: {
          type: 'string',
          description: 'Note author (optional, defaults to "ISPN-Agent")'
        }
      },
      required: ['ticketId', 'note']
    }
  },

  async handler(args: unknown) {
    try {
      // Validate input
      const input = appendNoteInputSchema.parse(args);

      logger.info({ ticketId: input.ticketId }, 'Appending note to ticket');

      // Append note
      const result = await helpdeskClient.appendNote(input);

      logger.info({ ticketId: input.ticketId }, 'Note appended successfully');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            message: result.message,
            ticketId: input.ticketId
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to append note');

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
```

---

### Step 24: Create Helpdesk Find or Create Ticket Tool
**File:** `src/tools/helpdesk-find-or-create-ticket.ts`

**Requirements:**
- MCP tool definition with Zod schema
- Call `findOrCreateTicket()` from ticket-service
- Return ticket details with `created` flag

**Implementation:**
```typescript
import { z } from 'zod';
import { findOrCreateTicket } from '../services/ticket-service';
import { findOrCreateTicketInputSchema } from '../schemas/tool-schemas';
import { logger } from '../utils/logger';

export const findOrCreateTicketTool = {
  definition: {
    name: 'helpdesk.find_or_create_ticket',
    description: 'Find existing ticket by oaKey/caller or create new ticket (with deduplication)',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Ticket description (10-1000 characters)'
        },
        category: {
          type: 'string',
          enum: ['Outage', 'WiFi', 'CGNAT', 'Wiring', 'EquipmentReturn', 'Unknown']
        },
        escalationReason: {
          type: 'string',
          enum: ['CallerRequested', 'TwoStepsNoResolve', 'OutOfScope', 'SafetyRisk', 'BillingOrAccount', 'Other']
        },
        callerNumber: {
          type: 'string',
          description: 'E.164 phone number (optional)'
        },
        oaKey: {
          type: 'string',
          description: 'Outage Agent key for deduplication (optional)'
        },
        source: {
          type: 'string',
          enum: ['ATOM', 'OutageAgent', 'Other'],
          default: 'Other'
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata (optional)'
        }
      },
      required: ['description']
    }
  },

  async handler(args: unknown) {
    try {
      // Validate input
      const input = findOrCreateTicketInputSchema.parse(args);

      logger.info({
        oaKey: input.oaKey,
        callerNumber: input.callerNumber
      }, 'Finding or creating ticket');

      // Find or create ticket
      const result = await findOrCreateTicket(input);

      logger.info({
        ticketId: result.ticketId,
        created: result.created
      }, 'Ticket found or created');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            created: result.created,
            ticketId: result.ticketId,
            ticketUrl: result.ticketUrl,
            message: result.created
              ? 'New ticket created'
              : 'Existing ticket found (deduplication)'
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to find or create ticket');

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
```

---

### Step 25: Create Ingest Render Note Tool
**File:** `src/tools/ingest-render-note.ts`

**Requirements:**
- MCP tool definition with Zod schema
- Call `renderNote()` from note-processor
- Return formatted 4-line note

**Implementation:**
```typescript
import { z } from 'zod';
import { renderNote } from '../services/note-processor';
import { renderNoteInputSchema } from '../schemas/tool-schemas';
import { logger } from '../utils/logger';

export const renderNoteTool = {
  definition: {
    name: 'ingest.render_note',
    description: 'Render a 4-line formatted note from components',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category value'
        },
        escalationReason: {
          type: 'string',
          description: 'Escalation reason value'
        },
        summary: {
          type: 'string',
          description: 'Summary text (will be validated for length)'
        },
        confidence: {
          type: 'string',
          description: 'Confidence score as string (0.0-1.0)'
        }
      },
      required: ['category', 'escalationReason', 'summary', 'confidence']
    }
  },

  async handler(args: unknown) {
    try {
      // Validate input
      const input = renderNoteInputSchema.parse(args);

      logger.info('Rendering note');

      // Render note
      const note = renderNote(input);

      logger.info('Note rendered successfully');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            note,
            charCount: note.length,
            lineCount: note.split('\n').length
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to render note');

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
```

---

### Step 26: Create Ingest OA Handoff Tool
**File:** `src/tools/ingest-oa-handoff.ts`

**Requirements:**
- MCP tool definition with Zod schema
- Combines rendering + finding/creating ticket
- Return complete ticket response

**Implementation:**
```typescript
import { z } from 'zod';
import { findOrCreateTicket } from '../services/ticket-service';
import { oaHandoffInputSchema } from '../schemas/tool-schemas';
import { logger } from '../utils/logger';

export const oaHandoffTool = {
  definition: {
    name: 'ingest.oa_handoff',
    description: 'Complete OA handoff: render note and find/create ticket',
    inputSchema: {
      type: 'object',
      properties: {
        note: {
          type: 'string',
          description: '4-line formatted note (≤350 chars)'
        },
        category: {
          type: 'string',
          enum: ['Outage', 'WiFi', 'CGNAT', 'Wiring', 'EquipmentReturn', 'Unknown']
        },
        escalationReason: {
          type: 'string',
          enum: ['CallerRequested', 'TwoStepsNoResolve', 'OutOfScope', 'SafetyRisk', 'BillingOrAccount', 'Other']
        },
        confidence: {
          type: 'string',
          description: 'Confidence score as string (0.0-1.0)',
          default: '0.0'
        },
        callerNumber: {
          type: 'string',
          description: 'E.164 phone number (optional)'
        },
        oaKey: {
          type: 'string',
          description: 'Outage Agent key (optional)'
        },
        source: {
          type: 'string',
          enum: ['ATOM', 'OutageAgent', 'Other'],
          default: 'OutageAgent'
        }
      },
      required: ['note']
    }
  },

  async handler(args: unknown) {
    try {
      // Validate input
      const input = oaHandoffInputSchema.parse(args);

      logger.info({
        oaKey: input.oaKey,
        source: input.source
      }, 'Processing OA handoff');

      // Find or create ticket
      const result = await findOrCreateTicket({
        description: input.note,
        category: input.category,
        escalationReason: input.escalationReason,
        callerNumber: input.callerNumber,
        oaKey: input.oaKey,
        source: input.source,
        metadata: {
          confidence: input.confidence,
          handoffAt: new Date().toISOString()
        }
      });

      logger.info({
        ticketId: result.ticketId,
        created: result.created
      }, 'OA handoff completed');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            created: result.created,
            ticketId: result.ticketId,
            ticketUrl: result.ticketUrl,
            category: input.category || 'Unknown',
            escalationReason: input.escalationReason || 'Other',
            confidence: input.confidence || '0.0',
            echo: {
              oaKey: input.oaKey,
              callerNumber: input.callerNumber
            }
          }, null, 2)
        }]
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'OA handoff failed');

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
```

---

### Phase 6 Testing Requirements

After completing all steps 22-26, run comprehensive tests:

#### Unit Tests to Create:
**File:** `tests/unit/mcp-tools.test.ts`

**Test Cases (10+ tests):**
1. ✅ Create ticket tool with valid input
2. ✅ Create ticket tool with invalid input (validation error)
3. ✅ Append note tool with valid ticket ID
4. ✅ Append note tool with non-existent ticket (error)
5. ✅ Find or create tool creates new ticket
6. ✅ Find or create tool finds existing ticket by oaKey
7. ✅ Find or create tool finds existing ticket by caller+category
8. ✅ Render note tool with valid components
9. ✅ Render note tool with note > 350 chars (error)
10. ✅ OA handoff tool complete flow

#### Manual Testing with MCP Inspector:
```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Test MCP server
npx @modelcontextprotocol/inspector tsx src/mcp-server.ts

# Test each tool in the inspector UI
```

#### Success Criteria:
- ✅ All 10+ unit tests pass
- ✅ MCP Inspector shows all 5 tools
- ✅ Each tool works in Inspector
- ✅ Error handling works correctly

**DO NOT PROCEED TO PHASE 7 UNTIL ALL PHASE 6 TESTS PASS**

---

## Phase 7: MCP Server Entry Point (Step 27)

### Step 27: Create MCP Server
**File:** `src/mcp-server.ts`

**Requirements:**
- Separate process from HTTP server
- Stdio transport for Claude Desktop
- Register all 5 tools
- Request logging
- Error handling

**Implementation:**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from './utils/logger';

// Import tool handlers
import { createTicketTool } from './tools/helpdesk-create-ticket';
import { appendNoteTool } from './tools/helpdesk-append-note';
import { findOrCreateTicketTool } from './tools/helpdesk-find-or-create-ticket';
import { renderNoteTool } from './tools/ingest-render-note';
import { oaHandoffTool } from './tools/ingest-oa-handoff';

const server = new Server(
  {
    name: 'ispn-helpdesk-bridge',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools/list handler
server.setRequestHandler('tools/list', async () => {
  logger.info('Listing available tools');

  return {
    tools: [
      createTicketTool.definition,
      appendNoteTool.definition,
      findOrCreateTicketTool.definition,
      renderNoteTool.definition,
      oaHandoffTool.definition,
    ],
  };
});

// Register tools/call handler
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  logger.info({ tool: name }, 'MCP tool called');

  try {
    switch (name) {
      case 'helpdesk.create_ticket':
        return await createTicketTool.handler(args);

      case 'helpdesk.append_note':
        return await appendNoteTool.handler(args);

      case 'helpdesk.find_or_create_ticket':
        return await findOrCreateTicketTool.handler(args);

      case 'ingest.render_note':
        return await renderNoteTool.handler(args);

      case 'ingest.oa_handoff':
        return await oaHandoffTool.handler(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    logger.error({ error: error.message, tool: name }, 'Tool execution failed');
    throw error;
  }
});

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('MCP server started on stdio');
  } catch (error) {
    logger.error({ error }, 'Failed to start MCP server');
    process.exit(1);
  }
}

main();
```

---

### Phase 7 Testing Requirements

After completing step 27, test MCP server:

#### Integration Test with Claude Desktop:
1. Build the project: `npm run build`
2. Add to Claude Desktop config:
```json
{
  "mcpServers": {
    "ispn-helpdesk": {
      "command": "node",
      "args": ["/absolute/path/to/dist/mcp-server.js"]
    }
  }
}
```
3. Restart Claude Desktop
4. Test each tool via Claude chat

#### Manual Testing:
```bash
# Test with MCP Inspector
npx @modelcontextprotocol/inspector tsx src/mcp-server.ts

# Test tools/list
# Test each tool with sample data
```

#### Success Criteria:
- ✅ Server starts without errors
- ✅ Claude Desktop can connect
- ✅ All 5 tools visible in Claude
- ✅ Each tool executes successfully
- ✅ Error messages are clear

**DO NOT PROCEED TO PHASE 8 UNTIL MCP SERVER WORKS IN CLAUDE DESKTOP**

---

## Phase 8: Configuration & Environment (Step 28)

### Step 28: Create Environment Configuration
**File:** `.env.example`

**Requirements:**
- Document all environment variables
- Provide example values
- Include security notes

**Implementation:**
```bash
# ISPN Helpdesk Bridge MCP - Environment Configuration

# === Server Configuration ===
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# === Authentication ===
# Shared token authentication (for simple clients)
AUTH_TOKEN=your-secret-token-here-change-in-production

# HMAC signature authentication (for webhook security)
WEBHOOK_SECRET=your-webhook-secret-here-change-in-production

# === Helpdesk API Configuration ===
# Replace with your actual helpdesk API credentials
HELPDESK_API_URL=https://helpdesk.example.com/api/v1
HELPDESK_API_KEY=your-helpdesk-api-key-here

# === Security Settings ===
# HMAC replay attack window (milliseconds)
REPLAY_WINDOW_MS=300000  # 5 minutes

# === Storage Configuration ===
# Ticket cache TTL (hours)
TICKET_TTL_HOURS=4

# Idempotency cache TTL (minutes)
IDEMPOTENCY_TTL_MINUTES=15

# === Rate Limiting ===
# Requests per second per client
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW_MS=1000

# === IMPORTANT SECURITY NOTES ===
# 1. Never commit .env file to version control
# 2. Use strong, random values for AUTH_TOKEN and WEBHOOK_SECRET
# 3. Rotate secrets regularly in production
# 4. Use environment-specific .env files (.env.production, .env.staging)
# 5. Consider using a secrets management service (AWS Secrets Manager, Vault, etc.)

# === Generate Secure Secrets (Linux/Mac) ===
# AUTH_TOKEN: openssl rand -hex 32
# WEBHOOK_SECRET: openssl rand -hex 32
```

---

### Phase 8 Testing Requirements

After creating .env.example:

#### Configuration Tests:
1. ✅ Copy `.env.example` to `.env`
2. ✅ Set valid values for all variables
3. ✅ Start HTTP server - verify it reads env vars
4. ✅ Start MCP server - verify it reads env vars
5. ✅ Test auth with configured token
6. ✅ Test HMAC with configured secret

#### Success Criteria:
- ✅ `.env.example` is complete and documented
- ✅ All env vars have clear descriptions
- ✅ Security notes are prominent
- ✅ Both servers read env vars correctly

**DO NOT PROCEED TO PHASE 9 UNTIL CONFIGURATION IS COMPLETE**

---

## Phase 9: Documentation (Steps 29-32)

### Step 29: Create OpenAPI Specification
**File:** `docs/openapi.yaml`

**Requirements:**
- Complete OpenAPI 3.0 spec for HTTP API
- Document all endpoints, schemas, responses
- Include authentication schemes
- Provide example requests/responses

**Implementation:** (See full spec in original document, lines 777-817)

---

### Step 30: Create Deployment Guide
**File:** `docs/DEPLOYMENT.md`

**Requirements:**
- Environment setup instructions
- Production configuration checklist
- Process management (PM2)
- Monitoring and alerting
- Security considerations
- Scaling guidelines

**Key Sections:**
1. Prerequisites (Node.js version, dependencies)
2. Environment setup
3. Building for production (`npm run build`)
4. Process management (PM2 configuration)
5. Reverse proxy setup (nginx example)
6. SSL/TLS configuration
7. Monitoring (health checks, metrics)
8. Logging (log rotation, aggregation)
9. Backup and recovery
10. Scaling strategies (Redis for multi-instance)

---

### Step 31: Create Integration Guide
**File:** `docs/INTEGRATION.md`

**Requirements:**
- ElevenLabs webhook setup
- Claude Desktop configuration
- Example integration flows
- Troubleshooting guide

**Key Sections:**
1. ElevenLabs Agent Configuration
   - Webhook URL setup
   - Authentication configuration
   - Payload format
2. Claude Desktop Configuration
   - MCP server installation
   - Config file location
   - Tool availability
3. Example Integration Flows
   - OA handoff workflow
   - Direct ticket creation
   - Note appending
4. Troubleshooting
   - Common errors
   - Debug logging
   - Health check usage

---

### Step 32: Create Main README
**File:** `README.md`

**Requirements:**
- Project overview
- Architecture diagram
- Quick start guide
- Configuration reference
- API documentation links
- Development workflow
- Testing guide
- Deployment instructions

**Key Sections:**
1. Overview
2. Architecture (HTTP + MCP servers)
3. Features
4. Quick Start
5. Configuration
6. API Reference (link to OpenAPI)
7. MCP Tools Reference
8. Development
9. Testing
10. Deployment
11. Troubleshooting
12. Contributing
13. License

---

### Phase 9 Testing Requirements

After creating all documentation:

#### Documentation Review:
1. ✅ Read through all docs for completeness
2. ✅ Follow Quick Start guide from scratch
3. ✅ Verify all links work
4. ✅ Test all code examples
5. ✅ Ensure OpenAPI spec matches implementation

#### Success Criteria:
- ✅ All documentation complete
- ✅ Quick Start guide works end-to-end
- ✅ OpenAPI spec accurate
- ✅ No broken links
- ✅ Code examples tested

**DO NOT PROCEED TO PHASE 10 UNTIL DOCS ARE COMPLETE AND TESTED**

---

## Phase 10: Final Polish & Production Readiness (Steps 33-35)

### Step 33: Security Hardening Checklist

**Requirements:**
- ✅ Helmet headers enabled
- ✅ HMAC replay protection (5-minute window)
- ✅ Rate limiting (10 req/sec per client)
- ✅ Input validation (Zod + libphonenumber-js)
- ✅ No secrets in code (all from env vars)
- ✅ PII redaction in logs
- ✅ Timing-safe signature comparison
- ✅ HTTPS in production (reverse proxy)
- ✅ Dependency audit (`npm audit`)
- ✅ Security headers testing (securityheaders.com)

---

### Step 34: Production Readiness Checklist

**Requirements:**
1. ✅ Health checks verify all dependencies
2. ✅ Metrics endpoint for monitoring (optional)
3. ✅ Graceful shutdown handlers (both processes)
4. ✅ Environment variables documented
5. ✅ Docker/Docker Compose setup (optional)
6. ✅ CI/CD pipeline (optional)
7. ✅ Load testing results
8. ✅ Error rate monitoring
9. ✅ Performance benchmarks
10. ✅ Backup/recovery procedures

---

### Step 35: Final Review & Testing

**Requirements:**
- ✅ All 90+ tests passing (75 unit + 15 integration)
- ✅ All error paths tested
- ✅ All logs structured and PII-free
- ✅ All schemas validated
- ✅ README complete and accurate
- ✅ Integration docs clear
- ✅ Security audit passed
- ✅ Load testing passed (1000+ req/min)
- ✅ Both servers start cleanly
- ✅ Both servers shut down gracefully

---

### Phase 10 Testing Requirements

Final comprehensive testing:

#### Full System Test:
```bash
# 1. Run all tests
npm test

# 2. Run integration tests
npm run test:integration

# 3. Start both servers
npm run dev

# 4. Run load test (optional - requires autocannon)
npx autocannon -c 10 -d 60 -m POST \
  -H "x-auth-token: test" \
  -H "Content-Type: application/json" \
  -b '{"note":"..."}' \
  http://localhost:3000/ingest/oa-handoff

# 5. Test MCP server in Claude Desktop
# 6. Test graceful shutdown (Ctrl+C)
# 7. Verify logs are clean
# 8. Run security audit
npm audit

# 9. Check for outdated dependencies
npm outdated
```

#### Success Criteria:
- ✅ All tests pass
- ✅ No security vulnerabilities
- ✅ Load test handles 1000+ req/min
- ✅ Graceful shutdown works
- ✅ Logs are clean and structured
- ✅ Documentation is accurate
- ✅ Ready for production deployment

---

## Summary

**Total Remaining Steps:** 24 steps across 6 phases

**Phases:**
- Phase 5: HTTP Server (Steps 15-21) - 7 steps
- Phase 6: MCP Tools (Steps 22-26) - 5 steps
- Phase 7: MCP Server (Step 27) - 1 step
- Phase 8: Configuration (Step 28) - 1 step
- Phase 9: Documentation (Steps 29-32) - 4 steps
- Phase 10: Final Polish (Steps 33-35) - 3 steps

**Estimated Time:**
- Phase 5: 2-3 hours
- Phase 6: 2-3 hours
- Phase 7: 1 hour
- Phase 8: 30 minutes
- Phase 9: 2-3 hours
- Phase 10: 1-2 hours

**Total Estimated Time:** 9-13 hours

---

## Development Workflow

**For Each Phase:**
1. Implement all steps in the phase
2. Run comprehensive tests (unit + integration)
3. Fix any issues found
4. Re-run tests until all pass
5. Document any changes
6. Commit to version control
7. Only proceed to next phase when all tests pass

**DO NOT SKIP TESTING BETWEEN PHASES**

---

## Success Criteria for Completion

**Project is complete when:**
- ✅ All 38 steps implemented (1-38)
- ✅ All 90+ tests passing
- ✅ HTTP server functional
- ✅ MCP server works in Claude Desktop
- ✅ All documentation complete
- ✅ Security audit passed
- ✅ Load testing passed
- ✅ Production deployment guide ready

**Current Status:** 14/38 steps complete (37%)
**Remaining:** 24 steps (63%)

---

**Generated:** 2025-11-11
**Last Updated:** After Phase 4 completion
