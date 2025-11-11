# Claude Skill Templates

Ready-to-use templates for creating custom Claude Skills. Each template follows Anthropic's specification and includes proper YAML frontmatter, structured instructions, and examples.

## Available Templates

### 1. Basic Template
**Path:** `basic-template/`
**Use for:** Simple skills with straightforward instructions

A minimal starting point with all required sections:
- YAML frontmatter (name, description)
- Overview section
- When to use guidelines
- Step-by-step instructions
- Examples with input/output
- Best practices and guidelines

**Best for:**
- First-time skill creators
- Simple workflows
- Quick proof-of-concepts
- Skills without external dependencies

### 2. Document Processor
**Path:** `document-processor/`
**Use for:** Document creation, formatting, and transformation

A comprehensive template for document-related skills:
- Brand guideline application
- Format conversion (Markdown, Word, PDF)
- Template-based document generation
- Quality validation checks
- File handling examples

**Best for:**
- Company brand guidelines
- Report generation
- Document formatting automation
- Multi-format conversion
- Template-based workflows

**Dependencies:** python-docx, Pillow, markdown

### 3. Data Analyzer
**Path:** `data-analyzer/`
**Use for:** Statistical analysis and data visualization

A complete template for data analysis skills:
- Data loading and validation
- Statistical analysis workflows
- Visualization generation
- Report formatting
- Multiple analysis types (time series, A/B tests, cohorts)

**Best for:**
- Business analytics
- Data science workflows
- Automated reporting
- Exploratory data analysis
- Statistical testing

**Dependencies:** pandas, numpy, matplotlib, seaborn, scipy, statsmodels

## Usage

### Method 1: Copy Template Manually

```bash
# Copy template to new skill directory
cp -r templates/basic-template/ my-new-skill/

# Edit the SKILL.md file
cd my-new-skill/
nano SKILL.md

# Update YAML frontmatter with your skill details
# Customize instructions and examples
# Add resources if needed
```

### Method 2: Use create_skill.py with Template

```bash
# Start with template structure
python create_skill.py

# Or copy template and modify
cp -r templates/document-processor/ ~/.claude/skills/my-doc-skill/
```

### Method 3: Reference While Creating

Use templates as reference while using the interactive skill creator:
```bash
# Keep template open for reference
cat templates/data-analyzer/SKILL.md

# Run creator in another terminal
python create_skill.py
```

## Template Structure

Each template includes:

```
template-name/
├── SKILL.md           # Main skill file with YAML + instructions
└── README.md          # Template-specific usage notes
```

When you use a template, add these directories:
```
your-skill/
├── SKILL.md           # (from template)
├── REFERENCE.md       # Detailed documentation
├── resources/         # Templates, examples, data
│   └── README.md
└── scripts/           # Executable code
    └── README.md
```

## Customization Guide

### Step 1: Update YAML Frontmatter

```yaml
---
name: your-skill-name              # lowercase, hyphens, max 64 chars
description: What and when         # max 1024 chars, be specific!
---
```

**Name Rules:**
- Lowercase letters, numbers, hyphens only
- No "anthropic" or "claude"
- Maximum 64 characters

**Description Tips:**
- Explain WHAT the skill does
- Explain WHEN Claude should use it
- Be specific about trigger conditions
- Maximum 1024 characters

### Step 2: Customize Sections

**Overview:**
- 2-3 sentences about skill purpose
- Why it exists and what problem it solves

**When to Use:**
- List 3-5 specific scenarios
- Be concrete, not generic
- Think about trigger words/phrases

**Instructions:**
- Step-by-step, numbered list
- Be specific and actionable
- Include validation steps
- Handle error cases

**Examples:**
- Show realistic input/output pairs
- Cover different scenarios
- Include edge cases
- Use actual data when possible

**Guidelines:**
- Quality standards
- Constraints and rules
- Best practices
- Error handling approach

### Step 3: Add Resources (Optional)

```bash
mkdir -p your-skill/resources
# Add templates, examples, reference files
```

### Step 4: Add Scripts (Optional)

```bash
mkdir -p your-skill/scripts
# Add Python/shell scripts
chmod +x your-skill/scripts/*.py
```

### Step 5: Test and Install

```bash
# Test locally
cd your-skill
cat SKILL.md  # Review

# Install to Claude Code
cp -r your-skill ~/.claude/skills/

# Or create ZIP for Claude.ai
zip -r your-skill.zip your-skill/
```

## Template Comparison

| Feature | Basic | Document Processor | Data Analyzer |
|---------|-------|-------------------|---------------|
| **Complexity** | Low | Medium | High |
| **Dependencies** | None | 3 packages | 6 packages |
| **Example Length** | Short | Medium | Long |
| **Scripts Needed** | No | Optional | Recommended |
| **Resources Needed** | No | Yes | Optional |
| **Learning Curve** | Easy | Moderate | Advanced |
| **Best Use Case** | Simple tasks | Document work | Data analysis |

## Best Practices

### Start Simple
- Use basic-template for first skill
- Test before adding complexity
- Iterate based on feedback

### Be Specific in Descriptions
- ❌ Bad: "Process documents"
- ✅ Good: "Apply company brand guidelines to Word documents when creating client reports"

### Include Real Examples
- ❌ Bad: "Input: data; Output: result"
- ✅ Good: "Input: sales_data.csv with 1000 rows; Output: Quarterly report with 3 charts showing trends"

### Test Thoroughly
1. Enable skill in Claude
2. Try multiple trigger phrases
3. Check Claude's reasoning to verify skill loads
4. Iterate on description if not triggering correctly

### Keep It Focused
- One skill = one workflow
- Multiple focused skills > one complex skill
- Skills compose automatically

## Examples Gallery

### Example: Company Newsletter Skill

Based on document-processor template:

```yaml
---
name: company-newsletter
description: Create formatted monthly company newsletter from submitted content when user requests internal communications
---

# Company Newsletter Generator

## Instructions
1. Gather newsletter content from user
2. Apply company template (resources/newsletter-template.docx)
3. Format sections: CEO Message, Announcements, Employee Spotlights
4. Add brand colors and logo
5. Generate PDF for distribution
...
```

### Example: Sales Dashboard Skill

Based on data-analyzer template:

```yaml
---
name: sales-dashboard
description: Generate interactive sales dashboard with KPIs when user uploads sales data for visualization
---

# Sales Dashboard Generator

## Instructions
1. Load sales data (CSV or Excel)
2. Calculate KPIs: revenue, growth, top products
3. Create visualizations: trends, regional breakdown, top performers
4. Generate interactive HTML dashboard
5. Export static PDF version
...
```

## Getting Help

- **General Skills Docs:** [Claude-skills.md](../Claude-skills.md)
- **Creation Guide:** [SKILL-CREATION-GUIDE.md](../SKILL-CREATION-GUIDE.md)
- **Best Practices:** [ClaudeSkillsBestPractices.md](../ClaudeSkillsBestPractices.md)
- **Official Examples:** [skills/](../skills/) (15 production skills)
- **Anthropic Docs:** https://docs.claude.com/en/docs/agents-and-tools/agent-skills

## Contributing

Have a useful template to share? Consider adding it to this collection:

1. Create template directory
2. Write comprehensive SKILL.md
3. Add template-specific README
4. Update this index
5. Test with multiple use cases

---

**Templates Version:** 1.0.0
**Last Updated:** 2025-11-11
**Compatible With:** Claude Code, Claude.ai, Claude API
