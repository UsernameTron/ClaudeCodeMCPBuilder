# Claude Skills - Quick Start Guide

Fast reference for creating and using Claude Skills.

## 🚀 Using Installed Skills (15 Available)

Skills activate automatically or can be triggered explicitly:

```bash
# Automatic activation
"Extract tables from this PDF"  # → Uses pdf skill

# Explicit activation
"Use the MCP builder skill to create a server"
"Use the canvas design skill to make a logo"

# View installed skills
ls ~/.claude/skills/
```

## 🛠️ Creating Custom Skills (3 Methods)

### Method 1: Interactive Builder (Recommended)

```bash
./build_skill.sh
```

**Features:**
- 6 options: 3 templates, generator, browse examples, exit
- Colored output and helpful prompts
- Auto-creates directory structure
- Shows next steps after creation

### Method 2: Python Generator

```bash
python create_skill.py
# Answer prompts to build custom skill
```

**Features:**
- Full validation (YAML, name, description)
- Custom instructions and examples
- Option to install directly
- Creates complete structure

### Method 3: Copy Template

```bash
# Copy template
cp -r templates/basic-template/ my-skill/

# Edit
nano my-skill/SKILL.md

# Install
cp -r my-skill/ ~/.claude/skills/
```

## 📋 Templates Available

| Template | Use For | Dependencies |
|----------|---------|--------------|
| **basic-template** | Simple workflows | None |
| **document-processor** | Document formatting | python-docx, Pillow, markdown |
| **data-analyzer** | Data analysis | pandas, numpy, matplotlib, seaborn, scipy |

## 📚 Documentation Quick Links

| File | Purpose |
|------|---------|
| [SKILL-CREATION-GUIDE.md](SKILL-CREATION-GUIDE.md) | Complete guide (500+ lines) |
| [SKILLS-SETUP-SUMMARY.md](SKILLS-SETUP-SUMMARY.md) | What's installed and how to use |
| [ClaudeSkillsBestPractices.md](ClaudeSkillsBestPractices.md) | Official best practices |
| [templates/README.md](templates/README.md) | Template usage guide |

## ✅ YAML Requirements

```yaml
---
name: skill-name              # lowercase, hyphens, max 64 chars
description: What and when    # non-empty, max 1024 chars
---
```

**Name Rules:**
- Lowercase letters, numbers, hyphens only
- No "anthropic" or "claude"
- Max 64 characters

**Description Tips:**
- Explain WHAT the skill does
- Explain WHEN to use it
- Be specific about triggers
- Max 1024 characters

## 🏗️ Skill Structure

```
my-skill/
├── SKILL.md           # Required: YAML + instructions
├── REFERENCE.md       # Optional: detailed docs
├── resources/         # Optional: templates, files
│   └── README.md
└── scripts/           # Optional: executable code
    └── README.md
```

## 🧪 Testing Your Skill

1. **Install:**
   ```bash
   cp -r my-skill/ ~/.claude/skills/
   ```

2. **Test in Claude Code:**
   - Start new chat
   - Give prompt that should trigger skill
   - Look for "Using [skill-name]" in reasoning

3. **Test explicitly:**
   ```
   "Use the my-skill skill to..."
   ```

4. **Iterate:**
   - If doesn't trigger: improve description
   - If wrong behavior: clarify instructions
   - Edit SKILL.md and re-copy to ~/.claude/skills/

## 🎯 Quick Commands

```bash
# Interactive builder
./build_skill.sh

# Python generator
python create_skill.py

# View installed skills
ls ~/.claude/skills/

# View skill content
cat ~/.claude/skills/pdf/SKILL.md | head -50

# Install skill
cp -r my-skill/ ~/.claude/skills/

# Edit installed skill
nano ~/.claude/skills/my-skill/SKILL.md
```

## 📊 Progressive Loading (Token Efficiency)

**Level 1:** Metadata (~100 tokens, always loaded)
- YAML frontmatter only

**Level 2:** Instructions (<5k tokens, loaded when triggered)
- Full SKILL.md content

**Level 3:** Resources (unlimited, on-demand)
- REFERENCE.md, resources/, scripts/
- Scripts run without loading code

## 🔒 Security Checklist

- [ ] Only install skills from trusted sources
- [ ] Review all script files before use
- [ ] Check for hardcoded secrets
- [ ] Validate external connections
- [ ] Audit file operations

## 🆘 Troubleshooting

**Skill doesn't load:**
- Check YAML syntax
- Verify name follows rules
- Ensure description is non-empty
- Restart Claude Code

**Skill never triggers:**
- Improve description (be more specific)
- Test with explicit activation
- Check for name conflicts

**Too much context:**
- Keep SKILL.md under 5k tokens
- Move details to REFERENCE.md
- Use scripts/ for code

## 💡 Pro Tips

1. **Start simple** - Use basic template first
2. **Study examples** - Review installed skills
3. **Test incrementally** - Don't build everything at once
4. **Be specific** - Clear descriptions = better triggering
5. **Use progressive loading** - Keep SKILL.md concise

## 🔗 External Resources

- [Anthropic Docs](https://docs.claude.com/en/docs/agents-and-tools/agent-skills)
- [Skills Repository](https://github.com/anthropics/skills)
- [MCP Protocol](https://modelcontextprotocol.io)

## 📦 Installed Skills (15)

**Document Skills (4):**
- docx, pdf, pptx, xlsx

**Creative (3):**
- algorithmic-art, canvas-design, slack-gif-creator

**Development (3):**
- artifacts-builder, mcp-builder, webapp-testing

**Enterprise (3):**
- brand-guidelines, internal-comms, theme-factory

**Meta (2):**
- skill-creator, template-skill

---

**Quick Start Version:** 1.0.0
**Last Updated:** 2025-11-11
**For:** Claude Code, Claude.ai, Claude API
