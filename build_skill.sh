#!/bin/bash
#
# Claude Skill Builder - Interactive Skill Creation Tool
# Integrates with templates and create_skill.py for flexible skill development
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"
SKILLS_DIR="$HOME/.claude/skills"

echo ""
echo "========================================"
echo -e "${BLUE}Claude Skill Builder${NC}"
echo "Interactive Skill Creation Tool"
echo "========================================"
echo ""

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if templates directory exists
if [ ! -d "$TEMPLATES_DIR" ]; then
    print_error "Templates directory not found at: $TEMPLATES_DIR"
    print_info "Run this script from the MCP Building directory"
    exit 1
fi

# Main menu
echo "How would you like to create your skill?"
echo ""
echo "  1) ${GREEN}Basic Template${NC} - Simple starting point (recommended for beginners)"
echo "     • No dependencies"
echo "     • ~150 lines with examples"
echo "     • Quick to customize"
echo ""
echo "  2) ${GREEN}Document Processor Template${NC} - Document creation and formatting"
echo "     • Brand guidelines application"
echo "     • Format conversion (Word, PDF, Markdown)"
echo "     • Template-based generation"
echo "     • Dependencies: python-docx, Pillow, markdown"
echo ""
echo "  3) ${GREEN}Data Analyzer Template${NC} - Statistical analysis and visualization"
echo "     • Data loading and validation"
echo "     • Statistical testing"
echo "     • Chart generation"
echo "     • Dependencies: pandas, numpy, matplotlib, seaborn, scipy"
echo ""
echo "  4) ${GREEN}Interactive Generator${NC} - Use create_skill.py (full customization)"
echo "     • Answer prompts to build from scratch"
echo "     • Validates all inputs"
echo "     • Auto-generates structure"
echo ""
echo "  5) ${GREEN}Browse Examples${NC} - View installed skills for reference"
echo ""
echo "  6) ${GREEN}Exit${NC}"
echo ""

read -p "Choice (1-6): " choice
echo ""

