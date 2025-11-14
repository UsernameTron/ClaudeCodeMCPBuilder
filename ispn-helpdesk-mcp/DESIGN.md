# ISPN Helpdesk MCP - Design Overview

**Technical architecture and implementation details**

---

## Table of Contents

1. [Architecture](#architecture)
2. [Data Flow](#data-flow)
3. [Core Components](#core-components)
4. [Analytics Engine](#analytics-engine)
5. [API Integration](#api-integration)
6. [Error Handling](#error-handling)
7. [Performance](#performance)

---

## Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Claude Desktop                            │
│                  (User Interface)                             │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ stdio (JSON-RPC)
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                   MCP Server                                  │
│              (ispn-helpdesk-bridge)                           │
│                                                               │
│  ┌────────────────────────────────────────────────────┐      │
│  │           Tool Registry (14 tools)                 │      │
│  │  • Customer Tools (3)                              │      │
│  │  • Ticket Tools (3)                                │      │
│  │  • Network Tools (1)                               │      │
│  │  • Verification Tools (2)                          │      │
│  │  • Analytics Tools (5)                             │      │
│  └────────────────────┬───────────────────────────────┘      │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────┐      │
│  │          Services Layer                             │      │
│  │  • ISPN Client (API wrapper)                        │      │
│  │  • Category Mapper (caching service)                │      │
│  │  • Analytics Helpers (statistics)                   │      │
│  │  • Phone Normalizer (E.164)                         │      │
│  │  • Logger (structured logging)                      │      │
│  └────────────────────┬───────────────────────────────┘      │
│                       │                                       │
└───────────────────────┼───────────────────────────────────────┘
                        │
                        │ HTTPS
                        │
┌───────────────────────▼───────────────────────────────────────┐
│              ISPN Helpdesk API                                │
│       https://api.helpdesk.ispn.net/exec.pl                   │
│                                                               │
│  • listtixall - List tickets by date range                   │
│  • listescall - List escalations                             │
│  • listdhcp - List DHCP reservations                         │
│  • getbill - Get customer by billing ID                      │
│  • listsupportsvc - List services/categories                 │
│  • checkusername - Verify username                           │
│  • checkmailbox - Verify email                               │
└───────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Runtime & Language:**
- Node.js 18+ (ES modules, async/await)
- TypeScript 5.9 (strict mode)
- Compiled to ES2022 JavaScript

**Core Dependencies:**
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `zod` - Runtime type validation and schema inference
- `pino` - High-performance structured logging
- `axios` - HTTP client with retry logic
- `fast-xml-parser` - XML to JSON conversion

**Development:**
- `tsx` - TypeScript execution for development
- `typescript` - Type checking and compilation
- `@types/*` - Type definitions

---

## Data Flow

### Query Execution Flow

```
1. User asks Claude: "Show me open escalations"
         ↓
2. Claude selects tool: ispn_escalation_list
         ↓
3. Claude sends JSON-RPC request via stdio:
   {
     "method": "tools/call",
     "params": {
       "name": "ispn_escalation_list",
       "arguments": {
         "begin": "2025-11-01",
         "status": "1"
       }
     }
   }
         ↓
4. MCP Server receives request
         ↓
5. Tool handler validates input with Zod schema
         ↓
6. Tool calls ISPN Client service
         ↓
7. ISPN Client makes HTTPS request:
   GET https://api.helpdesk.ispn.net/exec.pl?
       auth=XXX&cmd=listescall&
       begin=2025-11-01&status=1
         ↓
8. ISPN API returns XML response
         ↓
9. ISPN Client parses XML → JSON
         ↓
10. Tool formats response
         ↓
11. MCP Server sends JSON-RPC response to Claude
         ↓
12. Claude presents results to user in natural language
```

### Analytics Flow

```
1. User: "What's our ticket volume trend?"
         ↓
2. ispn_analytics_ticket_volume tool activated
         ↓
3. Parallel data fetching:
   • listTicketsByDateRange(begin, end)
   • getServices() [cached]
   • getCategories() [cached]
         ↓
4. Analytics processing:
   • Group tickets by date
   • Group tickets by service
   • Group tickets by category
   • Calculate trend (first half vs second half)
   • Find peak days
   • Calculate statistics
         ↓
5. Return structured JSON with:
   • Total tickets, daily average
   • Trend direction and percentage
   • Service breakdown with trends
   • Category breakdown
   • Peak periods
   • Timeline data
         ↓
6. Claude formats as natural language summary
```

---

## Core Components

### 1. MCP Server (`src/mcp-server.ts`)

**Responsibilities:**
- Initialize MCP server with stdio transport
- Register all 14 tool definitions
- Route tool calls to appropriate handlers
- Handle graceful shutdown (SIGTERM, SIGINT)
- Log all requests and errors

**Key Code:**
```typescript
const server = new Server(
  { name: 'ispn-helpdesk-bridge', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    customerLookupTool.definition,
    ticketSearchTool.definition,
    // ... 12 more tools
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'ispn_customer_lookup':
      return await customerLookupTool.handler(args);
    // ... handle 13 more tools
  }
});
```

### 2. ISPN Client (`src/services/ispn-client.ts`)

**Responsibilities:**
- Wrap ISPN Helpdesk API
- Make authenticated HTTP requests
- Parse XML responses to typed objects
- Handle API errors gracefully
- Provide type-safe interfaces

**Key Methods:**
```typescript
class ISPNClient {
  // Customer operations
  getCustomerByBillId(billid: string): Promise<CustomerInfo>
  listAllCustomers(): Promise<CustomerInfo[]>
  checkMailbox(email: string): Promise<MailboxCheck>
  checkUsername(username: string): Promise<UsernameCheck>

  // Ticket operations
  listTicketsByDateRange(begin: string, end: string): Promise<TicketInfo[]>
  listTicketsByCustomer(billid: string, limit?: number): Promise<TicketInfo[]>

  // Escalation operations
  listEscalationsByDateRange(begin: string, end: string, status?: string): Promise<EscalationInfo[]>
  getEscalationById(escid: string): Promise<EscalationInfo | null>

  // Network operations
  listDHCP(filters: DHCPFilters): Promise<DHCPReservation[]>
}
```

**API Request Pattern:**
```typescript
async makeRequest<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(this.apiUrl);
  url.searchParams.set('auth', this.authCode);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await axios.get(url.toString());
  const parsed = this.xmlParser.parse(response.data);

  return this.transformResponse(parsed);
}
```

### 3. Category Mapper (`src/services/category-mapper.ts`)

**Responsibilities:**
- Cache service and category lists
- Provide fast lookups without repeated API calls
- Map category IDs to names

**Caching Strategy:**
```typescript
class CategoryMapper {
  private servicesCache: CategoryInfo[] | null = null;
  private categoriesCache: CategoryInfo[] | null = null;

  async getServices(): Promise<CategoryInfo[]> {
    if (this.servicesCache) return this.servicesCache;

    this.servicesCache = await this.fetchServices();
    return this.servicesCache;
  }

  clearCache() {
    this.servicesCache = null;
    this.categoriesCache = null;
  }
}
```

### 4. Analytics Helpers (`src/utils/analytics-helpers.ts`)

**Responsibilities:**
- Statistical calculations (mean, median, stddev)
- Data grouping and aggregation
- Trend detection
- Health score calculation
- Time series analysis

**Key Functions:**
```typescript
// Statistical analysis
calculateStats(values: number[]): Stats {
  mean, median, min, max, stddev
}

// Data grouping
groupTicketsByDate(tickets, granularity): Record<string, Ticket[]>
groupTicketsByService(tickets): Record<string, Ticket[]>
groupTicketsByHour(tickets): Record<number, Ticket[]>
groupTicketsByDayOfWeek(tickets): Record<string, Ticket[]>

// Trend analysis
calculateTrend(current: number, previous: number): TrendInfo {
  direction: 'increasing' | 'decreasing' | 'stable',
  percentage: number
}

// Health scoring
calculateHealthScore(metrics: HealthMetrics): number {
  // 0-100 score based on:
  // - Ticket volume (normalized)
  // - Escalation rate (penalty)
  // - Resolution time (penalty)
  // - Trend direction (modifier)
}

healthStatus(score: number): 'healthy' | 'needs_attention' | 'critical'
```

---

## Analytics Engine

### Statistical Functions

**Mean (Average):**
```typescript
const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
```

**Median:**
```typescript
const sorted = [...values].sort((a, b) => a - b);
const median = sorted.length % 2 === 0
  ? (sorted[mid - 1] + sorted[mid]) / 2
  : sorted[mid];
```

**Standard Deviation:**
```typescript
const variance = values.reduce((sum, v) =>
  sum + Math.pow(v - mean, 2), 0) / values.length;
const stddev = Math.sqrt(variance);
```

### Trend Detection

**Algorithm:**
1. Split dataset into two halves (first half vs second half)
2. Calculate average for each half
3. Compare: `change = ((second - first) / first) * 100`
4. Classify:
   - `> +5%` → "increasing"
   - `< -5%` → "decreasing"
   - Otherwise → "stable"

### Health Score Calculation

**Formula:**
```
Base Score = 100

Penalties:
- High volume: -5 points per 20 tickets above average
- Escalation rate: -2 points per 1% above 5%
- Slow resolution: -1 point per hour above 12hr average
- Increasing trend: -10 points

Bonuses:
- Low escalation rate (<5%): +10 points
- Fast resolution (<4hr avg): +5 points
- Decreasing trend: +10 points

Final Score = max(0, min(100, Base - Penalties + Bonuses))
```

**Health Status:**
- 80-100: Healthy ✅
- 50-79: Needs Attention ⚠️
- 0-49: Critical 🔴

---

## API Integration

### ISPN API Endpoints Used

| Command | Purpose | Response Format |
|---------|---------|----------------|
| `listtixall` | List tickets by date | XML with `<ticket>` elements |
| `listescall` | List escalations | XML with `<escalation>` elements |
| `getbill` | Get customer info | XML with `<billinfo>` |
| `listdhcp` | List DHCP reservations | XML with `<dhcp>` elements |
| `listsupportsvc` | List services | XML with `<service>` elements |
| `listsupportcat` | List categories | XML with `<category>` elements |
| `checkusername` | Verify username | XML with existence status |
| `checkmailbox` | Verify email | XML with existence status |

### XML Parsing

**Input (ISPN API):**
```xml
<tickets>
  <ticket>
    <ticketid>12345</ticketid>
    <billid>999</billid>
    <entrytime>2025-11-14 10:30:00</entrytime>
    <categories>
      <service>Internet</service>
      <category>Connectivity</category>
    </categories>
    <description>Customer unable to connect</description>
  </ticket>
</tickets>
```

**Output (TypeScript):**
```typescript
{
  ticketid: "12345",
  billid: "999",
  entrytime: "2025-11-14 10:30:00",
  categories: {
    service: "Internet",
    category: "Connectivity"
  },
  description: "Customer unable to connect"
}
```

### Date Handling

**ISPN Date Format:** `YYYY-MM-DD HH:MM:SS`

**Parsing:**
```typescript
function parseISPNDate(dateStr: string): Date {
  // "2025-11-14 10:30:00" → Date object
  return new Date(dateStr.replace(' ', 'T'));
}
```

**Time Calculations:**
```typescript
function hoursBetween(start: string, end: string): number {
  const startDate = parseISPNDate(start);
  const endDate = parseISPNDate(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return diffMs / (1000 * 60 * 60);
}
```

---

## Error Handling

### Validation Errors

**Zod Schema Validation:**
```typescript
const inputSchema = z.object({
  billid: z.string().min(1),
  limit: z.number().int().positive().optional()
});

try {
  const input = inputSchema.parse(args);
  // Proceed with validated input
} catch (error) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: error.message
      })
    }],
    isError: true
  };
}
```

### API Errors

**HTTP Request Errors:**
```typescript
try {
  const response = await axios.get(url);
  return this.parseResponse(response.data);
} catch (error) {
  if (axios.isAxiosError(error)) {
    logger.error({
      url,
      status: error.response?.status,
      message: error.message
    }, 'ISPN API request failed');

    throw new Error(`API request failed: ${error.message}`);
  }
  throw error;
}
```

### Graceful Degradation

**Missing Data:**
```typescript
// Default to safe values when data is missing
const service = ticket.categories?.service || 'Unknown';
const avgResolution = resolutionTimes.length > 0
  ? calculateStats(resolutionTimes).mean
  : 0;
```

**Empty Results:**
```typescript
if (!tickets || tickets.length === 0) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        message: 'No tickets found for specified criteria'
      })
    }]
  };
}
```

---

## Performance

### Query Performance

**Typical Response Times:**
- Customer lookup: 100-300ms
- Ticket search (7 days): 500ms-1s
- Escalation list: 300ms-800ms
- Analytics (7 days): 1-2s
- Analytics (30 days): 2-5s
- Analytics (90 days): 5-10s

### Optimization Strategies

**1. Caching:**
```typescript
// Category mapper caches service/category lists
// Avoids repeated API calls during analytics
const services = await categoryMapper.getServices(); // Cached
```

**2. Parallel Requests:**
```typescript
// Fetch multiple resources simultaneously
const [tickets, escalations, services] = await Promise.all([
  client.listTicketsByDateRange(begin, end),
  client.listEscalationsByDateRange(begin, end),
  categoryMapper.getServices()
]);
```

**3. Conditional Data Inclusion:**
```typescript
// Only include timeline for small datasets
timeline: dateCounts.length <= 31 ? dateCounts : undefined
```

**4. Top-N Limiting:**
```typescript
// Return only top 20 high-touch customers
.slice(0, 20)
```

### Memory Considerations

**Large Dataset Handling:**
- Analytics tools process all tickets in memory
- 90-day range ≈ 3,000-10,000 tickets
- Each ticket ≈ 1-2KB
- Total memory: ~10-20MB per query

**Future Enhancements:**
- Streaming processing for very large datasets
- Database-backed caching for repeated queries
- Incremental analysis (process new data only)

---

## Logging

### Structured Logging with Pino

**Log Levels:**
- `error` - API failures, exceptions
- `warn` - Validation failures, missing data
- `info` - Tool execution, major operations
- `debug` - Detailed execution flow

**Log Format:**
```json
{
  "level": 30,
  "time": 1700000000000,
  "pid": 12345,
  "hostname": "server",
  "tool": "ispn_customer_lookup",
  "billid": "999",
  "msg": "Customer found"
}
```

**Logging Locations:**
- stderr for structured logs (captured by Claude Desktop)
- `~/Library/Logs/Claude/mcp-server-ispn-helpdesk.log` (macOS)

---

## Type System

### Key Type Definitions

```typescript
// Customer
interface CustomerInfo {
  billid: string;
  fname: string;
  lname: string;
  email?: string;
  hphone?: string;
  wphone?: string;
  mphone?: string;
  // ... more fields
}

// Ticket
interface TicketInfo {
  ticketid: string;
  billid: string;
  entrytime: string;
  closetime?: string;
  categories?: {
    service?: string;
    category?: string;
  };
  description?: string;
}

// Escalation
interface EscalationInfo {
  escalid: string;
  ticketid: string;
  billid: string;
  entrytime: string;
  closetime?: string;
  summary?: string;
  detail?: string;
}

// DHCP
interface DHCPReservation {
  billid?: string;
  pool?: string;
  poolstatus?: string;
  ip?: string;
  mac?: string;
}

// Statistics
interface Stats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stddev: number;
}

// Trend
interface TrendInfo {
  direction: 'increasing' | 'decreasing' | 'stable';
  percentage: number;
  formatted: string; // e.g., "+12.5%"
}
```

---

## Security

### Read-Only Design

- **No write operations** - Cannot modify ISPN data
- **No credential storage** - Auth code in environment only
- **No user authentication** - Relies on Claude Desktop's auth
- **API key protection** - Never logged or exposed in responses

### Environment Variables

```bash
ISPN_API_URL=https://api.helpdesk.ispn.net/exec.pl
ISPN_AUTH_CODE=secret-auth-code-here
```

**Never commit these values to version control.**

---

## Future Enhancements

### Phase 2 Considerations

**Performance:**
- Redis caching for multi-user deployments
- Database-backed query results cache
- Incremental analytics updates

**Features:**
- Real-time webhooks for ticket updates
- Scheduled report generation
- Export to PowerBI/Tableau
- Agent performance tracking (if ISPN adds this data)

**Scalability:**
- Horizontal scaling with Redis
- Load balancing across MCP instances
- Rate limiting per user

---

## Summary

**Architecture Principles:**
- ✅ Type-safe TypeScript throughout
- ✅ Zod validation for runtime safety
- ✅ Structured logging for observability
- ✅ Graceful error handling
- ✅ Read-only operations only
- ✅ Efficient data processing
- ✅ Clear separation of concerns

**Component Organization:**
- MCP Server: Tool registration and routing
- ISPN Client: API wrapper with XML parsing
- Category Mapper: Caching service
- Analytics Helpers: Statistical functions
- Tools: Individual query implementations

**Data Flow:**
User → Claude → MCP Server → ISPN Client → ISPN API → Results → User

For implementation details, see source code in `src/` directory.
