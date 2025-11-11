# Claude Skills - Usage Instructions

Complete guide for creating, validating, and deploying skills.

---

## 🚀 Quick Start (3 Methods)

### Method A: Interactive Python Generator (Recommended)

```bash
cd "/Users/cpconnor/projects/MCP Building"
python create_skill.py
```

**Prompts you for:**
- Skill name (validates format)
- Description (what and when, max 1024 chars)
- Purpose (why it exists)
- Instructions (multi-line, end with DONE)
- Examples (multi-line, end with DONE)
- Dependencies (optional)
- Install directly? (y/n)

**Output:**
- Complete skill directory with SKILL.md
- REFERENCE.md template
- resources/ and scripts/ directories
- Option to install to ~/.claude/skills/

---

### Method B: Interactive Shell Script (Fastest)

```bash
cd "/Users/cpconnor/projects/MCP Building"
./build_skill.sh
```

**6 Options:**
1. Basic Template - Quick start (no dependencies)
2. Document Processor - Brand guidelines, formatting
3. Data Analyzer - Statistical analysis, visualizations
4. Interactive Generator - Calls create_skill.py
5. Browse Examples - View installed skills
6. Exit

**Output:**
- Skill directory from template
- Helpful next steps
- Installation commands

---

### Method C: Copy and Customize Template

```bash
cd "/Users/cpconnor/projects/MCP Building"

# Copy template
cp -r templates/basic-template/ my-skill/

# Edit
nano my-skill/SKILL.md

# Validate
./validate_skill.sh my-skill/

# Install
cp -r my-skill/ ~/.claude/skills/
```

---

## 🎯 Using Claude Code to Create Skills

### Tell Claude Code What You Want

Use this format in a Claude Code chat:

```
Create a skill for [PURPOSE] that:
- Triggers when: [SPECIFIC USER REQUEST PATTERN]
- Does: [SPECIFIC ACTIONS]
- Uses: [TOOLS/DEPENDENCIES]
- Outputs: [FORMAT/DELIVERABLE]

Example use case: [CONCRETE EXAMPLE]
```

### Example Request

```
Create a skill for quarterly business reports that:
- Triggers when: User requests formatted financial reports for board meetings
- Does:
  1. Loads financial data from CSV or Excel
  2. Calculates key metrics (revenue, growth, profit margins)
  3. Generates charts (trends, regional breakdown)
  4. Applies company brand guidelines
  5. Outputs formatted PowerPoint presentation
- Uses: pandas, matplotlib, python-pptx
- Outputs: .pptx file with 5-7 slides

Example use case: CFO uploads Q3 sales data and says "Create board presentation"
```

**Claude Code will:**
1. Run the generator with appropriate answers
2. Populate all required fields
3. Create complete directory structure
4. Add necessary scripts
5. Validate structure
6. Package as ZIP for upload

---

## ✅ Validation & Packaging

### Validate Your Skill

```bash
./validate_skill.sh my-skill/
```

**Checks:**
- ✓ SKILL.md exists
- ✓ YAML frontmatter present
- ✓ Required fields (name, description)
- ✓ Name format (lowercase, hyphens, no reserved words)
- ✓ Name length (max 64 chars)
- ✓ Description non-empty (max 1024 chars)
- ✓ Optional files (REFERENCE.md, resources/, scripts/)
- ✓ Script executability

**Output:**
- Validation report
- Error count
- Warning count
- ZIP file (if valid)
- Installation instructions

### Example Validation Output

```
========================================
Skill Validation & Packaging
========================================

ℹ Validating: my-skill

Checking required files...
✓ Found SKILL.md

Validating YAML frontmatter...
✓ Found YAML frontmatter
✓ Found name: my-skill
✓ Found description

Checking optional components...
✓ Found REFERENCE.md
✓ Found resources/ directory (3 files)
✓ Found scripts/ directory (2 scripts)

========================================
Validation Summary
========================================

✓ No errors found
⚠ 0 warning(s) found

ℹ Creating installation package...
✓ Created package: my-skill.zip (15K)

Installation options:

  1. Claude Code:
     cp -r my-skill ~/.claude/skills/

  2. Claude.ai:
     Upload my-skill.zip in Settings > Capabilities > Skills

  3. Claude API:
     curl -X POST https://api.anthropic.com/v1/skills \
       -H "x-api-key: $ANTHROPIC_API_KEY" \
       -F "file=@my-skill.zip"

✓ Validation complete!
```

