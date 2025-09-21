#!/bin/bash

# HMS Database Backup Strategy Script
# This script implements a comprehensive backup strategy for production databases

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="/backup"
LOG_FILE="/var/log/hms/backup.log"

# Database connection details
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-hms_db}"
DB_USER="${POSTGRES_USER:-hms_app}"
DB_PASSWORD="${POSTGRES_PASSWORD}"

# Backup configuration
DAILY_RETENTION="${DAILY_RETENTION:-7}"
WEEKLY_RETENTION="${WEEKLY_RETENTION:-4}"
MONTHLY_RETENTION="${MONTHLY_RETENTION:-12}"
YEARLY_RETENTION="${YEARLY_RETENTION:-5}"

# Cloud storage configuration
S3_BUCKET="${S3_BUCKET:-}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}"
AZURE_STORAGE_ACCOUNT="${AZURE_STORAGE_ACCOUNT:-}"
AZURE_STORAGE_KEY="${AZURE_STORAGE_KEY:-}"

# Encryption
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
ENCRYPT_BACKUPS="${ENCRYPT_BACKUPS:-true}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Create backup directories
create_backup_directories() {
    local backup_date
    backup_date=$(date +%Y%m%d)

    DAILY_DIR="$BACKUP_ROOT/daily/$backup_date"
    WEEKLY_DIR="$BACKUP_ROOT/weekly/$backup_date"
    MONTHLY_DIR="$BACKUP_ROOT/monthly/$backup_date"
    YEARLY_DIR="$BACKUP_ROOT/yearly/$backup_date"

    mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR" "$YEARLY_DIR"
}

# Create database backup
create_database_backup() {
    local backup_type="$1"
    local backup_dir="$2"
    local backup_name="hms_${backup_type}_$(date +%Y%m%d_%H%M%S)"

    log "Creating $backup_type database backup: $backup_name"

    local backup_file="$backup_dir/${backup_name}.sql.gz"

    # Set PGPASSWORD for pg_dump
    export PGPASSWORD="$DB_PASSWORD"

    # Create compressed backup
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --format=custom \
        --compress=9 \
        --verbose \
        --no-password \
        --file="$backup_file.tmp" \
        2>> "$LOG_FILE"

    # Compress with gzip
    gzip -c "$backup_file.tmp" > "$backup_file"

    # Encrypt if configured
    if [ "$ENCRYPT_BACKUPS" = "true" ] && [ -n "$BACKUP_ENCRYPTION_KEY" ]; then
        log "Encrypting backup file..."
        openssl enc -aes-256-cbc -salt -in "$backup_file" -out "${backup_file}.enc" -k "$BACKUP_ENCRYPTION_KEY"
        rm "$backup_file"
        backup_file="${backup_file}.enc"
    fi

    # Remove temporary file
    rm -f "$backup_file.tmp"

    # Verify backup
    if [ ! -f "$backup_file" ]; then
        error_exit "$backup_type backup file was not created"
    fi

    local backup_size
    backup_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null)
    log "$backup_type backup completed successfully. Size: $backup_size bytes"

    echo "$backup_file"
}

