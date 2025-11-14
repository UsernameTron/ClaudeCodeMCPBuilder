# ISPN Helpdesk MCP - Analytics & Operational Intelligence Design

**Purpose:** Expand MCP capabilities for trend analysis, employee performance, and operational intelligence

**Target Users:** Tech Center Directors, Operations Managers, Workforce Management, QA Teams

---

## Current State Analysis

### Available ISPN API Commands (Read-Only Focus)

**Ticket Queries:**
- `listtix` - Customer tickets (with limit, ticketid filter)
- `listtixall` - All tickets by date range (XML: billid, ticketid, entrytime, categories, description)
- `listescalall` - Escalations by date/status (XML: escalid, ticketid, status, billid, entrytime, summary, detail, closetime)
- `listescal` - Single escalation by ID

**Customer Queries:**
- `list` - Customer details by billid
- `listphone` - Customer phone contacts
- `listcontacts` - Customer contacts
- `listnotes` - Customer notes

**Service/Category Metadata:**
- `listsupportsvc` - List all support services
- `listsupportcat` - List ticket categories

**Network/Infrastructure:**
- `listdhcp` - DHCP reservations (filter by billid, pool, poolstatus, ip)

**Account Verification:**
- `usercheck` - Username existence
- `mboxcheck` - Mailbox existence

### Critical API Limitations

❌ **No native support for:**
- Technician/agent assignment tracking
- Resolution time calculations
- Performance metrics aggregation
- Customer satisfaction data
- SLA tracking
- First-call resolution data
- Ticket status transitions
- Handle time metrics
- Staffing/capacity data
- Real-time queue metrics

⚠️ **Data Available in XML but Requires Processing:**
- Ticket categorization (service + category)
- Escalation status and timing (entrytime, closetime)
- Customer information (embedded in ticket/escalation details)
- Ticket descriptions (free text, requires parsing)

---

## Proposed MCP Analytics Architecture

### Strategy: Client-Side Analytics Layer

Since the ISPN API doesn't provide aggregated analytics, we'll implement **intelligent data processing** within the MCP:

```
Claude Desktop Query
    ↓
MCP Analytics Tool
    ↓
Multiple ISPN API Calls (parallel)
    ↓
Data Aggregation & Processing
    ↓
Statistical Analysis
    ↓
Formatted Results (charts, trends, insights)
```

---

## Priority 1: High-Impact Query Tools (Implement First)

### 1. Ticket Volume & Trend Analysis
**Tool:** `ispn_analytics_ticket_volume`

**What it does:**
- Fetches all tickets for date range using `listtixall`
- Aggregates by day/week/month
- Groups by service category
- Calculates trends (increasing/decreasing/stable)

**Use Case:**
"Show me ticket volume trends for the last 30 days, broken down by service category"

**Output:**
```json
{
  "period": "2025-01-15 to 2025-02-14",
  "total_tickets": 1250,
  "daily_average": 41.7,
  "trend": "increasing",
  "trend_percentage": "+12.3%",
  "by_service": {
    "Email": {
      "count": 450,
      "percentage": 36,
      "trend": "stable"
    },
    "Internet": {
      "count": 380,
      "percentage": 30.4,
      "trend": "increasing"
    },
    "DHCP": {
      "count": 250,
      "percentage": 20,
      "trend": "decreasing"
    }
  },
  "by_category": {
    "Connectivity": 520,
    "Configuration": 380,
    "Hardware": 200,
    "Other": 150
  },
  "peak_days": [
    {"date": "2025-02-10", "count": 68},
    {"date": "2025-02-03", "count": 62}
  ]
}
```

**Implementation:**
- Input: `begin`, `end`, `granularity` (daily/weekly/monthly)
- Calls: `listtixall`, `listsupportcat`
- Processing: Group by date, service, category; calculate trends

---

### 2. Escalation Performance Metrics
**Tool:** `ispn_analytics_escalation_metrics`

**What it does:**
- Fetches escalations using `listescalall`
- Calculates resolution time (closetime - entrytime)
- Groups by status, billid, date ranges
- Identifies patterns (repeat customers, chronic issues)

**Use Case:**
"Show me escalation resolution times and identify customers with multiple escalations"

