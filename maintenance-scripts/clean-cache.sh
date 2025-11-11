#!/bin/bash

###############################################################################
# Claude Cache Cleanup Script
#
# Purpose: Safely clean Claude Desktop cache directories
# - Clears cache files that can be rebuilt
# - Preserves essential configuration
# - Must run with Claude Desktop CLOSED
#
# Usage: ./maintenance-scripts/clean-cache.sh [dry-run]
# Example: ./maintenance-scripts/clean-cache.sh true
###############################################################################

set -euo pipefail

# Configuration
CLAUDE_DIR="${HOME}/.claude"
DRY_RUN=${1:-false}
LOG_FILE="${CLAUDE_DIR}/logs/cache-cleanup.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Tracking
TOTAL_FREED=0
FILES_DELETED=0
DIRS_CLEANED=0

###############################################################################
# Utilities
###############################################################################

setup() {
    mkdir -p "$(dirname "${LOG_FILE}")"
    touch "${LOG_FILE}"
}

log_info() {
    echo "[INFO] $@" >> "${LOG_FILE}"
    echo "ℹ️  $@"
}

log_success() {
    echo "[SUCCESS] $@" >> "${LOG_FILE}"
    echo -e "${GREEN}✅${NC} $@"
}

log_warn() {
    echo "[WARN] $@" >> "${LOG_FILE}"
    echo -e "${YELLOW}⚠️${NC} $@"
}

log_error() {
    echo "[ERROR] $@" >> "${LOG_FILE}"
    echo -e "${RED}❌${NC} $@" >&2
}

format_size() {
    local size=$1
    if [ ${size} -ge 1073741824 ]; then
        echo "$(( size / 1073741824 ))GB"
    elif [ ${size} -ge 1048576 ]; then
        echo "$(( size / 1048576 ))MB"
    elif [ ${size} -ge 1024 ]; then
        echo "$(( size / 1024 ))KB"
    else
        echo "${size}B"
    fi
}

check_claude_running() {
    if pgrep -f "Claude" > /dev/null 2>&1; then
        log_error "Claude Desktop is currently running"
        log_error "Please close Claude Desktop before running this script"
        log_error "  Command: killall 'Claude' 2>/dev/null || true"
        return 1
    fi
    log_success "Claude Desktop is not running ✓"
    return 0
}