---

## 📦 Installation Methods

### 1. Claude Code (Local)

```bash
# Copy skill directory
cp -r my-skill/ ~/.claude/skills/

# Verify
ls ~/.claude/skills/my-skill/

# Claude Code will auto-load on next use
```

### 2. Claude.ai (Web Upload)

```bash
# Validate and package
./validate_skill.sh my-skill/

# Upload my-skill.zip in Claude.ai:
# Settings > Capabilities > Skills > Upload
```

### 3. Claude API (Programmatic)

```bash
# Package skill
./validate_skill.sh my-skill/

# Upload via API
curl -X POST https://api.anthropic.com/v1/skills \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@my-skill.zip"
```

---

## ⚡ Quick Access Aliases

### Setup Shell Aliases

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Claude Skills aliases
export SKILLS_DIR="/Users/cpconnor/projects/MCP Building"

# Create skill
alias create-skill="cd $SKILLS_DIR && python create_skill.py"

# Build with templates
alias build-skill="cd $SKILLS_DIR && ./build_skill.sh"

# Validate skill
alias validate-skill="cd $SKILLS_DIR && ./validate_skill.sh"

# List installed skills
alias list-skills="ls -1 ~/.claude/skills/"

# View skill
alias view-skill="cat ~/.claude/skills/\$1/SKILL.md"

# Edit skill
alias edit-skill="nano ~/.claude/skills/\$1/SKILL.md"

# Remove skill
alias remove-skill="rm -rf ~/.claude/skills/\$1"
```

### Apply Aliases

```bash
# For zsh
echo 'export SKILLS_DIR="/Users/cpconnor/projects/MCP Building"' >> ~/.zshrc
echo 'alias create-skill="cd $SKILLS_DIR && python create_skill.py"' >> ~/.zshrc
echo 'alias build-skill="cd $SKILLS_DIR && ./build_skill.sh"' >> ~/.zshrc
echo 'alias validate-skill="cd $SKILLS_DIR && ./validate_skill.sh"' >> ~/.zshrc
echo 'alias list-skills="ls -1 ~/.claude/skills/"' >> ~/.zshrc
source ~/.zshrc

# For bash
echo 'export SKILLS_DIR="/Users/cpconnor/projects/MCP Building"' >> ~/.bashrc
echo 'alias create-skill="cd $SKILLS_DIR && python create_skill.py"' >> ~/.bashrc
echo 'alias build-skill="cd $SKILLS_DIR && ./build_skill.sh"' >> ~/.bashrc
echo 'alias validate-skill="cd $SKILLS_DIR && ./validate_skill.sh"' >> ~/.bashrc
echo 'alias list-skills="ls -1 ~/.claude/skills/"' >> ~/.bashrc
source ~/.bashrc
```

### Use Aliases

```bash
# Create skill from anywhere
create-skill

# Build with templates
build-skill

# Validate skill (from any directory)
validate-skill ~/Downloads/my-skill/

# List all skills
list-skills

# View a skill
view-skill pdf

# Edit a skill
edit-skill my-custom-skill

# Remove a skill
remove-skill old-skill
```

---

## 🔄 Complete Workflow

### End-to-End Skill Creation

```bash
# 1. Create skill
cd "/Users/cpconnor/projects/MCP Building"
./build_skill.sh
# Choose option 1 (Basic Template)
# Enter name: meeting-notes

# 2. Customize
cd meeting-notes/
nano SKILL.md
# Update YAML frontmatter
# Customize instructions
# Add examples

# 3. Add resources (optional)
mkdir -p resources/
# Add templates or reference files

# 4. Add scripts (optional)
mkdir -p scripts/
nano scripts/format_notes.py
chmod +x scripts/format_notes.py

# 5. Validate
cd ..
./validate_skill.sh meeting-notes/
# Fix any errors reported

# 6. Install
cp -r meeting-notes/ ~/.claude/skills/