**Output:**
```json
{
  "period": "2025-01-01 to 2025-01-31",
  "total_escalations": 45,
  "open": 8,
  "closed": 37,
  "avg_resolution_time_hours": 14.2,
  "resolution_time_distribution": {
    "< 4 hours": 12,
    "4-8 hours": 15,
    "8-24 hours": 8,
    "> 24 hours": 10
  },
  "repeat_customers": [
    {
      "billid": "12345",
      "escalation_count": 5,
      "last_escalation": "2025-01-28",
      "common_issue": "Internet - Connectivity"
    }
  ],
  "slowest_resolutions": [
    {"escalid": "9876", "billid": "555", "hours": 48.5, "issue": "DHCP - Configuration"}
  ]
}
```

**Implementation:**
- Input: `begin`, `end`, `status`, `min_escalations_per_customer`
- Calls: `listescalall`, `list` (for customer names)
- Processing: Calculate time deltas, group by customer, identify patterns

---

### 3. Service Category Health Dashboard
**Tool:** `ispn_analytics_service_health`

**What it does:**
- Combines ticket volume, escalation rate, and DHCP data
- Calculates "health score" for each service
- Identifies problem areas requiring attention

**Use Case:**
"Give me a health dashboard for all services - where should I focus my resources?"

**Output:**
```json
{
  "timestamp": "2025-02-14 10:30:00",
  "period_analyzed": "last 7 days",
  "services": [
    {
      "name": "Email",
      "health_score": 85,
      "status": "healthy",
      "tickets_total": 120,
      "tickets_trend": "stable",
      "escalations": 3,
      "escalation_rate": 2.5,
      "avg_resolution_hours": 4.2,
      "recommendation": "Performing well"
    },
    {
      "name": "Internet",
      "health_score": 62,
      "status": "needs_attention",
      "tickets_total": 180,
      "tickets_trend": "increasing",
      "escalations": 15,
      "escalation_rate": 8.3,
      "avg_resolution_hours": 12.5,
      "recommendation": "High escalation rate - investigate root causes"
    },
    {
      "name": "DHCP",
      "health_score": 45,
      "status": "critical",
      "tickets_total": 95,
      "tickets_trend": "increasing",
      "escalations": 22,
      "escalation_rate": 23.2,
      "avg_resolution_hours": 18.7,
      "dhcp_pool_utilization": 94,
      "recommendation": "CRITICAL: Pool near capacity, high escalation rate"
    }
  ],
  "top_issues": [
    "DHCP pool exhaustion in Pool_A",
    "Internet connectivity spikes on weekends",
    "Email configuration tickets increasing"
  ]
}
```

**Implementation:**
- Input: `days_back` (default: 7)
- Calls: `listtixall`, `listescalall`, `listdhcp`, `listsupportcat`
- Processing: Multi-factor health scoring algorithm

---

### 4. Customer Issue Pattern Analysis
**Tool:** `ispn_analytics_customer_patterns`

**What it does:**
- Identifies customers with repeat issues
- Finds chronic problem patterns
- Recommends proactive interventions

**Use Case:**
"Which customers are having recurring issues and what are the patterns?"

**Output:**
```json
{
  "analysis_period": "90 days",
  "high_touch_customers": [
    {
      "billid": "12345",
      "name": "Acme Corp",
      "total_tickets": 18,
      "total_escalations": 5,
      "primary_issue": "Internet - Connectivity",
      "issue_frequency": "Every 5 days avg",
      "last_contact": "2025-02-12",
      "recommendation": "Schedule network audit - recurring connectivity issues",
      "ticket_history": [
        {"date": "2025-02-12", "issue": "Internet - Connectivity"},
        {"date": "2025-02-07", "issue": "Internet - Connectivity"},
        {"date": "2025-02-01", "issue": "Internet - Speed"}
      ]
    }
  ],
  "issue_patterns": [
    {
      "pattern": "DHCP lease expiration on weekends",
      "affected_customers": 12,
      "recommendation": "Adjust DHCP lease time or pool allocation"
    },
    {
      "pattern": "Email access failures after password changes",
      "affected_customers": 8,
      "recommendation": "Improve password change documentation"
    }
  ]
}
```

