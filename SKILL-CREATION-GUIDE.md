# Claude Skill Creation Guide

This guide helps you create custom Claude Skills using the included `create_skill.py` generator.

## Quick Start

### Interactive Mode (Recommended)

```bash
python create_skill.py
```

Follow the prompts to create a fully-structured skill with:
- Proper YAML frontmatter
- SKILL.md with instructions and examples
- REFERENCE.md for detailed documentation
- resources/ directory for templates and files
- scripts/ directory for executable code

### What You'll Need

1. **Skill Name** - Human-readable (e.g., "Quarterly Business Reports")
2. **Description** - What it does and when to use it (max 1024 chars)
   - Good: "Creates formatted quarterly business reports with data analysis when user requests financial summaries"
   - Bad: "Makes reports"
3. **Purpose** - Why this skill exists
4. **Instructions** - Step-by-step guidance for Claude
5. **Examples** - Concrete usage scenarios

## Skill Structure

The generator creates this structure:

```
your-skill-name/
├── SKILL.md           # Main file with YAML + instructions (REQUIRED)
├── REFERENCE.md       # Detailed docs (optional, loaded on-demand)
├── .gitignore         # Git ignore rules
├── resources/         # Templates, data files, reference materials
│   └── README.md
└── scripts/           # Executable code (Python, shell, etc.)
    └── README.md
```

## YAML Frontmatter Requirements

Every `SKILL.md` must start with YAML frontmatter:

```yaml
---
name: skill-name              # lowercase, hyphens, max 64 chars
description: What and when    # Non-empty, max 1024 chars
---
```

**Rules:**
- `name`: Only lowercase letters, numbers, hyphens
- `name`: Cannot contain "anthropic" or "claude"
- `name`: Maximum 64 characters
- `description`: Explains both WHAT the skill does AND WHEN to use it
- `description`: Maximum 1024 characters

## Installation Options

### Option 1: Install to Claude Code (Automatic)

When prompted, choose 'y' to install directly:

```bash
Install directly to ~/.claude/skills/? (y/n): y
```

The skill will be immediately available in Claude Code.

### Option 2: Manual Installation

If you chose 'n', install manually:

```bash
# Copy to Claude Code skills directory
cp -r your-skill-name ~/.claude/skills/

# Restart Claude Code or it will auto-load on next use
```

### Option 3: Upload to Claude.ai

Create a ZIP file and upload:

```bash
cd your-skill-name
zip -r ../your-skill-name.zip .
```

Then:
1. Go to Claude.ai
2. Settings > Capabilities > Skills
3. Upload the ZIP file

## Best Practices

### Writing Instructions

**Good Instructions:**
```markdown
## Instructions

1. Ask the user for the quarter and year
2. Read the financial data from provided files
3. Calculate key metrics: revenue, profit, growth rate
4. Generate formatted report using company template
5. Include executive summary with key insights
```

**Poor Instructions:**
```markdown
## Instructions

Make a report with the data.
```

### Writing Descriptions

**Good Description:**
```
Creates comprehensive quarterly business reports with financial analysis,
charts, and executive summaries. Use when user requests formatted financial
reporting for board meetings or stakeholder updates.
```

**Poor Description:**
```
Makes reports
```

### Using Resources

Place in `resources/`:
- Company templates (Word, PowerPoint)
- Brand guidelines
- Example outputs
- Reference data
- Style guides

Claude loads these on-demand, so they don't bloat context.

### Using Scripts

Place in `scripts/`:
- Data processing scripts
- API integrations
- File transformations
- Complex calculations

**Example script structure:**

```python
#!/usr/bin/env python3
"""
Script: calculate_metrics.py
Purpose: Calculate quarterly financial metrics
"""
import sys
import json

def calculate_metrics(data):
    # Your logic here
    return results

if __name__ == "__main__":
    data = json.loads(sys.stdin.read())
    results = calculate_metrics(data)
    print(json.dumps(results))
```

Make it executable:
```bash
chmod +x scripts/calculate_metrics.py
```

Reference in SKILL.md:
```markdown
3. Run the metrics calculation script:
   `python scripts/calculate_metrics.py < data.json`
```

## Progressive Loading Architecture

Skills use a 3-level loading system:

**Level 1: Metadata (Always Loaded)**
- Just the YAML frontmatter (~100 tokens)
- Claude knows the skill exists

**Level 2: Instructions (Loaded When Triggered)**
- Full SKILL.md content (<5k tokens recommended)
- Loaded when Claude determines skill is relevant

