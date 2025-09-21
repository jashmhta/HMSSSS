#!/bin/bash

# HMS Database Migration Script
# This script handles database migrations for production deployments

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="/backup/migrations"
LOG_FILE="/var/log/hms/migration.log"

# Database connection details
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-hms_db}"
DB_USER="${POSTGRES_USER:-hms_app}"
DB_PASSWORD="${POSTGRES_PASSWORD}"

# Migration settings
MIGRATION_TIMEOUT="${MIGRATION_TIMEOUT:-300}"
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
        log "Attempting rollback..."
        rollback_migration
    fi
    exit 1
}

# Create backup before migration
create_pre_migration_backup() {
    log "Creating pre-migration backup..."

    local backup_file="$BACKUP_DIR/pre_migration_$(date +%Y%m%d_%H%M%S).sql"

    mkdir -p "$BACKUP_DIR"

    export PGPASSWORD="$DB_PASSWORD"
    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --format=custom \
        --compress=9 \
        --verbose \
        --no-password \
        --file="$backup_file" \
        2>> "$LOG_FILE"

    log "Pre-migration backup created: $backup_file"
    echo "$backup_file" > "$BACKUP_DIR/latest_pre_migration.backup"
}

# Run Prisma migrations
run_prisma_migrations() {
    log "Running Prisma migrations..."

    # Set database URL for Prisma
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

    # Run migrations with timeout
    timeout "$MIGRATION_TIMEOUT" npx prisma migrate deploy

    if [ $? -eq 124 ]; then
        error_exit "Migration timed out after ${MIGRATION_TIMEOUT} seconds"
    fi

    log "Prisma migrations completed successfully"
}

# Run custom migration scripts
run_custom_migrations() {
    log "Running custom migration scripts..."

    # Find and execute custom migration scripts
    for script in "$SCRIPT_DIR"/migrations/*.sql; do
        if [ -f "$script" ]; then
            log "Executing custom migration: $(basename "$script")"

            export PGPASSWORD="$DB_PASSWORD"
            psql \
                --host="$DB_HOST" \
                --port="$DB_PORT" \
                --username="$DB_USER" \
                --dbname="$DB_NAME" \
                --file="$script" \
                --single-transaction \
                2>> "$LOG_FILE"

            log "Custom migration $(basename "$script") completed"
        fi
    done
}

# Validate migration
validate_migration() {
    log "Validating migration..."

    # Check database connectivity
    export PGPASSWORD="$DB_PASSWORD"
    if ! psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        error_exit "Database connectivity check failed"
    fi

    # Check if all expected tables exist
    local expected_tables=("patients" "appointments" "medical_records" "laboratory_tests" "radiology_exams")
    for table in "${expected_tables[@]}"; do
        if ! psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" -c "SELECT 1 FROM $table LIMIT 1;" >/dev/null 2>&1; then
            error_exit "Expected table '$table' does not exist or is not accessible"
        fi
    done

    # Check data integrity
    local patient_count
    patient_count=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" -c "SELECT COUNT(*) FROM patients;" -t)
    log "Patient count after migration: $patient_count"

    log "Migration validation completed successfully"
}

# Rollback migration
rollback_migration() {
    log "Rolling back migration..."

    local backup_file="$BACKUP_DIR/latest_pre_migration.backup"

    if [ ! -f "$backup_file" ]; then
        log "No pre-migration backup found, cannot rollback"
        return 1
    fi

    local actual_backup
    actual_backup=$(cat "$backup_file")

    if [ ! -f "$actual_backup" ]; then
        log "Pre-migration backup file not found: $actual_backup"
        return 1
    fi

    log "Restoring from backup: $actual_backup"

    # Drop and recreate database
    export PGPASSWORD="$DB_PASSWORD"
    psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="postgres" -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>> "$LOG_FILE"
    psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="postgres" -c "CREATE DATABASE $DB_NAME;" 2>> "$LOG_FILE"

    # Restore from backup
    pg_restore \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --no-password \
        "$actual_backup" \
        2>> "$LOG_FILE"

    log "Migration rollback completed"
}

# Post-migration tasks
post_migration_tasks() {
    log "Running post-migration tasks..."

    # Update database statistics
    export PGPASSWORD="$DB_PASSWORD"
    psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" -c "ANALYZE;" 2>> "$LOG_FILE"

    # Vacuum database
    psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" -c "VACUUM;" 2>> "$LOG_FILE"

    log "Post-migration tasks completed"
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"

    log "Sending migration notification: $status - $message"

    # This could be extended to send emails, Slack notifications, etc.
    # For now, just log the notification
}

# Main migration function
main() {
    log "=== HMS Database Migration Started ==="

    # Trap for cleanup on error
    trap 'error_exit "Migration script interrupted"' INT TERM

    create_pre_migration_backup
    run_prisma_migrations
    run_custom_migrations
    validate_migration
    post_migration_tasks

    log "=== HMS Database Migration Completed Successfully ==="
    send_notification "SUCCESS" "Database migration completed successfully"
}

# Handle command line arguments
case "${1:-}" in
    "rollback")
        log "Manual rollback requested"
        rollback_migration
        ;;
    "validate")
        log "Validation only mode"
        validate_migration
        ;;
    *)
        main
        ;;
esac