**Implementation:**
- Input: `days_back`, `min_tickets`, `min_escalations`
- Calls: `listtix` (per customer), `listescalall`, `list`
- Processing: Pattern detection, frequency analysis, NLP on descriptions

---

### 5. Time-Based Performance Analysis
**Tool:** `ispn_analytics_time_patterns`

**What it does:**
- Analyzes ticket volume by hour, day of week, week of month
- Identifies peak periods and capacity needs
- Helps with staffing optimization

**Use Case:**
"When are our busiest times? How should I schedule staff?"

**Output:**
```json
{
  "period": "last 30 days",
  "hourly_distribution": {
    "08:00": 12,
    "09:00": 45,
    "10:00": 68,
    "11:00": 72,
    "12:00": 58,
    "13:00": 65,
    "14:00": 70,
    "15:00": 62,
    "16:00": 48,
    "17:00": 35
  },
  "day_of_week": {
    "Monday": 180,
    "Tuesday": 165,
    "Wednesday": 155,
    "Thursday": 160,
    "Friday": 145,
    "Saturday": 45,
    "Sunday": 30
  },
  "peak_periods": [
    "Weekdays 10:00-14:00 (avg 66 tickets/hour)",
    "Monday mornings (avg 45 tickets/hour)",
    "End of month (last 3 days see +23% volume)"
  ],
  "staffing_recommendations": {
    "minimum_required": {
      "weekday_peak": 8,
      "weekday_off_peak": 4,
      "weekend": 2
    },
    "optimal": {
      "weekday_peak": 10,
      "weekday_off_peak": 5,
      "weekend": 3
    }
  }
}
```

**Implementation:**
- Input: `days_back`
- Calls: `listtixall`
- Processing: Time-series analysis, binning, capacity calculations

---

## Priority 2: Advanced Analytics (Implement Second)

### 6. Network Performance Aggregator
**Tool:** `ispn_analytics_network_health`

**What it does:**
- Analyzes DHCP pool utilization
- Correlates network tickets with pool status
- Predicts capacity issues

**Use Case:**
"Show me network health and predict when I'll need to expand DHCP pools"

---

### 7. Comparative Period Analysis
**Tool:** `ispn_analytics_compare_periods`

**What it does:**
- Compares two date ranges (week-over-week, month-over-month, year-over-year)
- Shows growth/decline in key metrics
- Identifies seasonal patterns

**Use Case:**
"Compare this month's performance to last month and same month last year"

---

### 8. Top Issues Identifier
**Tool:** `ispn_analytics_top_issues`

**What it does:**
- Parses ticket descriptions using NLP
- Identifies most common keywords/phrases
- Groups similar issues automatically

**Use Case:**
"What are the top 10 issues customers are reporting this week?"

---

### 9. Customer Segmentation Analytics
**Tool:** `ispn_analytics_customer_segments`

**What it does:**
- Groups customers by ticket volume, escalations, service types
- Identifies VIP customers, at-risk customers, satisfied customers
- Enables targeted support strategies

**Use Case:**
"Segment our customer base by support needs and satisfaction"

---

### 10. SLA Compliance Estimator
**Tool:** `ispn_analytics_sla_estimate`

**What it does:**
- Uses resolution time data to estimate SLA compliance
- Identifies tickets at risk of SLA breach
- Recommends prioritization

**Use Case:**
"Which open escalations are at risk of missing our SLA?"

---

## Priority 3: Export & Integration Tools

### 11. Data Export for BI Tools
**Tool:** `ispn_export_powerbi`

**What it does:**
- Exports ticket/escalation data in PowerBI-compatible JSON
- Includes calculated fields for common metrics
- Supports incremental updates

**Use Case:**
"Export this week's ticket data for my PowerBI dashboard"

---

### 12. Batch Customer Lookup
**Tool:** `ispn_batch_customer_lookup`

**What it does:**
- Accepts list of billing IDs
- Returns aggregated customer data
- Parallel API calls for performance

