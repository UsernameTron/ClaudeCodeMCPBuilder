#!/bin/bash
#
# Skill Validation & Packaging Tool
# Validates skill structure and creates installation-ready ZIP file
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <skill-directory>"
    echo ""
    echo "Example:"
    echo "  $0 my-skill/"
    echo "  $0 ~/.claude/skills/my-skill/"
    exit 1
fi

SKILL_DIR="$1"

# Remove trailing slash
SKILL_DIR="${SKILL_DIR%/}"

echo ""
echo "========================================"
echo -e "${BLUE}Skill Validation & Packaging${NC}"
echo "========================================"
echo ""
print_info "Validating: $SKILL_DIR"
echo ""

# Check if directory exists
if [ ! -d "$SKILL_DIR" ]; then
    print_error "Directory not found: $SKILL_DIR"
    exit 1
fi

ERROR_COUNT=0
WARNING_COUNT=0

# Check required files
echo "Checking required files..."

if [ ! -f "$SKILL_DIR/SKILL.md" ]; then
    print_error "Missing SKILL.md (required)"
    ERROR_COUNT=$((ERROR_COUNT + 1))
else
    print_success "Found SKILL.md"
fi

# Validate YAML frontmatter
if [ -f "$SKILL_DIR/SKILL.md" ]; then
    echo ""
    echo "Validating YAML frontmatter..."

    # Check for frontmatter delimiters
    if ! grep -q "^---" "$SKILL_DIR/SKILL.md"; then
        print_error "Missing YAML frontmatter (must start with ---)"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    else
        print_success "Found YAML frontmatter"

        # Check required fields
        if ! grep -q "^name:" "$SKILL_DIR/SKILL.md"; then
            print_error "Missing 'name' field in frontmatter"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        else
            # Extract and validate name
            NAME=$(awk '/^name:/ {sub(/^name: */, ""); print; exit}' "$SKILL_DIR/SKILL.md")
            print_success "Found name: $NAME"

            # Validate name format
            if [[ ! "$NAME" =~ ^[a-z0-9-]+$ ]]; then
                print_error "Name must be lowercase letters, numbers, and hyphens only"
                ERROR_COUNT=$((ERROR_COUNT + 1))
            fi

            # Check for reserved words
            if [[ "$NAME" == *"anthropic"* ]] || [[ "$NAME" == *"claude"* ]]; then
                print_error "Name cannot contain 'anthropic' or 'claude'"
                ERROR_COUNT=$((ERROR_COUNT + 1))
            fi

            # Check length
            if [ ${#NAME} -gt 64 ]; then
                print_error "Name exceeds 64 characters (current: ${#NAME})"
                ERROR_COUNT=$((ERROR_COUNT + 1))
            fi
        fi

        if ! grep -q "^description:" "$SKILL_DIR/SKILL.md"; then
            print_error "Missing 'description' field in frontmatter"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        else
            # Extract and validate description
            DESC=$(awk '/^description:/ {sub(/^description: */, ""); print; exit}' "$SKILL_DIR/SKILL.md")
            print_success "Found description"

            # Check if empty
            if [ -z "$DESC" ]; then
                print_error "Description cannot be empty"
                ERROR_COUNT=$((ERROR_COUNT + 1))
            fi

            # Check length
            if [ ${#DESC} -gt 1024 ]; then
                print_error "Description exceeds 1024 characters (current: ${#DESC})"
                ERROR_COUNT=$((ERROR_COUNT + 1))
            elif [ ${#DESC} -gt 200 ]; then
                print_warning "Description is long (${#DESC} chars). Consider being more concise."
                WARNING_COUNT=$((WARNING_COUNT + 1))
            fi
        fi
    fi
fi

# Check optional files
echo ""
echo "Checking optional components..."

if [ -f "$SKILL_DIR/REFERENCE.md" ]; then
    print_success "Found REFERENCE.md"
fi

if [ -d "$SKILL_DIR/resources" ]; then
    RESOURCE_COUNT=$(find "$SKILL_DIR/resources" -type f | wc -l | tr -d ' ')
    print_success "Found resources/ directory ($RESOURCE_COUNT files)"
fi

if [ -d "$SKILL_DIR/scripts" ]; then
    SCRIPT_COUNT=$(find "$SKILL_DIR/scripts" -type f -name "*.py" -o -name "*.sh" | wc -l | tr -d ' ')
    print_success "Found scripts/ directory ($SCRIPT_COUNT scripts)"

    # Check if scripts are executable
    for script in "$SKILL_DIR/scripts"/*.{py,sh} 2>/dev/null; do
        if [ -f "$script" ] && [ ! -x "$script" ]; then
            print_warning "Script not executable: $(basename "$script")"
            print_info "  Run: chmod +x $script"
            WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
    done
fi

# Summary
echo ""
echo "========================================"
echo -e "${BLUE}Validation Summary${NC}"
echo "========================================"
echo ""

if [ $ERROR_COUNT -eq 0 ]; then
    print_success "No errors found"
else
    print_error "$ERROR_COUNT error(s) found"
fi

if [ $WARNING_COUNT -gt 0 ]; then
    print_warning "$WARNING_COUNT warning(s) found"
fi

if [ $ERROR_COUNT -gt 0 ]; then
    echo ""
    print_error "Validation failed. Please fix errors before packaging."
    exit 1
fi

# Package skill
echo ""
print_info "Creating installation package..."

SKILL_NAME=$(basename "$SKILL_DIR")
PARENT_DIR=$(dirname "$SKILL_DIR")
ZIP_FILE="$PARENT_DIR/${SKILL_NAME}.zip"

# Remove existing ZIP if present
if [ -f "$ZIP_FILE" ]; then
    rm "$ZIP_FILE"
fi

# Create ZIP
cd "$PARENT_DIR"
zip -r -q "${SKILL_NAME}.zip" "$SKILL_NAME/"

if [ -f "$ZIP_FILE" ]; then
    ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
    print_success "Created package: ${SKILL_NAME}.zip ($ZIP_SIZE)"
    echo ""
    echo "Installation options:"
    echo ""
    echo "  1. Claude Code:"
    echo "     cp -r $SKILL_DIR ~/.claude/skills/"
    echo ""
    echo "  2. Claude.ai:"
    echo "     Upload $ZIP_FILE in Settings > Capabilities > Skills"
    echo ""
    echo "  3. Claude API:"
    echo "     curl -X POST https://api.anthropic.com/v1/skills \\"
    echo "       -H \"x-api-key: \$ANTHROPIC_API_KEY\" \\"
    echo "       -F \"file=@$ZIP_FILE\""
else
    print_error "Failed to create ZIP file"
    exit 1
fi

echo ""
print_success "Validation complete!"
echo ""
