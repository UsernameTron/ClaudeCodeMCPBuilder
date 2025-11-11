#!/usr/bin/env python3
"""
Claude Skill Generator
Creates properly formatted Claude Skills with YAML frontmatter and structure
"""
import os
import sys
import re
from datetime import datetime
from pathlib import Path

def sanitize_name(name):
    """Convert name to valid skill format (lowercase, numbers, hyphens only)"""
    # Remove invalid characters
    clean = re.sub(r'[^a-z0-9-]', '', name.lower().replace(' ', '-'))
    # Remove multiple consecutive hyphens
    clean = re.sub(r'-+', '-', clean)
    # Strip leading/trailing hyphens
    clean = clean.strip('-')

    # Check for reserved words
    if 'anthropic' in clean or 'claude' in clean:
        raise ValueError("Skill name cannot contain 'anthropic' or 'claude'")

    # Check length
    if len(clean) > 64:
        raise ValueError("Skill name must be 64 characters or less")

    return clean

def create_skill(skill_name, description, purpose, instructions, examples, dependencies="", install_path=None):
    """
    Generate complete skill structure following Anthropic's specification

    Args:
        skill_name: Human-readable name
        description: What the skill does and when to use it (<1024 chars)
        purpose: Why this skill exists
        instructions: Detailed step-by-step guidance
        examples: Usage examples
        dependencies: Optional dependencies
        install_path: Where to install (default: current directory)
    """

    # Validate and sanitize name
    safe_name = sanitize_name(skill_name)

    # Validate description length
    if len(description) > 1024:
        raise ValueError("Description must be 1024 characters or less")

    if not description.strip():
        raise ValueError("Description cannot be empty")

    # Determine installation path
    if install_path:
        skill_dir = Path(install_path) / safe_name
    else:
        skill_dir = Path(f"./{safe_name}")

    # Create directory structure
    skill_dir.mkdir(parents=True, exist_ok=True)
    (skill_dir / "resources").mkdir(exist_ok=True)
    (skill_dir / "scripts").mkdir(exist_ok=True)

    # Generate SKILL.md with proper YAML frontmatter
    skill_content = f"""---
name: {safe_name}
description: {description}
---

# {skill_name}

## Overview

{purpose}

## When to Use This Skill

Claude should activate this skill when:
- {description}

## Instructions

{instructions}

## Examples

{examples}

## Best Practices

- Follow all instructions in sequence
- Reference additional files in resources/ when needed
- Use scripts/ for executable code that doesn't need to be in context
- Keep responses focused and actionable

## Additional Resources

- See REFERENCE.md for detailed documentation
- Check resources/ folder for templates and reference materials
- Review scripts/ for utility code

---
*Created: {datetime.now().strftime('%Y-%m-%d')}*
*Version: 1.0.0*
{f'*Dependencies: {dependencies}*' if dependencies else ''}
"""

    # Write SKILL.md
    (skill_dir / "SKILL.md").write_text(skill_content)

    # Create REFERENCE.md (optional detailed documentation)
    reference_content = f"""# {skill_name} - Reference Documentation

This file contains detailed information that doesn't need to be loaded immediately
but can be referenced when needed.

## Detailed Context

[Add comprehensive background information here]

## Advanced Usage

[Document edge cases, advanced scenarios, and complex workflows]

## Troubleshooting

[Common issues and their solutions]

## Related Resources

- Additional documentation in resources/
- Utility scripts in scripts/
- External references: [Add relevant links]

## Version History

- v1.0.0 ({datetime.now().strftime('%Y-%m-%d')}): Initial release
"""

    (skill_dir / "REFERENCE.md").write_text(reference_content)

    # Create resources README
    resources_readme = f"""# Resources for {skill_name}

This directory contains supplemental files for the skill:

- Templates
- Reference data
- Example files
- Configuration samples

Files here are loaded on-demand, so they don't count against the initial context budget.
"""

    (skill_dir / "resources" / "README.md").write_text(resources_readme)

    # Create scripts README
    scripts_readme = f"""# Scripts for {skill_name}

Executable code goes here. Scripts are run via bash, so only their output
(not their code) consumes tokens.

## Adding Scripts

1. Create Python/shell scripts here
2. Make them executable: `chmod +x script.py`
3. Reference them in SKILL.md instructions
4. Document their purpose and usage

## Example

```python
#!/usr/bin/env python3
# Description: What this script does

def main():
    # Your code here
    pass

if __name__ == "__main__":
    main()
```
"""

    (skill_dir / "scripts" / "README.md").write_text(scripts_readme)

    # Create .gitignore
    gitignore_content = """# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python

# Virtual environments
venv/
env/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
"""

    (skill_dir / ".gitignore").write_text(gitignore_content)

    print(f"\n{'='*60}")
    print(f"✓ Skill created successfully!")
    print(f"{'='*60}")
    print(f"\nLocation: {skill_dir.absolute()}")
    print(f"Safe name: {safe_name}")
    print(f"\nStructure created:")
    print(f"  ├── SKILL.md           (Main skill file with YAML)")
    print(f"  ├── REFERENCE.md       (Detailed documentation)")
    print(f"  ├── .gitignore         (Git ignore rules)")
    print(f"  ├── resources/")
    print(f"  │   └── README.md      (Resource directory info)")
    print(f"  └── scripts/")
    print(f"      └── README.md      (Scripts directory info)")

    print(f"\n{'='*60}")
    print(f"Next Steps:")
    print(f"{'='*60}")
    print(f"1. Review and edit {safe_name}/SKILL.md")
    print(f"2. Add templates/resources to {safe_name}/resources/")
    print(f"3. Add executable scripts to {safe_name}/scripts/")
    print(f"4. Test the skill:")
    print(f"   cd {safe_name}")
    print(f"   zip -r ../{safe_name}.zip .")
    print(f"\n5. Install to Claude Code:")
    print(f"   cp -r {safe_name} ~/.claude/skills/")
    print(f"\n6. Or upload to Claude.ai:")
    print(f"   Settings > Capabilities > Skills > Upload")
    print(f"{'='*60}\n")

    return skill_dir

