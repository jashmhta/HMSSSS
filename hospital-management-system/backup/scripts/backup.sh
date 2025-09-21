#!/bin/bash

# HMS Database Backup Script
# This script performs automated database backups with compression and optional cloud upload

set -e

# Configuration
BACKUP_DIR="/backup"
LOG_FILE="/var/log/backup/backup.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="hms_backup_${TIMESTAMP}"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql.gz"

# Database connection details
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-hms_db}"
DB_USER="${POSTGRES_USER:-hms_app}"
DB_PASSWORD="${POSTGRES_PASSWORD}"

# Backup configuration
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
COMPRESSION_LEVEL="${COMPRESSION_LEVEL:-6}"

# Cloud upload configuration
S3_BUCKET="${S3_BUCKET:-}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Validate environment
validate_environment() {
    log "Validating environment..."

    if [ -z "$DB_PASSWORD" ]; then
        error_exit "Database password not set"
    fi

    if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
        error_exit "Database connection parameters not set"
    fi

    # Test database connection
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        error_exit "Cannot connect to database"
    fi

    log "Environment validation successful"
}

# Create backup
create_backup() {
    log "Starting database backup: $BACKUP_NAME"

    # Set PGPASSWORD for pg_dump
    export PGPASSWORD="$DB_PASSWORD"

    # Create backup with pg_dump
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --format=custom \
        --compress="$COMPRESSION_LEVEL" \
        --verbose \
        --no-password \
        --file="$BACKUP_FILE.tmp" \
        2>> "$LOG_FILE"

    # Compress the backup
    gzip -c "$BACKUP_FILE.tmp" > "$BACKUP_FILE"

    # Remove temporary file
    rm -f "$BACKUP_FILE.tmp"

    # Verify backup file
    if [ ! -f "$BACKUP_FILE" ]; then
        error_exit "Backup file was not created"
    fi

    local backup_size
    backup_size=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null)
    log "Backup completed successfully. Size: $backup_size bytes"
}

# Upload to cloud storage
upload_to_cloud() {
    if [ -z "$S3_BUCKET" ] || [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        log "Cloud upload not configured, skipping..."
        return 0
    fi

    log "Uploading backup to S3: s3://$S3_BUCKET/$BACKUP_NAME.sql.gz"

    # Set AWS credentials
    export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
    export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"

    # Upload to S3
    if aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/$BACKUP_NAME.sql.gz" --storage-class STANDARD_IA; then
        log "Cloud upload successful"
    else
        log "WARNING: Cloud upload failed"
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up old backups (retention: $BACKUP_RETENTION_DAYS days)"

    # Remove local old backups
    find "$BACKUP_DIR" -name "hms_backup_*.sql.gz" -mtime +"$BACKUP_RETENTION_DAYS" -delete

    # Remove old backups from S3 if configured
    if [ -n "$S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ]; then
        log "Cleaning up old backups from S3"
        aws s3 ls "s3://$S3_BUCKET/" | while read -r line; do
            create_date=$(echo "$line" | awk '{print $1}')
            file_name=$(echo "$line" | awk '{print $4}')

            if [[ "$file_name" =~ hms_backup_.*\.sql\.gz ]]; then
                create_timestamp=$(date -d "$create_date" +%s)
                current_timestamp=$(date +%s)
                age_days=$(( (current_timestamp - create_timestamp) / 86400 ))

                if [ "$age_days" -gt "$BACKUP_RETENTION_DAYS" ]; then
                    aws s3 rm "s3://$S3_BUCKET/$file_name"
                    log "Removed old backup from S3: $file_name"
                fi
            fi
        done
    fi

    log "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."

    # Test if backup can be restored (without actually restoring)
    if gunzip -c "$BACKUP_FILE" | pg_restore --list >/dev/null 2>&1; then
        log "Backup integrity verification successful"
    else
        error_exit "Backup integrity verification failed"
    fi
}

# Send notification (placeholder for future implementation)
send_notification() {
    local status="$1"
    local message="$2"

    log "Sending notification: $status - $message"

    # This could be extended to send emails, Slack notifications, etc.
    # For now, just log the notification
}

# Main execution
main() {
    log "=== HMS Database Backup Started ==="

    validate_environment
    create_backup
    verify_backup
    upload_to_cloud
    cleanup_old_backups

    log "=== HMS Database Backup Completed Successfully ==="
    send_notification "SUCCESS" "Database backup completed: $BACKUP_NAME"
}

# Trap for cleanup on error
trap 'error_exit "Backup script interrupted"' INT TERM

# Run main function
main "$@"