case $choice in
    1)
        # Basic Template
        print_info "Using Basic Template..."
        read -p "Skill name (lowercase-with-hyphens): " skill_name

        if [ -z "$skill_name" ]; then
            print_error "Skill name is required"
            exit 1
        fi

        # Create skill directory
        SKILL_DIR="./$skill_name"
        mkdir -p "$SKILL_DIR"

        # Copy template
        cp "$TEMPLATES_DIR/basic-template/SKILL.md" "$SKILL_DIR/"

        # Create additional directories
        mkdir -p "$SKILL_DIR/resources"
        mkdir -p "$SKILL_DIR/scripts"

        print_success "Created skill directory: $SKILL_DIR"
        print_info "Next steps:"
        echo "  1. Edit $SKILL_DIR/SKILL.md"
        echo "  2. Update name and description in YAML frontmatter"
        echo "  3. Customize instructions and examples"
        echo "  4. Add resources to $SKILL_DIR/resources/ (optional)"
        echo "  5. Add scripts to $SKILL_DIR/scripts/ (optional)"
        echo ""
        echo "When ready, install with:"
        echo "  cp -r $SKILL_DIR $SKILLS_DIR/"
        ;;

    2)
        # Document Processor Template
        print_info "Using Document Processor Template..."
        read -p "Skill name (lowercase-with-hyphens): " skill_name

        if [ -z "$skill_name" ]; then
            print_error "Skill name is required"
            exit 1
        fi

        SKILL_DIR="./$skill_name"
        mkdir -p "$SKILL_DIR"
        cp "$TEMPLATES_DIR/document-processor/SKILL.md" "$SKILL_DIR/"
        mkdir -p "$SKILL_DIR/resources"
        mkdir -p "$SKILL_DIR/scripts"

        print_success "Created skill directory: $SKILL_DIR"
        print_warning "This template requires dependencies:"
        echo "  • python-docx>=0.8.11"
        echo "  • Pillow>=9.0.0"
        echo "  • markdown>=3.4.0"
        echo ""
        print_info "Next steps:"
        echo "  1. Edit $SKILL_DIR/SKILL.md"
        echo "  2. Update name and description"
        echo "  3. Add document templates to resources/"
        echo "  4. Add brand assets (logos, fonts) to resources/"
        echo "  5. Customize formatting rules"
        echo ""
        echo "Install dependencies:"
        echo "  pip install python-docx Pillow markdown"
        echo ""
        echo "When ready, install skill:"
        echo "  cp -r $SKILL_DIR $SKILLS_DIR/"
        ;;

    3)
        # Data Analyzer Template
        print_info "Using Data Analyzer Template..."
        read -p "Skill name (lowercase-with-hyphens): " skill_name

        if [ -z "$skill_name" ]; then
            print_error "Skill name is required"
            exit 1
        fi

        SKILL_DIR="./$skill_name"
        mkdir -p "$SKILL_DIR"
        cp "$TEMPLATES_DIR/data-analyzer/SKILL.md" "$SKILL_DIR/"
        mkdir -p "$SKILL_DIR/resources"
        mkdir -p "$SKILL_DIR/scripts"

        print_success "Created skill directory: $SKILL_DIR"
        print_warning "This template requires dependencies:"
        echo "  • pandas>=1.5.0"
        echo "  • numpy>=1.23.0"
        echo "  • matplotlib>=3.5.0"
        echo "  • seaborn>=0.12.0"
        echo "  • scipy>=1.9.0"
        echo "  • statsmodels>=0.13.0"
        echo ""
        print_info "Next steps:"
        echo "  1. Edit $SKILL_DIR/SKILL.md"
        echo "  2. Update name and description"
        echo "  3. Add analysis scripts to scripts/"
        echo "  4. Add example datasets to resources/"
        echo "  5. Customize analysis workflows"
        echo ""
        echo "Install dependencies:"
        echo "  pip install pandas numpy matplotlib seaborn scipy statsmodels"
        echo ""
        echo "When ready, install skill:"
        echo "  cp -r $SKILL_DIR $SKILLS_DIR/"
        ;;

    4)
        # Interactive Generator
        print_info "Starting interactive skill generator..."
        echo ""

        if [ ! -f "$SCRIPT_DIR/create_skill.py" ]; then
            print_error "create_skill.py not found at: $SCRIPT_DIR/create_skill.py"
            exit 1
        fi

        python3 "$SCRIPT_DIR/create_skill.py"
        ;;

    5)
        # Browse Examples
        print_info "Installed skills in $SKILLS_DIR:"
        echo ""

        if [ ! -d "$SKILLS_DIR" ]; then
            print_warning "Skills directory not found. No skills installed yet."
            exit 0
        fi

        # List skills with descriptions
        for skill_dir in "$SKILLS_DIR"/*; do
            if [ -d "$skill_dir" ]; then
                skill_name=$(basename "$skill_dir")
                skill_md="$skill_dir/SKILL.md"

                if [ -f "$skill_md" ]; then
                    # Extract description from YAML
                    description=$(awk '/^description:/ {sub(/^description: */, ""); print; exit}' "$skill_md")

                    echo -e "${GREEN}$skill_name${NC}"
                    if [ -n "$description" ]; then
                        echo "  $description"
                    fi
                    echo ""
                fi
            fi
        done

        echo ""
        read -p "View a skill's SKILL.md? Enter skill name (or press Enter to skip): " view_skill

        if [ -n "$view_skill" ]; then
            view_path="$SKILLS_DIR/$view_skill/SKILL.md"
            if [ -f "$view_path" ]; then
                print_info "Viewing $view_skill/SKILL.md"
                echo ""
                cat "$view_path" | head -100
                echo ""
                echo "... (showing first 100 lines)"
                echo ""
                print_info "Full file at: $view_path"
            else
                print_error "Skill not found: $view_skill"
            fi
        fi
        ;;

    6)
        # Exit
        print_info "Exiting. Happy skill building!"
        exit 0
        ;;

    *)
        print_error "Invalid choice: $choice"
        exit 1
        ;;
esac

echo ""
echo "========================================"
echo -e "${GREEN}Skill Setup Complete!${NC}"
echo "========================================"
echo ""
print_info "Documentation:"
echo "  • SKILL-CREATION-GUIDE.md - Complete guide"
echo "  • ClaudeSkillsBestPractices.md - Best practices"
echo "  • templates/README.md - Template usage"
echo ""
print_info "Test your skill:"
echo "  1. Open Claude Code"
echo "  2. Start a new chat"
echo "  3. Give a prompt that should trigger your skill"
echo "  4. Look for 'Using [skill-name]' in Claude's reasoning"
echo ""
print_success "Done! 🚀"
echo ""