# Upload to cloud storage
upload_to_cloud() {
    local backup_file="$1"
    local backup_type="$2"

    if [ -z "$S3_BUCKET" ] && [ -z "$AZURE_STORAGE_ACCOUNT" ]; then
        log "Cloud storage not configured, skipping upload"
        return 0
    fi

    local remote_path="${backup_type}/$(basename "$backup_file")"

    # Upload to S3
    if [ -n "$S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ]; then
        log "Uploading to S3: s3://$S3_BUCKET/$remote_path"

        export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"

        if aws s3 cp "$backup_file" "s3://$S3_BUCKET/$remote_path" --storage-class STANDARD_IA; then
            log "S3 upload successful"
        else
            log "WARNING: S3 upload failed"
        fi
    fi

    # Upload to Azure
    if [ -n "$AZURE_STORAGE_ACCOUNT" ] && [ -n "$AZURE_STORAGE_KEY" ]; then
        log "Uploading to Azure: $AZURE_STORAGE_ACCOUNT/$remote_path"

        export AZURE_STORAGE_ACCOUNT="$AZURE_STORAGE_ACCOUNT"
        export AZURE_STORAGE_KEY="$AZURE_STORAGE_KEY"

        if az storage blob upload --container-name backups --file "$backup_file" --name "$remote_path"; then
            log "Azure upload successful"
        else
            log "WARNING: Azure upload failed"
        fi
    fi
}

# Clean up old backups
cleanup_old_backups() {
    local backup_type="$1"
    local retention_days="$2"
    local backup_dir="$BACKUP_ROOT/$backup_type"

    log "Cleaning up old $backup_type backups (retention: $retention_days days)"

    # Remove local old backups
    find "$backup_dir" -name "*.sql.gz*" -mtime +"$retention_days" -delete
    find "$backup_dir" -name "*.enc" -mtime +"$retention_days" -delete

    # Remove empty directories
    find "$backup_dir" -type d -empty -delete

    # Clean up cloud storage
    if [ -n "$S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ]; then
        log "Cleaning up old $backup_type backups from S3"
        aws s3 ls "s3://$S3_BUCKET/$backup_type/" | while read -r line; do
            local file_date
            file_date=$(echo "$line" | awk '{print $1}')
            local file_name
            file_name=$(echo "$line" | awk '{print $4}')

            if [[ "$file_name" =~ \.sql\.gz ]]; then
                local create_timestamp
                create_timestamp=$(date -d "$file_date" +%s)
                local current_timestamp
                current_timestamp=$(date +%s)
                local age_days=$(( (current_timestamp - create_timestamp) / 86400 ))

                if [ "$age_days" -gt "$retention_days" ]; then
                    aws s3 rm "s3://$S3_BUCKET/$backup_type/$file_name"
                    log "Removed old $backup_type backup from S3: $file_name"
                fi
            fi
        done
    fi

    log "$backup_type cleanup completed"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    local backup_type="$2"

    log "Verifying $backup_type backup integrity: $(basename "$backup_file")"

    # Decrypt if necessary
    local verify_file="$backup_file"
    if [[ "$backup_file" == *.enc ]]; then
        verify_file="${backup_file%.enc}"
        openssl enc -d -aes-256-cbc -in "$backup_file" -out "$verify_file" -k "$BACKUP_ENCRYPTION_KEY"
    fi

    # Test if backup can be restored (without actually restoring)
    if gunzip -c "$verify_file" | pg_restore --list >/dev/null 2>&1; then
        log "$backup_type backup integrity verification successful"
    else
        error_exit "$backup_type backup integrity verification failed"
    fi

    # Clean up decrypted file if it was temporary
    if [[ "$backup_file" == *.enc ]]; then
        rm -f "$verify_file"
    fi
}

# Generate backup report
generate_backup_report() {
    local backup_type="$1"
    local backup_file="$2"

    log "Generating $backup_type backup report"

    local report_file="$BACKUP_ROOT/reports/${backup_type}_$(date +%Y%m%d_%H%M%S).report"

    mkdir -p "$BACKUP_ROOT/reports"

    {
        echo "HMS Database Backup Report"
        echo "=========================="
        echo "Backup Type: $backup_type"
        echo "Timestamp: $(date)"
        echo "Database: $DB_NAME"
        echo "Backup File: $(basename "$backup_file")"
        echo "File Size: $(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null) bytes"
        echo "Encryption: $([ "$ENCRYPT_BACKUPS" = "true" ] && echo "Enabled" || echo "Disabled")"
        echo ""

        # Database statistics
        echo "Database Statistics:"
        export PGPASSWORD="$DB_PASSWORD"
        psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" \
            -c "SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del FROM pg_stat_user_tables ORDER BY n_tup_ins DESC LIMIT 10;" \
            >> "$report_file"

    } > "$report_file"

    log "$backup_type backup report generated: $report_file"
}

# Send notification
send_backup_notification() {
    local backup_type="$1"
    local status="$2"
    local message="$3"

    log "Sending $backup_type backup notification: $status - $message"

    # This could be extended to send emails, Slack notifications, etc.
}

# Main backup functions
perform_daily_backup() {
    log "=== Starting Daily Backup ==="

    create_backup_directories
    local backup_file
    backup_file=$(create_database_backup "daily" "$DAILY_DIR")
    verify_backup "$backup_file" "daily"
    upload_to_cloud "$backup_file" "daily"
    generate_backup_report "daily" "$backup_file"
    cleanup_old_backups "daily" "$DAILY_RETENTION"

    log "=== Daily Backup Completed ==="
    send_backup_notification "daily" "SUCCESS" "Daily backup completed successfully"
}

perform_weekly_backup() {
    log "=== Starting Weekly Backup ==="

    create_backup_directories
    local backup_file
    backup_file=$(create_database_backup "weekly" "$WEEKLY_DIR")
    verify_backup "$backup_file" "weekly"
    upload_to_cloud "$backup_file" "weekly"
    generate_backup_report "weekly" "$backup_file"
    cleanup_old_backups "weekly" "$WEEKLY_RETENTION"

    log "=== Weekly Backup Completed ==="
    send_backup_notification "weekly" "SUCCESS" "Weekly backup completed successfully"
}

perform_monthly_backup() {
    log "=== Starting Monthly Backup ==="

    create_backup_directories
    local backup_file
    backup_file=$(create_database_backup "monthly" "$MONTHLY_DIR")
    verify_backup "$backup_file" "monthly"
    upload_to_cloud "$backup_file" "monthly"
    generate_backup_report "monthly" "$backup_file"
    cleanup_old_backups "monthly" "$MONTHLY_RETENTION"

    log "=== Monthly Backup Completed ==="
    send_backup_notification "monthly" "SUCCESS" "Monthly backup completed successfully"
}

# Main execution
main() {
    case "${1:-}" in
        "daily")
            perform_daily_backup
            ;;
        "weekly")
            perform_weekly_backup
            ;;
        "monthly")
            perform_monthly_backup
            ;;
        "full")
            perform_daily_backup
            perform_weekly_backup
            perform_monthly_backup
            ;;
        *)
            echo "Usage: $0 {daily|weekly|monthly|full}"
            echo "Performs the specified type of database backup"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"