TASK: Expand the ISPN Helpdesk MCP with 6 new agent performance metrics functions.

SYSTEM CONTEXT:
- This is an MCP (Model Context Protocol) implementation for the ISPN Helpdesk system
- The MCP exposes functions that query an ISPN helpdesk database
- Existing functions include: ispn_ticket_search, ispn_customer_lookup, ispn_escalation_list
- These existing functions serve as the pattern/template for new function implementations

DATABASE INFORMATION:
- Agent/technician name field: [INSERT FROM STEP 1]
- Supervisor/team field: [INSERT FROM STEP 1]
- Query interface: [INSERT FROM STEP 1]
- Ticket status values: open, closed, escalated, etc.
- Escalation indicator: [INSERT FROM STEP 1]

TASK REQUIREMENTS:
Implement 6 new MCP functions for querying agent performance metrics:

1. ispn_agent_metrics_by_name
   Purpose: Get core performance metrics for a specific agent
   Parameters: 
     - agent_name (string, required): Full agent name
     - begin_date (string, required): Start date YYYY-MM-DD
     - end_date (string, required): End date YYYY-MM-DD
   Returns:
     - agent_name (string)
     - tickets_handled (integer)
     - avg_resolution_time_minutes (number)
     - total_closed_tickets (integer)
     - escalation_count (integer)
     - primary_service_lines (array): Top service types by ticket count
     - first_call_resolution_rate (number): Percentage 0-100
   Calculation logic:
     - tickets_handled = COUNT all tickets
     - total_closed_tickets = COUNT where status='closed'
     - avg_resolution_time_minutes = AVG(closetime - entrytime in minutes)
     - escalation_count = COUNT where escalation_indicator is present
     - first_call_resolution_rate = (parent tickets closed / total tickets) * 100
     - primary_service_lines = DISTINCT service ordered by frequency DESC

2. ispn_agent_performance_report
   Purpose: Comprehensive performance summary for an agent
   Parameters:
     - agent_name (string, required)
     - begin_date (string, required): YYYY-MM-DD
     - end_date (string, required): YYYY-MM-DD
   Returns:
     - agent_name (string)
     - total_tickets (integer)
     - avg_resolution_time (number): In minutes
     - closure_rate_percent (number): % of tickets closed
     - escalation_rate_percent (number): % of tickets escalated
     - top_issue_categories (array): Top 5 categories
     - total_handle_time (number): Sum of all resolution times in minutes

3. ispn_agent_service_breakdown
   Purpose: Performance metrics by service type (Fiber, Email, CS, Phone, etc.)
   Parameters:
     - agent_name (string, required)
     - begin_date (string, required): YYYY-MM-DD
     - end_date (string, required): YYYY-MM-DD
   Returns:
     - agent_name (string)
     - tickets_by_service_type (object):
       Example: {"Fiber": 42, "Email": 15, "CS": 8}
     - avg_resolution_time_per_service (object):
       Example: {"Fiber": 125.5, "Email": 45.2, "CS": 89.1}
     - closure_rate_per_service (object):
       Example: {"Fiber": 95.2, "Email": 100, "CS": 87.5}

4. ispn_team_performance_by_agents
   Purpose: Compare performance of all agents on a team
   Parameters:
     - supervisor_name OR team_name (string, required): Identifies the team
     - begin_date (string, required): YYYY-MM-DD
     - end_date (string, required): YYYY-MM-DD
   Returns:
     - team_name (string)
     - supervisor_name (string)
     - agents (array): Each agent object contains all metrics from ispn_agent_metrics_by_name
     - team_totals (object):
       - total_tickets (integer)
       - avg_resolution_time_team (number)
       - total_closed_tickets (integer)
       - team_closure_rate_percent (number)
   Logic: Query all agents assigned to supervisor/team, return individual + aggregated metrics

5. ispn_list_agents
   Purpose: List all agents in system with their supervisor/team assignments
   Parameters:
     - supervisor_name (string, optional): Filter to specific supervisor
     - team_name (string, optional): Filter to specific team
   Returns:
     - agents (array of objects):
       Each agent object contains:
       - agent_name (string)
       - supervisor (string)
       - team (string)
   Logic: Query agent master list or derive unique agents from tickets, sorted alphabetically

6. ispn_agent_queue_status
   Purpose: Current queue and workload status for an agent
   Parameters:
     - agent_name (string, required)
     - date (string, optional): YYYY-MM-DD format, defaults to today
   Returns:
     - agent_name (string)
     - current_tickets_pending (integer): Open/unresolved tickets assigned to agent
     - avg_wait_time (number): In minutes, for pending tickets
     - tickets_closed_today (integer): Tickets closed on specified date
     - current_status (string): If available from system (available/on_break/in_call/offline)

IMPLEMENTATION REQUIREMENTS:
1. Follow the code patterns and style of existing functions in this MCP
2. Use the same error handling framework
3. Return JSON responses matching the specified schemas
4. Include comprehensive docstrings for each function
5. Add input validation (check agent_name exists, validate date format)
6. Add error handling:
   - Agent not found → {"error": "Agent not found", "agent_name": "[name]"}
   - No data in date range → {"message": "No tickets found for specified criteria"}
   - Invalid date format → {"error": "Invalid date format", "expected": "YYYY-MM-DD"}
7. Include unit tests for each function
8. Ensure consistent response formats with existing functions
9. Add proper logging/debugging

CODE STRUCTURE:
- Create one function per MCP tool
- Each function should be self-contained
- Reuse utility functions where possible (date parsing, database queries, metric calculations)
- Create a helper function for common calculations (avg time, closure rates, etc.)

DELIVERABLES:
1. 6 new function implementations
2. Helper functions for shared logic
3. Unit tests for each function
4. Updated MCP tool registry with new tools
5. Updated function documentation/docstrings
6. Integration with existing error handling

START WITH:
1. Review the existing function implementations
2. Create helper functions for common metrics calculations
3. Implement each of the 6 functions
4. Write unit tests
5. Create integration examples

ADDITIONAL GUIDANCE:
- Performance matters: queries should return within 5 seconds even for large date ranges
- Handle edge cases: agents with no tickets, date ranges with no activity
- Prioritize readability and maintainability
- Include comments explaining complex logic
- Test with sample agent names and date ranges