clean_cache_directory() {
    local cache_name=$1
    local cache_path="${CLAUDE_DIR}/${cache_name}"
    
    if [ ! -d "${cache_path}" ]; then
        log_info "Cache directory does not exist: ${cache_name} (skipping)"
        return 0
    fi
    
    local original_size=$(du -sh "${cache_path}" 2>/dev/null | cut -f1 | grep -o '[0-9.]*' || echo "0")
    local original_size_bytes=$(du -sb "${cache_path}" 2>/dev/null | cut -f1 || echo "0")
    
    log_info "Cleaning: ${cache_name} (size: ${original_size})"
    
    if [ "${DRY_RUN}" = "true" ]; then
        log_warn "[DRY-RUN] Would clean ${cache_name} (saving $(format_size ${original_size_bytes}))"
        TOTAL_FREED=$((TOTAL_FREED + original_size_bytes))
        return 0
    fi
    
    # Delete cache contents
    if rm -rf "${cache_path}"/* 2>/dev/null; then
        log_success "Cleaned: ${cache_name}"
        TOTAL_FREED=$((TOTAL_FREED + original_size_bytes))
        ((DIRS_CLEANED++))
    else
        log_warn "Some files could not be deleted in ${cache_name}"
    fi
}

clean_cache_files() {
    local description=$1
    local pattern=$2
    local base_dir=${3:-.}
    
    log_info "Cleaning ${description}..."
    
    local count=0
    local size=0
    
    while IFS= read -r file; do
        if [ -z "${file}" ]; then
            continue
        fi
        
        local file_size=$(stat -f%z "${file}" 2>/dev/null || echo 0)
        
        if [ "${DRY_RUN}" = "true" ]; then
            log_info "[DRY-RUN] Would delete: $(basename "${file}") ($(format_size ${file_size}))"
        else
            if rm -f "${file}"; then
                ((count++))
                size=$((size + file_size))
            fi
        fi
    done < <(find "${base_dir}" -name "${pattern}" -type f 2>/dev/null || true)
    
    if [ ${count} -gt 0 ]; then
        log_success "Deleted ${count} files, freed $(format_size ${size})"
        TOTAL_FREED=$((TOTAL_FREED + size))
        FILES_DELETED=$((FILES_DELETED + count))
    elif [ "${DRY_RUN}" = "false" ]; then
        log_info "No ${description} found"
    fi
}

###############################################################################
# Specific Cache Cleanup Functions
###############################################################################

cleanup_gpu_cache() {
    log_info "Processing GPU cache..."
    clean_cache_directory "GPUCache"
}

cleanup_code_cache() {
    log_info "Processing code cache..."
    clean_cache_directory "Code Cache"
}

cleanup_dawn_caches() {
    log_info "Processing Dawn caches..."
    clean_cache_directory "DawnGraphiteCache"
    clean_cache_directory "DawnWebGPUCache"
}

cleanup_crash_reports() {
    log_info "Processing crash reports..."
    
    local crashpad_dir="${CLAUDE_DIR}/Crashpad/new"
    if [ -d "${crashpad_dir}" ]; then
        local crash_count=$(find "${crashpad_dir}" -name "*.dmp" 2>/dev/null | wc -l)
        if [ ${crash_count} -gt 0 ]; then
            log_warn "Found ${crash_count} crash dump files"
            log_info "Consider archiving these for analysis before deletion"
            
            if [ "${DRY_RUN}" = "false" ]; then
                log_warn "Keeping crash reports for analysis (manual review recommended)"
                # Don't auto-delete - these may be valuable for debugging
            fi
        else
            log_info "No crash dumps found"
        fi
    fi
}

cleanup_old_logs() {
    log_info "Processing old log files..."
    
    local log_dir="${CLAUDE_DIR}/logs"
    if [ -d "${log_dir}" ]; then
        # Find logs older than 30 days
        local count=0
        while IFS= read -r log_file; do
            if [ -n "${log_file}" ]; then
                local file_size=$(stat -f%z "${log_file}" 2>/dev/null || echo 0)
                if [ "${DRY_RUN}" = "true" ]; then
                    log_info "[DRY-RUN] Would archive: $(basename "${log_file}")"
                else
                    # Move to archive instead of deleting
                    mkdir -p "${log_dir}/.archive"
                    mv "${log_file}" "${log_dir}/.archive/" 2>/dev/null || true
                    ((count++))
                fi
            fi
        done < <(find "${log_dir}" -maxdepth 1 -name "*.log" -mtime +30 2>/dev/null || true)
        
        if [ ${count} -gt 0 ]; then
            log_success "Archived ${count} old log files"
        fi
    fi
}

cleanup_session_cache() {
    log_info "Processing session cache..."
    
    # Chrome/Electron may store session data
    for cache_dir in "Cache" "Code Cache" "GPUCache"; do
        if [ -d "${CLAUDE_DIR}/${cache_dir}" ]; then
            clean_cache_files "cache files in ${cache_dir}" "*" "${CLAUDE_DIR}/${cache_dir}"
        fi
    done
}

###############################################################################
# Analysis & Reporting
###############################################################################

analyze_disk_usage() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}Disk Usage Analysis${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    
    log_info "Analyzing Claude directory structure..."
    
    echo "Before/After estimates:"
    echo ""
    
    local dirs=("Cache" "Code Cache" "GPUCache" "DawnGraphiteCache" "DawnWebGPUCache")
    for dir in "${dirs[@]}"; do
        local path="${CLAUDE_DIR}/${dir}"
        if [ -d "${path}" ]; then
            local size=$(du -sh "${path}" 2>/dev/null | cut -f1 || echo "0")
            echo "  ${dir}: ${size}"
        fi
    done
    
    echo ""
    local total_size=$(du -sh "${CLAUDE_DIR}" 2>/dev/null | cut -f1 || echo "unknown")
    echo "Total Claude directory size: ${total_size}"
}

generate_report() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}CLEANUP SUMMARY${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    echo "Dry Run Mode:     ${DRY_RUN}"
    echo "Directories:      ${DIRS_CLEANED}"
    echo "Files Deleted:    ${FILES_DELETED}"
    echo -e "Space Freed:      ${GREEN}$(format_size ${TOTAL_FREED})${NC}"
    echo ""
    
    if [ "${DRY_RUN}" = "true" ]; then
        echo -e "${YELLOW}This was a DRY RUN - no changes were made${NC}"
        echo "Run without arguments to actually clean:"
        echo "  ./maintenance-scripts/clean-cache.sh"
    else
        echo -e "${GREEN}Cache cleanup complete!${NC}"
        echo "Claude will rebuild its cache on next launch"
    fi
    
    echo ""
    log_info "Cleanup summary generated"
}

###############################################################################
# Main
###############################################################################

main() {
    setup
    
    echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║        Claude Cache Cleanup Script         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
    echo ""
    
    if [ "${DRY_RUN}" = "true" ]; then
        echo -e "${YELLOW}DRY RUN MODE - No changes will be made${NC}"
        echo ""
    else
        echo -e "${YELLOW}⚠️  This will delete cache files${NC}"
        echo -e "${YELLOW}💾 Claude will rebuild cache on next launch${NC}"
        echo ""
    fi
    
    log_info "Cleanup script started - DRY_RUN=${DRY_RUN}"
    
    # Safety check
    if ! check_claude_running; then
        log_error "Aborting cleanup - Claude is still running"
        return 1
    fi
    
    echo ""
    
    # Perform cleanups
    cleanup_gpu_cache
    cleanup_code_cache
    cleanup_dawn_caches
    cleanup_old_logs
    cleanup_crash_reports
    cleanup_session_cache
    
    # Generate reports
    analyze_disk_usage
    generate_report
    
    log_info "Cleanup script complete"
    
    if [ "${DRY_RUN}" = "false" ]; then
        echo ""
        echo "You can now restart Claude:"
        echo "  open /Applications/Claude.app"
    fi
}

main "$@"