def interactive_mode():
    """Run interactive skill creation"""
    print("\n" + "="*60)
    print("Claude Skill Generator - Interactive Mode")
    print("="*60)
    print("\nThis tool creates properly formatted Claude Skills.")
    print("Skills use YAML frontmatter and follow Anthropic's spec.\n")

    # Gather information
    skill_name = input("Skill name (human-readable): ").strip()
    if not skill_name:
        print("Error: Skill name is required")
        sys.exit(1)

    print("\nDescription (what & when to use, max 1024 chars):")
    print("Example: 'Creates quarterly business reports with data analysis when user needs formatted financial summaries'")
    description = input("> ").strip()
    if not description:
        print("Error: Description is required")
        sys.exit(1)

    purpose = input("\nPurpose (why this skill exists): ").strip()

    print("\nInstructions (step-by-step guidance, enter 'DONE' when finished):")
    print("Tip: Use numbered steps and be specific")
    instructions = []
    while True:
        line = input()
        if line == 'DONE':
            break
        instructions.append(line)
    instructions = '\n'.join(instructions)

    print("\nExamples (usage examples, enter 'DONE' when finished):")
    print("Tip: Show concrete use cases")
    examples = []
    while True:
        line = input()
        if line == 'DONE':
            break
        examples.append(line)
    examples = '\n'.join(examples)

    dependencies = input("\nDependencies (optional, e.g., 'python>=3.8, pandas>=1.5.0'): ").strip()

    install_choice = input("\nInstall directly to ~/.claude/skills/? (y/n): ").strip().lower()
    install_path = os.path.expanduser("~/.claude/skills") if install_choice == 'y' else None

    try:
        skill_dir = create_skill(
            skill_name,
            description,
            purpose,
            instructions,
            examples,
            dependencies,
            install_path
        )

        if install_path:
            print(f"\n✓ Skill installed and ready to use in Claude Code!")
        else:
            print(f"\n✓ Skill created locally. Follow next steps to install.")

    except ValueError as e:
        print(f"\nError: {e}")
        sys.exit(1)

def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--help':
        print(__doc__)
        print("\nUsage:")
        print("  python create_skill.py          # Interactive mode")
        print("  python create_skill.py --help   # Show this help")
        sys.exit(0)

    interactive_mode()

if __name__ == "__main__":
    main()
