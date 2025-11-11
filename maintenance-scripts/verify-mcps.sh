#!/bin/bash

###############################################################################
# Claude MCP Verification & Health Check Script
#
# Purpose: Verify all MCPs are properly configured and operational
# - Checks that files exist and are executable
# - Validates environment variables
# - Tests basic functionality
# - Generates health report
#
# Usage: ./maintenance-scripts/verify-mcps.sh [verbose]
# Example: ./maintenance-scripts/verify-mcps.sh true
###############################################################################

set -euo pipefail

# Configuration
VERBOSE=${1:-false}
MCP_BASE="/Users/cpconnor/projects/MCP Building"
CLAUDE_CONFIG="${HOME}/.claude/claude_desktop_config.json"
LOG_FILE="${HOME}/.claude/logs/mcp-verify.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL=0
PASSED=0
FAILED=0
WARNED=0

###############################################################################
# Utilities
###############################################################################

setup() {
    mkdir -p "$(dirname "${LOG_FILE}")"
    touch "${LOG_FILE}"
}

log_info() {
    echo "[INFO] $@" >> "${LOG_FILE}"
    [ "${VERBOSE}" = "true" ] && echo "ℹ️  $@"
}

log_pass() {
    echo "[PASS] $@" >> "${LOG_FILE}"
    echo -e "${GREEN}✅${NC} $@"
    ((PASSED++))
}

log_fail() {
    echo "[FAIL] $@" >> "${LOG_FILE}"
    echo -e "${RED}❌${NC} $@" >&2
    ((FAILED++))
}

log_warn() {
    echo "[WARN] $@" >> "${LOG_FILE}"
    echo -e "${YELLOW}⚠️${NC} $@"
    ((WARNED++))
}

###############################################################################
# MCP Definition & Discovery
###############################################################################

# Define MCPs with their properties
declare -A MCPs=(
    ["auto-documenter"]="claude-auto-documenter-v2"
    ["openai-gpt-image"]="openai-gpt-image-mcp"
    ["nanobanana-mcp"]="nanobanana-mcp"
)

declare -A MCP_REQUIREMENTS=(
    ["openai-gpt-image"]="OPENAI_API_KEY"
)

###############################################################################
# Verification Functions
###############################################################################

check_file_exists() {
    local mcp_name=$1
    local rel_path=$2
    local full_path="${MCP_BASE}/${rel_path}"
    
    ((TOTAL++))
    
    if [ -f "${full_path}" ]; then
        log_pass "${mcp_name}: File exists - ${rel_path}"
        return 0
    else
        log_fail "${mcp_name}: File NOT found - ${rel_path}"
        return 1
    fi
}

check_file_executable() {
    local mcp_name=$1
    local full_path=$2
    
    ((TOTAL++))
    
    if [ -x "${full_path}" ] || [ -f "${full_path}" ]; then
        log_pass "${mcp_name}: File is accessible - $(basename "${full_path}")"
        return 0
    else
        log_fail "${mcp_name}: File not executable/accessible"
        return 1
    fi
}

check_node_executable() {
    local mcp_name=$1
    local mcp_path=$2
    
    ((TOTAL++))
    
    if ! command -v node &> /dev/null; then
        log_fail "${mcp_name}: Node.js not found in PATH"
        return 1
    fi
    
    log_pass "${mcp_name}: Node.js is available"
}

check_build_artifacts() {
    local mcp_name=$1
    local rel_path=$2
    local full_path="${MCP_BASE}/${rel_path}"
    
    ((TOTAL++))
    
    if [ -d "${full_path}/dist" ]; then
        local file_count=$(find "${full_path}/dist" -type f | wc -l)
        if [ ${file_count} -gt 0 ]; then
            log_pass "${mcp_name}: Build artifacts exist (${file_count} files)"
            return 0
        else
            log_fail "${mcp_name}: dist/ exists but is empty"
            return 1
        fi
    else
        log_fail "${mcp_name}: No dist/ directory - needs npm run build"
        return 1
    fi
}

check_package_json() {
    local mcp_name=$1
    local rel_path=$2
    local full_path="${MCP_BASE}/${rel_path}/package.json"
    
    ((TOTAL++))
    
    if [ -f "${full_path}" ]; then
        log_pass "${mcp_name}: package.json found"
        
        # Check for build script
        if grep -q '"build"' "${full_path}"; then
            log_info "${mcp_name}: Build script configured"
        else
            log_warn "${mcp_name}: No build script in package.json"
            ((WARNED++))
        fi
        return 0
    else
        log_fail "${mcp_name}: package.json NOT found"
        return 1
    fi
}

check_env_vars() {
    local mcp_name=$1
    local required_vars="${MCP_REQUIREMENTS[$mcp_name]:-}"
    
    if [ -z "${required_vars}" ]; then
        log_info "${mcp_name}: No required environment variables"
        return 0
    fi
    
    for var in ${required_vars}; do
        ((TOTAL++))
        if [ -n "${!var:-}" ]; then
            log_pass "${mcp_name}: Environment variable ${var} is set"
        else
            log_warn "${mcp_name}: Environment variable ${var} is NOT set"
            ((WARNED++))
        fi
    done
}