**Use Case:**
"Get details for these 50 customers from my at-risk list"

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. ✅ `ispn_analytics_ticket_volume` - Basic volume trends
2. ✅ `ispn_analytics_escalation_metrics` - Resolution time analysis
3. ✅ `ispn_analytics_time_patterns` - Peak period identification

### Phase 2: Operational Intelligence (Week 3-4)
4. ✅ `ispn_analytics_service_health` - Service health dashboard
5. ✅ `ispn_analytics_customer_patterns` - Repeat issue detection
6. ✅ `ispn_analytics_network_health` - DHCP/network monitoring

### Phase 3: Advanced Analytics (Week 5-6)
7. ✅ `ispn_analytics_compare_periods` - Period-over-period comparison
8. ✅ `ispn_analytics_top_issues` - Issue categorization
9. ✅ `ispn_analytics_sla_estimate` - SLA risk assessment

### Phase 4: Integration & Export (Week 7-8)
10. ✅ `ispn_export_powerbi` - BI tool integration
11. ✅ `ispn_batch_customer_lookup` - Bulk operations
12. ✅ `ispn_analytics_customer_segments` - Customer segmentation

---

## Technical Considerations

### Performance Optimization
- **Caching:** Store processed analytics for 15-60 minutes
- **Parallel API Calls:** Use Promise.all() for multiple date ranges
- **Incremental Loading:** Support pagination for large datasets
- **Smart Sampling:** For very large date ranges, sample data intelligently

### Data Processing Requirements
- **Date/Time Parsing:** Handle ISPN's datetime format consistently
- **XML Parsing:** Robust handling of ticket/escalation XML structures
- **Text Analysis:** Basic NLP for description categorization
- **Statistical Functions:** Mean, median, percentiles, standard deviation

### Error Handling
- **API Rate Limiting:** Implement exponential backoff
- **Partial Data:** Return partial results if some API calls fail
- **Data Quality:** Handle missing fields, malformed XML gracefully
- **User Guidance:** Suggest optimal date ranges to avoid timeouts

---

## Success Metrics

### Operational Impact
- ⏱️ **Time Savings:** Reduce manual report generation from hours to minutes
- 📊 **Data-Driven Decisions:** Enable daily operational reviews instead of weekly
- 🎯 **Proactive Support:** Identify issues before escalations increase
- 👥 **Staffing Optimization:** Data-driven scheduling reduces overtime by 15-20%

### User Adoption
- 🚀 **Query Frequency:** Target 50+ analytics queries per week
- 💬 **Natural Language:** "Show me last week's ticket trends" → instant results
- 📈 **Dashboard Integration:** Export data for existing PowerBI dashboards
- 🔄 **Workflow Integration:** Automated daily/weekly reports via Claude

---

## Example Conversational Queries

```
Director: "How are we performing this week compared to last week?"
→ Uses: ispn_analytics_compare_periods

Director: "Which customers need proactive outreach?"
→ Uses: ispn_analytics_customer_patterns

Director: "Show me our busiest days and recommend staffing levels"
→ Uses: ispn_analytics_time_patterns

Director: "What's our average escalation resolution time by service?"
→ Uses: ispn_analytics_escalation_metrics + ispn_analytics_service_health

Director: "Are we meeting our 24-hour SLA for escalations?"
→ Uses: ispn_analytics_sla_estimate

Director: "Export this month's data for my executive report"
→ Uses: ispn_export_powerbi
```

---

## Next Steps

1. **Validate with stakeholders:** Confirm priority tools match director's needs
2. **API load testing:** Ensure ISPN API can handle parallel analytics queries
3. **Prototype Phase 1 tools:** Build ticket volume & escalation metrics first
4. **User testing:** Get feedback from tech center director on output format
5. **Iterate:** Refine based on real-world usage patterns

---

## Questions for Stakeholders

1. **Performance vs. Technician:** ISPN API doesn't track technician assignments. Do escalations have assignee data in the detail field?
2. **Customer Satisfaction:** Is CSAT data stored in ISPN (tickets, notes)? Or external system?
3. **SLA Definitions:** What are target resolution times for each service/priority?
4. **Staffing Data:** Is staffing tracked in ISPN, or need integration with ADP/UKG?
5. **Real-time vs. Historical:** Should analytics be real-time (slower) or cached (faster)?