**Level 3: Resources (On-Demand)**
- REFERENCE.md, resources/, scripts/
- Loaded only when explicitly needed
- Effectively unlimited size

## Examples

### Example 1: Simple Skill

```yaml
---
name: meeting-notes
description: Creates structured meeting notes with action items when user needs to document meetings
---

# Meeting Notes

## Instructions

1. Ask for meeting details: date, attendees, purpose
2. Structure notes with sections: Overview, Discussion Points, Decisions, Action Items
3. Format action items with owner and deadline
4. Use professional but concise language
```

### Example 2: Skill with Resources

```
skill-with-resources/
├── SKILL.md
├── REFERENCE.md
├── resources/
│   ├── template.docx        # Company template
│   ├── style-guide.md       # Brand guidelines
│   └── example-output.pdf   # Sample output
└── scripts/
    └── format_doc.py        # Document formatter
```

### Example 3: Technical Skill

```yaml
---
name: api-documentation
description: Generates API documentation from code when user needs to document REST endpoints
---

# API Documentation Generator

## Instructions

1. Scan codebase for API route definitions
2. Extract endpoint paths, methods, parameters
3. Generate OpenAPI/Swagger specification
4. Create markdown documentation
5. Include code examples in Python and JavaScript
```

## Testing Your Skill

1. **Verify Structure:**
   ```bash
   ls -la your-skill-name/
   cat your-skill-name/SKILL.md | head -10  # Check YAML
   ```

2. **Test in Claude Code:**
   - Start new chat
   - Give prompt that should trigger skill
   - Look for "Using [skill-name]" in Claude's reasoning
   - Verify behavior matches instructions

3. **Test Explicit Activation:**
   ```
   "Use the meeting-notes skill to document today's standup"
   ```

4. **Refine Based on Results:**
   - If skill doesn't trigger: Improve description
   - If behavior is wrong: Clarify instructions
   - If context too large: Move content to REFERENCE.md

## Common Issues

### Skill Doesn't Load

**Problem:** Skill not appearing in Claude Code

**Solutions:**
- Check YAML frontmatter syntax (must be valid)
- Verify `name` field follows rules (lowercase, hyphens only)
- Ensure `description` is non-empty and <1024 chars
- Restart Claude Code
- Check file is in `~/.claude/skills/your-skill-name/SKILL.md`

### Skill Never Triggers

**Problem:** Claude doesn't use the skill when relevant

**Solutions:**
- Improve `description` to clearly state WHEN to use
- Be more specific about triggering conditions
- Test with explicit prompt: "Use the [skill-name] skill"
- Check for name conflicts with other skills

### Too Much Context

**Problem:** Skill uses too many tokens

**Solutions:**
- Keep SKILL.md under 5k tokens
- Move detailed docs to REFERENCE.md
- Put code in scripts/ directory (only output counts)
- Use progressive loading - reference files instead of embedding

## Advanced Features

### Multiple Resource Files

```markdown
## Instructions

1. For client reports, reference resources/client-template.docx
2. For internal reports, reference resources/internal-template.docx
3. For brand guidelines, read resources/brand-guide.md
```

### Conditional Logic

```markdown
## Instructions

1. Ask user for report type
2. If "financial":
   - Use resources/financial-template.docx
   - Run scripts/calculate_financials.py
3. If "operational":
   - Use resources/operations-template.docx
   - Run scripts/analyze_operations.py
```

### Script Chaining

```markdown
## Instructions

1. Process data: `python scripts/process.py < input.json > processed.json`
2. Analyze: `python scripts/analyze.py < processed.json > analysis.json`
3. Format: `python scripts/format.py < analysis.json > report.md`
```

## Security Considerations

**Only install skills from trusted sources!**

- Audit all files before installation
- Check scripts for malicious code
- Review resource files
- Never run untrusted code
- Skills can execute system commands via scripts

## Getting Help

- **Documentation:** [Claude-skills.md](./Claude-skills.md)
- **Official Docs:** https://docs.claude.com/en/docs/agents-and-tools/agent-skills
- **Skill Spec:** [skills/agent_skills_spec.md](./skills/agent_skills_spec.md)
- **Examples:** See `skills/` directory for 15 production examples

## Reference

- **Anthropic Skills Repo:** https://github.com/anthropics/skills
- **MCP Docs:** https://modelcontextprotocol.io
- **Skill Creation Blog:** https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills

---

**Tool Created:** 2025-11-11
**Compatible With:** Claude Code, Claude.ai, Claude API, Claude Agent SDK
**License:** MIT (for this tool; generated skills use your chosen license)
