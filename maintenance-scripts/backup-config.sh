#!/bin/bash

###############################################################################
# Claude Configuration Smart Backup Rotation Script
# 
# Purpose: Automatically manage backup file rotation
# - Keeps only N most recent backups
# - Securely deletes old backups
# - Logs all actions
# - Safe to run as cron job
#
# Usage: ./maintenance-scripts/backup-config.sh [keep-count] [encrypt]
# Example: ./maintenance-scripts/backup-config.sh 5 false
###############################################################################

set -euo pipefail

# Configuration
CLAUDE_DIR="${HOME}/.claude"
BACKUPS_DIR="${CLAUDE_DIR}/backups"
ARCHIVE_DIR="${BACKUPS_DIR}/.archived"
LOG_FILE="${CLAUDE_DIR}/logs/backup-rotation.log"
KEEP_COUNT=${1:-5}
ENCRYPT=${2:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

###############################################################################
# Setup & Validation
###############################################################################

setup() {
    # Create directories if needed
    mkdir -p "${BACKUPS_DIR}"
    mkdir -p "${ARCHIVE_DIR}"
    mkdir -p "$(dirname "${LOG_FILE}")"
    chmod 700 "${BACKUPS_DIR}"
    chmod 700 "${ARCHIVE_DIR}"
    
    # Initialize log file
    touch "${LOG_FILE}"
}

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" >> "${LOG_FILE}"
    
    case $level in
        ERROR)   echo -e "${RED}❌${NC} ${message}" >&2 ;;
        SUCCESS) echo -e "${GREEN}✅${NC} ${message}" ;;
        WARN)    echo -e "${YELLOW}⚠️${NC} ${message}" ;;
        INFO)    echo "ℹ️  ${message}" ;;
    esac
}

###############################################################################
# Main Backup Functions
###############################################################################

create_backup() {
    log INFO "Creating backup of Claude configuration..."
    
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_name="claude_desktop_config.${timestamp}.json"
    local backup_file="${BACKUPS_DIR}/${backup_name}"
    
    # Backup main config file
    if [ -f "${CLAUDE_DIR}/claude_desktop_config.json" ]; then
        cp "${CLAUDE_DIR}/claude_desktop_config.json" "${backup_file}"
        chmod 600 "${backup_file}"  # Restrict permissions due to API keys
        
        log SUCCESS "Backup created: ${backup_file}"
        echo "${backup_file}"
    else
        log ERROR "Main config file not found at ${CLAUDE_DIR}/claude_desktop_config.json"
        return 1
    fi
}

list_backups() {
    find "${BACKUPS_DIR}" -maxdepth 1 -name "*.json" -type f -printf '%T@ %p\n' | \
        sort -n | \
        awk '{print $NF}' | \
        tail -n +1
}

rotate_backups() {
    log INFO "Rotating backups (keeping ${KEEP_COUNT} most recent)..."
    
    local backups=()
    local backup_count=0
    
    # Count backups
    backup_count=$(find "${BACKUPS_DIR}" -maxdepth 1 -name "*.json" -type f | wc -l)
    log INFO "Found ${backup_count} backups"
    
    if [ "${backup_count}" -le "${KEEP_COUNT}" ]; then
        log INFO "Backup count (${backup_count}) is at or below threshold (${KEEP_COUNT})"
        return 0
    fi
    
    # Get all backups sorted by modification time (oldest first)
    local to_archive=$((backup_count - KEEP_COUNT))
    log INFO "Moving ${to_archive} backups to archive..."
    
    while IFS= read -r backup_file; do
        local filename=$(basename "${backup_file}")
        log INFO "Archiving: ${filename}"
        mv "${backup_file}" "${ARCHIVE_DIR}/"
    done < <(find "${BACKUPS_DIR}" -maxdepth 1 -name "*.json" -type f -printf '%T@ %p\n' | \
             sort -n | \
             head -n "${to_archive}" | \
             awk '{print $NF}')
    
    log SUCCESS "Backup rotation complete"
}

cleanup_old_archives() {
    log INFO "Cleaning up archived backups older than 90 days..."
    
    local count=0
    while IFS= read -r archive_file; do
        log INFO "Securely deleting: $(basename "${archive_file}")"
        # Use shred for secure deletion if available
        if command -v shred &> /dev/null; then
            shred -u "${archive_file}" 2>/dev/null || rm -f "${archive_file}"
        else
            # Fallback to regular deletion
            rm -f "${archive_file}"
        fi
        ((count++))
    done < <(find "${ARCHIVE_DIR}" -maxdepth 1 -type f -mtime +90)
    
    if [ ${count} -gt 0 ]; then
        log SUCCESS "Deleted ${count} old archives"
    else
        log INFO "No archives older than 90 days"
    fi
}

encrypt_sensitive_backups() {
    if [ "${ENCRYPT}" = "true" ]; then
        log INFO "Encrypting sensitive backups..."
        # Note: Requires openssl to be installed
        if command -v openssl &> /dev/null; then
            for backup_file in "${BACKUPS_DIR}"/*.json; do
                if [ -f "${backup_file}" ]; then
                    log WARN "Encryption support needs implementation"
                    # openssl enc -aes-256-cbc -in "$backup_file" -out "$backup_file.enc"
                fi
            done
        else
            log WARN "openssl not found, skipping encryption"
        fi
    fi
}

###############################################################################
# Reporting
###############################################################################

report() {
    log INFO "=== BACKUP STATUS REPORT ==="
    
    echo ""
    echo "Recent Backups:"
    local count=0
    while IFS= read -r backup_file; do
        local size=$(du -h "${backup_file}" | cut -f1)
        local modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "${backup_file}")
        echo "  • $(basename "${backup_file}") (${size}) - ${modified}"
        ((count++))
    done < <(list_backups | tail -n "${KEEP_COUNT}")
    
    echo ""
    echo "Archive Directory:"
    local archive_count=$(find "${ARCHIVE_DIR}" -maxdepth 1 -type f | wc -l)
    echo "  • Contains ${archive_count} archived backups"
    local archive_size=$(du -sh "${ARCHIVE_DIR}" 2>/dev/null | cut -f1 || echo "0B")
    echo "  • Total size: ${archive_size}"
    
    echo ""
    log INFO "Report complete - see ${LOG_FILE} for details"
}

###############################################################################
# Main Execution
###############################################################################

main() {
    log INFO "=== Claude Config Backup Script Started ==="
    log INFO "Keep count: ${KEEP_COUNT}, Encrypt: ${ENCRYPT}"
    
    setup
    
    # Create fresh backup
    create_backup
    
    # Rotate old backups
    rotate_backups
    
    # Clean very old archives
    cleanup_old_archives
    
    # Optional encryption
    encrypt_sensitive_backups
    
    # Report status
    report
    
    log INFO "=== Backup Script Complete ==="
    echo ""
    log SUCCESS "All backup operations completed successfully"
}

# Run main function
main "$@"
