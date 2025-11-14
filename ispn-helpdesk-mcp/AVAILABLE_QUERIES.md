# ISPN Helpdesk MCP - Available Queries

**Last Updated:** 2025-11-14
**MCP Server:** ispn-helpdesk-bridge v1.0.0
**Total Tools:** 14 (9 query tools + 5 analytics tools)

This document lists all available queries for the ISPN Helpdesk Model Context Protocol (MCP) server. All tools are read-only and provide natural language query access to ISPN Helpdesk data through Claude Desktop.

---

## Table of Contents

1. [Customer Query Tools](#customer-query-tools) (3 tools)
2. [Ticket Query Tools](#ticket-query-tools) (3 tools)
3. [Network Query Tools](#network-query-tools) (1 tool)
4. [Verification & Metadata Tools](#verification--metadata-tools) (2 tools)
5. [Analytics Tools](#analytics-tools) (5 tools)
6. [Quick Reference](#quick-reference)

---

## Customer Query Tools

### 1. ispn_customer_lookup
**Look up customer by billing ID, phone number, or email address**

**Use Cases:**
- Find customer information when you have any identifier
- Verify customer exists in system
- Get customer ID for other queries

**Parameters:**
- `billid` (optional): Internal Billing ID (e.g., "999")
- `phone` (optional): Phone number in any format (e.g., "+12345678900" or "123-456-7890")
- `email` (optional): Email address (e.g., "customer@example.com")

**Notes:**
- Must provide at least one parameter
- Phone lookup searches all customers (may be slow for large databases)
- Email lookup uses mailbox verification

**Example Queries:**
```
"Look up customer with billid 999"
"Find customer with phone number 555-123-4567"
"Search for customer email jdoe@example.com"
```

---

### 2. ispn_customer_get_details
**Get full customer details including contact info, services, and metadata**

**Use Cases:**
- Retrieve complete customer profile
- Get authorized contacts for verification
- Review customer notes and history

**Parameters:**
- `billid` (required): Internal Billing ID (e.g., "999")

**Returns:**
- Customer basic information
- Additional phone numbers
- Authorized contacts
- Customer notes
- Metadata counts

**Example Queries:**
```
"Get full details for customer 999"
"Show me complete information for billid 12345"
"What are the contacts for customer 999?"
```

---

### 3. ispn_customer_list_tickets
**List all tickets associated with a customer**

**Use Cases:**
- Review customer ticket history
- Find specific ticket by ID
- Understand customer support patterns

**Parameters:**
- `billid` (required): Internal Billing ID (e.g., "999")
- `limit` (optional): Maximum number of tickets to return
- `ticketid` (optional): Filter to specific ticket ID

**Returns:**
- Array of tickets with full details
- Ticket count
- Applied filters

**Example Queries:**
```
"Show all tickets for customer 999"
"List the last 10 tickets for billid 12345"
"Find ticket 54321 for customer 999"
```

---

## Ticket Query Tools

### 4. ispn_ticket_search
**Search tickets by date range across all customers**

**Use Cases:**
- Find tickets created in specific time period
- Analyze ticket volume over time
- Export tickets for reporting

**Parameters:**
- `begin` (required): Begin date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS) - inclusive
- `end` (optional): End date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS) - inclusive
- `hour` (optional): Use hourly segments from begin date (default: false)

**Notes:**
- Must provide either `end` date or set `hour=true`
- Date format: YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
- Returns tickets from all customers

**Example Queries:**
```
"Search tickets from 2025-01-01 to 2025-01-31"
"Find all tickets created on 2025-01-15"
"Show tickets from January 2025"
```

---

### 5. ispn_escalation_list
**List escalations by date range and status**

**Use Cases:**
- Review open escalations requiring attention
- Analyze closed escalations for SLA compliance
- Track escalation trends

**Parameters:**
- `begin` (required): Begin date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS) - inclusive
- `end` (optional): End date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS) - inclusive
- `status` (required): Escalation status - "0" = closed, "1" = open
- `hour` (optional): Use hourly segments from begin date (default: false)

**Notes:**
- Status parameter is required
- Must provide either `end` date or set `hour=true`

**Example Queries:**
```
"Show open escalations from the last 7 days"
"List closed escalations in January 2025"
"Find all open escalations right now"
```

---

### 6. ispn_escalation_get
**Get detailed information about a specific escalation**

**Use Cases:**
- Review escalation details
- Check escalation status and resolution
- Get escalation history

**Parameters:**
- `escid` (required): Escalation ID (e.g., "12345")

**Returns:**
- Complete escalation details
- Associated ticket information
- Resolution notes and times

**Example Queries:**
```
"Get details for escalation 12345"
"Show me escalation 54321"
"What's the status of escalation 98765?"
```

---

## Network Query Tools

### 7. ispn_dhcp_list
**List DHCP reservations and IP assignments**

**Use Cases:**
- Diagnose network connectivity issues
- Verify customer IP assignments
- Check DHCP pool utilization
- Troubleshoot IP conflicts

**Parameters:**
- `billid` (optional): Filter by customer billing ID
- `pool` (optional): Filter by DHCP pool name
- `poolstatus` (optional): Filter by pool status
- `limit` (optional): Maximum number of results
- `ip` (optional): Filter by specific IP address

**Notes:**
- All parameters are optional
- Useful for network diagnostics

**Example Queries:**
```
"List DHCP reservations for customer 999"
"Show IP assignments in pool Pool_A"
"Find who has IP address 192.168.1.100"
"Check DHCP pool utilization"
```

---

## Verification & Metadata Tools

### 8. ispn_query_list_categories
**List all available ticket categories and services**

**Use Cases:**
- See available service types
- View ticket categories for classification
- Refresh category cache

**Parameters:**
- `refresh` (optional): Force refresh cache (default: false)

**Returns:**
- Array of services (Fiber, Email, VoIP, etc.)
- Array of categories with IDs
- Metadata counts

**Example Queries:**
```
"What ticket categories are available?"
"List all service types"
"Show me ticket classifications"
"Refresh categories and show them"
```

---

### 9. ispn_account_check
**Check if username or email exists in ISPN system**

**Use Cases:**
- Verify account existence before operations
- Check email availability
- Validate usernames

**Parameters:**
- `username` (optional): Username to check (e.g., "jdoe")
- `email` (optional): Email address to check (e.g., "jdoe@example.com")

**Notes:**
- Must provide either username or email
- Returns existence status and account type

**Example Queries:**
```
"Check if username jdoe exists"
"Does email customer@example.com exist in the system?"
"Verify account for john.smith"
```

---

## Analytics Tools

### 10. ispn_analytics_ticket_volume
**Analyze ticket volume trends over time**

**Use Cases:**
- Track ticket volume trends (increasing/decreasing/stable)
- Identify peak periods and busiest days
- Capacity planning and resource allocation
- Compare volume across services
- Generate executive reports

**Parameters:**
- `begin` (required): Begin date (YYYY-MM-DD format, e.g., "2025-01-01")
- `end` (optional): End date (YYYY-MM-DD format, defaults to today)
- `granularity` (optional): How to group data - "daily", "weekly", or "monthly" (default: daily)

**Returns:**
- Total tickets and daily average
- Trend analysis (direction and percentage)
- Breakdown by service and category
- Peak periods
- Timeline data for visualization (if <= 31 data points)

**Example Queries:**
```
"Show me ticket volume for the last 30 days"
"Analyze ticket trends from January 2025"
"What's our ticket volume trend by service for the last week?"
"Show monthly ticket volume for Q1 2025"
```

---

### 11. ispn_analytics_escalation_metrics
**Analyze escalation performance metrics**

**Use Cases:**
- Monitor SLA compliance (resolution times)
- Identify repeat customers with chronic issues
- Find slowest resolutions requiring attention
- Track escalation patterns
- Generate performance reports

**Parameters:**
- `begin` (required): Begin date (YYYY-MM-DD format, e.g., "2025-01-01")
- `end` (optional): End date (YYYY-MM-DD format, defaults to today)
- `status` (optional): Filter by status - "0" = closed only, "1" = open only (omit for both)
- `min_escalations_per_customer` (optional): Minimum escalations to flag as repeat customer (default: 2)

**Returns:**
- Average, median, min, max resolution times
- Open vs closed escalation counts
- Resolution time distribution (< 4hr, 4-8hr, 8-24hr, > 24hr)
- Repeat customers with chronic issues (top 10)
- Slowest resolutions (top 10)

**Example Queries:**
```
"Show me escalation metrics for the last month"
"What's our average escalation resolution time?"
"Which customers have had multiple escalations?"
"Analyze escalation performance for January 2025"
```

---

### 12. ispn_analytics_service_health
**Service health dashboard with real-time operational status**

**Use Cases:**
- Daily operational reviews and standup reports
- Resource prioritization (which service needs attention)
- Identify critical services requiring immediate action
- Track service performance over time
- Generate executive health summaries

**Parameters:**
- `days_back` (optional): Number of days to analyze (default: 7 for weekly view)

**Returns:**
- Overall health score (0-100) and status
- Per-service health metrics with scores
- Ticket volume trends by service
- Escalation rates
- Average resolution times
- Actionable recommendations for each service
- Top issues requiring attention

**Health Status Categories:**
- Healthy: 80-100
- Needs Attention: 50-79
- Critical: 0-49

**Example Queries:**
```
"Show me today's service health dashboard"
"What services need attention this week?"
"Generate service health report for the last 7 days"
"Which services are critical right now?"
```

---

### 13. ispn_analytics_time_patterns
**Analyze ticket volume patterns by time of day and day of week**

**Use Cases:**
- Workforce scheduling optimization
- Identify peak staffing periods
- Capacity planning
- Shift schedule optimization
- Resource allocation decisions

**Parameters:**
- `days_back` (optional): Number of days to analyze (default: 30 for monthly patterns)

**Returns:**
- Hourly ticket distribution (24-hour breakdown)
- Day-of-week distribution
- Peak hours (top 5)
- Peak periods (consecutive high-volume hours)
- Busiest/quietest days
- Average tickets per hour
- Staffing recommendations (minimum and optimal)
  - Weekday peak staffing
  - Weekday off-peak staffing
  - Weekend staffing

**Staffing Calculation:**
- Based on 6 tickets/hour/tech capacity
- Provides minimum required and optimal staffing levels

**Example Queries:**
```
"When are our busiest times for the last 30 days?"
"Show me ticket patterns by hour and day"
"How many techs should I staff during peak hours?"
"What are our peak support times?"
```

---

### 14. ispn_analytics_customer_patterns
**Identify customers with repeat issues and chronic problems**

**Use Cases:**
- Proactive customer retention
- Identify at-risk accounts
- Schedule executive reviews for problem accounts
- Detect systemic issues affecting multiple customers
- Customer health monitoring

**Parameters:**
- `days_back` (optional): Number of days to analyze (default: 90 for quarterly view)
- `min_tickets` (optional): Minimum tickets to flag as high-touch customer (default: 5)
- `min_escalations` (optional): Minimum escalations to flag as at-risk (default: 2)

**Returns:**
- High-touch customers (top 20) with:
  - Total tickets and escalations
  - Primary recurring issue
  - Issue frequency
  - Last contact date
  - Recommendation for action
  - Recent ticket history (last 5)
- Issue patterns:
  - Affected customer count
  - Total occurrences
  - Systemic issue indicators
- Top keywords from ticket descriptions
- Summary statistics

**Recommendation Categories:**
- URGENT: 3+ escalations - schedule executive review
- Schedule proactive call - recurring issues
- High volume customer - consider account review
- Monitor for patterns

**Example Queries:**
```
"Which customers need proactive outreach this week?"
"Show me high-touch customers from the last 90 days"
"Identify customers with chronic issues"
"What are common patterns across customer tickets?"
```

---

## Quick Reference

### By Use Case

**Daily Operations:**
- `ispn_analytics_service_health` - Morning standup dashboard
- `ispn_escalation_list` - Open escalations requiring attention
- `ispn_customer_lookup` - Find customer information

**Customer Support:**
- `ispn_customer_lookup` - Find customer by phone/email/ID
- `ispn_customer_get_details` - Get complete customer profile
- `ispn_customer_list_tickets` - Review customer history
- `ispn_escalation_get` - Check escalation details

**Performance Analysis:**
- `ispn_analytics_ticket_volume` - Volume trends and capacity planning
- `ispn_analytics_escalation_metrics` - SLA compliance and resolution times
- `ispn_analytics_time_patterns` - Staffing optimization

**Proactive Management:**
- `ispn_analytics_customer_patterns` - Identify at-risk customers
- `ispn_analytics_service_health` - Resource prioritization

**Network Diagnostics:**
- `ispn_dhcp_list` - IP assignment and DHCP troubleshooting

**Reporting:**
- `ispn_ticket_search` - Export tickets for date range
- `ispn_analytics_ticket_volume` - Executive volume reports
- `ispn_analytics_escalation_metrics` - SLA compliance reports

---

## Date Format Reference

All date parameters use one of these formats:
- **YYYY-MM-DD**: e.g., "2025-01-15"
- **YYYY-MM-DD HH:MM:SS**: e.g., "2025-01-15 14:30:00"

---

## Natural Language Query Examples

### Morning Standup
```
"Good morning, how are we doing?"
→ Uses: ispn_analytics_service_health

"Show me open escalations from today"
→ Uses: ispn_escalation_list
```

### Customer Support
```
"Look up customer with phone 555-123-4567"
→ Uses: ispn_customer_lookup

"Show me all tickets for customer 999"
→ Uses: ispn_customer_list_tickets

"What's the status of escalation 12345?"
→ Uses: ispn_escalation_get
```

### Performance Review
```
"What's our ticket volume trend for the last month?"
→ Uses: ispn_analytics_ticket_volume

"Show me escalation metrics for January 2025"
→ Uses: ispn_analytics_escalation_metrics

"Which services need attention this week?"
→ Uses: ispn_analytics_service_health
```

### Workforce Planning
```
"When are our peak times and how should I staff?"
→ Uses: ispn_analytics_time_patterns

"Show me staffing recommendations for the last 30 days"
→ Uses: ispn_analytics_time_patterns
```

### Customer Retention
```
"Which customers have had multiple escalations recently?"
→ Uses: ispn_analytics_customer_patterns

"Show me high-touch customers needing proactive outreach"
→ Uses: ispn_analytics_customer_patterns
```

### Network Troubleshooting
```
"What IP does customer 999 have?"
→ Uses: ispn_dhcp_list

"Check DHCP pool Pool_A utilization"
→ Uses: ispn_dhcp_list

"Who has IP address 192.168.1.100?"
→ Uses: ispn_dhcp_list
```

---

## Response Format

All tools return JSON responses with this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "metadata": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Configuration

### Environment Variables
Required in Claude Desktop config:
```json
{
  "mcpServers": {
    "ispn-helpdesk": {
      "command": "node",
      "args": ["/path/to/ispn-helpdesk-mcp/dist/mcp-server.js"],
      "env": {
        "ISPN_API_URL": "https://api.helpdesk.ispn.net/exec.pl",
        "ISPN_AUTH_CODE": "your-auth-code-here"
      }
    }
  }
}
```

---

## Support & Documentation

**Primary Documentation:**
- [ISPN_README.md](./ISPN_README.md) - User guide and setup
- [QUICK_START.md](./QUICK_START.md) - 5-minute setup guide
- [ANALYTICS_COMPLETE.md](./ANALYTICS_COMPLETE.md) - Analytics tools implementation
- [DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md) - Developer documentation

**Logs:**
- Location: `~/Library/Logs/Claude/mcp-server-ispn-helpdesk.log`
- Use for troubleshooting connection or query issues

**Questions or Issues:**
- Check logs for error details
- Review documentation for usage examples
- Verify environment variables are set correctly

---

## Version History

**v1.0.0** (2025-11-14)
- 9 read-only query tools
- 5 advanced analytics tools
- 14 total tools available
- Full Claude Desktop integration

---

**Total Available Queries: 14**
- Customer Tools: 3
- Ticket Tools: 3
- Network Tools: 1
- Verification Tools: 2
- Analytics Tools: 5