# 7. Test in Claude Code
# Start new chat
# Give prompt: "Take notes from today's standup meeting"
# Check if skill is used in reasoning
```

---

## 🧪 Testing Your Skill

### Test in Claude Code

1. **Open Claude Code**
   - Start new chat session

2. **Give relevant prompt**
   ```
   "Create meeting notes for today's standup"
   ```

3. **Check Claude's reasoning**
   - Look for "Using meeting-notes" in thinking
   - Verify skill is loaded

4. **Test different triggers**
   ```
   "Document the team meeting"
   "Generate notes from the discussion"
   "Summarize the key points from today's meeting"
   ```

5. **Test explicit activation**
   ```
   "Use the meeting-notes skill to document today's standup"
   ```

### Iterate Based on Results

**If skill doesn't trigger:**
- Improve description to be more specific
- Add more trigger scenarios
- Check for name conflicts

**If behavior is wrong:**
- Clarify instructions
- Add more examples
- Simplify steps

**Edit and reinstall:**
```bash
nano ~/.claude/skills/meeting-notes/SKILL.md
# Make changes, save
# Claude Code will reload automatically
```

---

## 📊 Skill Development Checklist

### Before Creation
- [ ] Define clear purpose
- [ ] Identify trigger scenarios
- [ ] List required dependencies
- [ ] Plan directory structure
- [ ] Gather example data

### During Creation
- [ ] Use descriptive skill name
- [ ] Write specific description (what + when)
- [ ] Create step-by-step instructions
- [ ] Include realistic examples
- [ ] Document dependencies
- [ ] Add guidelines/constraints

### After Creation
- [ ] Run validation script
- [ ] Fix all errors
- [ ] Address warnings
- [ ] Test installation
- [ ] Verify in Claude Code
- [ ] Test multiple prompts
- [ ] Iterate based on feedback

---

## 🎨 Skill Patterns

### Pattern 1: Simple Instruction Skill

```yaml
---
name: brand-voice
description: Apply company brand voice to content when writing external communications
---

# Brand Voice

## Instructions
1. Check content type (blog, email, social)
2. Apply appropriate tone (professional, friendly, authoritative)
3. Use active voice
4. Keep sentences under 20 words
5. Include call-to-action
```

### Pattern 2: Document Processing Skill

```yaml
---
name: report-generator
description: Generate formatted business reports from data when user provides metrics
dependencies: python>=3.8, pandas>=1.5.0, python-docx>=0.8.11
---

# Report Generator

## Instructions
1. Load data from CSV/Excel (resources/load_data.py)
2. Calculate summary statistics
3. Generate charts with matplotlib
4. Apply company template (resources/report-template.docx)
5. Output formatted Word document
```

### Pattern 3: Data Analysis Skill

```yaml
---
name: sales-insights
description: Analyze sales data and generate insights when user uploads sales CSV
dependencies: pandas, numpy, matplotlib, seaborn
---

# Sales Insights

## Instructions
1. Validate data (scripts/validate_sales_data.py)
2. Calculate metrics (revenue, growth, top products)
3. Generate visualizations (scripts/create_charts.py)
4. Write insights report
5. Include recommendations
```

---

## 🆘 Common Issues & Solutions

### Issue: `SKILL.md not found`
**Solution:** Ensure file is named exactly `SKILL.md` (case-sensitive)

### Issue: `Invalid YAML frontmatter`
**Solution:** Verify frontmatter starts and ends with `---`

### Issue: `Name validation failed`
**Solution:** Use only lowercase letters, numbers, and hyphens

### Issue: `Description too long`
**Solution:** Keep under 1024 characters, focus on triggers

### Issue: `Scripts not executable`
**Solution:** Run `chmod +x scripts/*.py`

### Issue: `ZIP file too large`
**Solution:** Remove unnecessary files, use .gitignore patterns

---

## 📞 Getting Help

1. **Quick Start:** [QUICK-START.md](QUICK-START.md)
2. **Full Guide:** [SKILL-CREATION-GUIDE.md](SKILL-CREATION-GUIDE.md)
3. **Best Practices:** [ClaudeSkillsBestPractices.md](ClaudeSkillsBestPractices.md)
4. **Master Reference:** [SKILLS-README.md](SKILLS-README.md)
5. **Templates:** [templates/README.md](templates/README.md)

---

**Usage Guide Version:** 1.0.0
**Last Updated:** 2025-11-11
**Status:** Complete ✅