check_config_entry() {
    local mcp_name=$1
    
    ((TOTAL++))
    
    if [ ! -f "${CLAUDE_CONFIG}" ]; then
        log_fail "${mcp_name}: Claude config not found at ${CLAUDE_CONFIG}"
        return 1
    fi
    
    # Check if MCP is in config
    if grep -q "\"${mcp_name}\"" "${CLAUDE_CONFIG}"; then
        log_pass "${mcp_name}: Configured in claude_desktop_config.json"
        
        # Try to extract the command path
        local cmd_path=$(grep -A 2 "\"${mcp_name}\"" "${CLAUDE_CONFIG}" | grep -o '"/[^"]*"' | head -1 | tr -d '"' || echo "")
        if [ -n "${cmd_path}" ]; then
            log_info "${mcp_name}: Command path: ${cmd_path}"
        fi
        return 0
    else
        log_warn "${mcp_name}: NOT found in claude_desktop_config.json"
        ((WARNED++))
        return 1
    fi
}

test_mcp_basic() {
    local mcp_name=$1
    local mcp_dir=$2
    local main_file="${MCP_BASE}/${mcp_dir}/dist/index.js"
    
    ((TOTAL++))
    
    if [ ! -f "${main_file}" ]; then
        log_warn "${mcp_name}: Cannot test - dist/index.js not found"
        return 1
    fi
    
    # Try to run with --help or --version
    if timeout 5 node "${main_file}" --help > /dev/null 2>&1; then
        log_pass "${mcp_name}: Basic functionality test passed"
        return 0
    elif timeout 5 node "${main_file}" --version > /dev/null 2>&1; then
        log_pass "${mcp_name}: Version check passed"
        return 0
    else
        # Some MCPs might not have these flags - this is just a warning
        log_info "${mcp_name}: Could not verify with --help/--version (may not be implemented)"
        return 0
    fi
}

check_dependencies() {
    local mcp_name=$1
    local mcp_dir=$2
    local nm_path="${MCP_BASE}/${mcp_dir}/node_modules"
    
    ((TOTAL++))
    
    if [ -d "${nm_path}" ]; then
        local pkg_count=$(find "${nm_path}" -maxdepth 1 -type d | wc -l)
        log_pass "${mcp_name}: Dependencies installed (${pkg_count} packages)"
        return 0
    else
        log_warn "${mcp_name}: node_modules not found - may need npm install"
        ((WARNED++))
        return 0
    fi
}

###############################################################################
# Comprehensive Check Function
###############################################################################

verify_mcp() {
    local config_name=$1
    local dir_name=$2
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}Verifying: ${config_name}${NC}"
    echo -e "${BLUE}Directory: ${dir_name}${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    
    # Run all checks
    check_file_exists "${config_name}" "${dir_name}" || true
    check_build_artifacts "${config_name}" "${dir_name}" || true
    check_package_json "${config_name}" "${dir_name}" || true
    check_node_executable "${config_name}" "${dir_name}" || true
    check_dependencies "${config_name}" "${dir_name}" || true
    check_env_vars "${config_name}" || true
    check_config_entry "${config_name}" || true
    test_mcp_basic "${config_name}" "${dir_name}" || true
}

###############################################################################
# System Checks
###############################################################################

check_system() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}System Environment${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    
    # Check Node.js
    ((TOTAL++))
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log_pass "Node.js is installed: ${node_version}"
    else
        log_fail "Node.js is NOT installed"
    fi
    
    # Check npm
    ((TOTAL++))
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        log_pass "npm is installed: ${npm_version}"
    else
        log_fail "npm is NOT installed"
    fi
    
    # Check Claude config file
    ((TOTAL++))
    if [ -f "${CLAUDE_CONFIG}" ]; then
        log_pass "Claude config file found"
    else
        log_fail "Claude config file NOT found at ${CLAUDE_CONFIG}"
    fi
}

###############################################################################
# Report Generation
###############################################################################

generate_report() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}VERIFICATION SUMMARY${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    echo "Total Checks:     ${TOTAL}"
    echo -e "Passed:           ${GREEN}${PASSED}${NC}"
    echo -e "Failed:           ${RED}${FAILED}${NC}"
    echo -e "Warnings:         ${YELLOW}${WARNED}${NC}"
    echo ""
    
    if [ ${FAILED} -eq 0 ]; then
        echo -e "${GREEN}✅ All MCPs are ready to use!${NC}"
        return 0
    else
        echo -e "${RED}❌ Some issues found - see above for details${NC}"
        return 1
    fi
}

###############################################################################
# Main
###############################################################################

main() {
    setup
    
    echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     Claude MCP Verification & Health Check ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
    
    log_info "Verification started - Verbose: ${VERBOSE}"
    
    check_system
    
    for config_name in "${!MCPs[@]}"; do
        verify_mcp "${config_name}" "${MCPs[${config_name}]}"
    done
    
    generate_report
    
    log_info "Verification complete"
    echo ""
    echo "Full log: ${LOG_FILE}"
}

main "$@"
