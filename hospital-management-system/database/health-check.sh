#!/bin/bash

# HMS Database Health Check Script
# This script monitors database health and performance metrics

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/hms/health-check.log"
ALERT_LOG="/var/log/hms/alerts.log"

# Database connection details
DB_HOST="${POSTGRES_HOST:-postgres}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-hms_db}"
DB_USER="${POSTGRES_USER:-hms_app}"
DB_PASSWORD="${POSTGRES_PASSWORD}"

# Health check thresholds
CONNECTION_THRESHOLD="${CONNECTION_THRESHOLD:-50}"
CPU_THRESHOLD="${CPU_THRESHOLD:-80}"
MEMORY_THRESHOLD="${MEMORY_THRESHOLD:-85}"
DISK_THRESHOLD="${DISK_THRESHOLD:-90}"
REPLICATION_LAG_THRESHOLD="${REPLICATION_LAG_THRESHOLD:-60}"

# Alert configuration
ALERT_EMAIL="${ALERT_EMAIL:-}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Logging functions
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

alert() {
    local message="$1"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ALERT: $message" | tee -a "$ALERT_LOG"

    # Send email alert if configured
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "HMS Database Alert" "$ALERT_EMAIL"
    fi

    # Send Slack alert if configured
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 HMS Database Alert: $message\"}" \
            "$SLACK_WEBHOOK"
    fi
}

# Check database connectivity
check_connectivity() {
    log "Checking database connectivity..."

    export PGPASSWORD="$DB_PASSWORD"
    if psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" \
        --command="SELECT 1;" --quiet >/dev/null 2>&1; then
        log "Database connectivity: OK"
        return 0
    else
        alert "Database connectivity: FAILED"
        return 1
    fi
}

# Check connection count
check_connections() {
    log "Checking database connections..."

    export PGPASSWORD="$DB_PASSWORD"
    local active_connections
    active_connections=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
        --dbname="$DB_NAME" --command="SELECT COUNT(*) FROM pg_stat_activity;" --tuples-only)

    log "Active connections: $active_connections"

    if [ "$active_connections" -gt "$CONNECTION_THRESHOLD" ]; then
        alert "High connection count: $active_connections (threshold: $CONNECTION_THRESHOLD)"
    fi
}

# Check database performance
check_performance() {
    log "Checking database performance..."

    export PGPASSWORD="$DB_PASSWORD"

    # Check slow queries
    local slow_queries
    slow_queries=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
        --dbname="$DB_NAME" --command="SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '30 seconds';" --tuples-only)

    if [ "$slow_queries" -gt 0 ]; then
        alert "Slow queries detected: $slow_queries queries running longer than 30 seconds"
    fi

    # Check cache hit ratio
    local cache_hit_ratio
    cache_hit_ratio=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
        --dbname="$DB_NAME" --command="SELECT ROUND(100 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2) FROM pg_stat_database WHERE datname = '$DB_NAME';" --tuples-only)

    log "Cache hit ratio: $cache_hit_ratio%"

    if [ "$(echo "$cache_hit_ratio < 90" | bc -l)" -eq 1 ]; then
        alert "Low cache hit ratio: $cache_hit_ratio% (should be > 90%)"
    fi

    # Check dead tuples
    local dead_tuples
    dead_tuples=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
        --dbname="$DB_NAME" --command="SELECT SUM(n_dead_tup) FROM pg_stat_user_tables;" --tuples-only)

    log "Dead tuples: $dead_tuples"

    if [ "$dead_tuples" -gt 10000 ]; then
        alert "High dead tuple count: $dead_tuples (consider VACUUM)"
    fi
}

# Check replication status (if standby exists)
check_replication() {
    log "Checking replication status..."

    export PGPASSWORD="$DB_PASSWORD"

    # Check if this is a primary database
    local is_primary
    is_primary=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
        --dbname="$DB_NAME" --command="SELECT pg_is_in_recovery();" --tuples-only)

    if [ "$is_primary" = "f" ]; then
        # This is primary, check standby status
        local standby_count
        standby_count=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
            --dbname="$DB_NAME" --command="SELECT COUNT(*) FROM pg_stat_replication;" --tuples_only)

        log "Connected standbys: $standby_count"

        if [ "$standby_count" -eq 0 ]; then
            alert "No standby databases connected"
        fi

        # Check replication lag
        psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
            --dbname="$DB_NAME" --command="SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn FROM pg_stat_replication;" \
            >> "$LOG_FILE"
    else
        # This is standby, check if in recovery
        log "Database is in recovery mode (standby)"
    fi
}

# Check system resources
check_system_resources() {
    log "Checking system resources..."

    # Check disk usage
    local disk_usage
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

    log "Disk usage: $disk_usage%"

    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        alert "High disk usage: $disk_usage% (threshold: $DISK_THRESHOLD%)"
    fi

    # Check memory usage (if available)
    if command -v free >/dev/null 2>&1; then
        local memory_usage
        memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')

        log "Memory usage: $memory_usage%"

        if [ "$memory_usage" -gt "$MEMORY_THRESHOLD" ]; then
            alert "High memory usage: $memory_usage% (threshold: $MEMORY_THRESHOLD%)"
        fi
    fi

    # Check CPU usage (if available)
    if command -v top >/dev/null 2>&1; then
        local cpu_usage
        cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')

        log "CPU usage: $cpu_usage%"

        if [ "$(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l)" -eq 1 ]; then
            alert "High CPU usage: $cpu_usage% (threshold: $CPU_THRESHOLD%)"
        fi
    fi
}

# Check backup status
check_backup_status() {
    log "Checking backup status..."

    local latest_backup
    latest_backup=$(find /backup -name "*.sql.gz*" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

    if [ -z "$latest_backup" ]; then
        alert "No recent backups found"
        return
    fi

    local backup_age_hours
    backup_age_hours=$(( ($(date +%s) - $(stat -c %Y "$latest_backup")) / 3600 ))

    log "Latest backup: $latest_backup (age: $backup_age_hours hours)"

    if [ "$backup_age_hours" -gt 24 ]; then
        alert "Backup is too old: $backup_age_hours hours since last backup"
    fi
}

# Generate health report
generate_health_report() {
    log "Generating health report..."

    local report_file="/tmp/health-report-$(date +%Y%m%d_%H%M%S).txt"

    {
        echo "HMS Database Health Report"
        echo "=========================="
        echo "Timestamp: $(date)"
        echo "Database: $DB_NAME"
        echo ""

        echo "Connectivity: $(check_connectivity && echo 'OK' || echo 'FAILED')"
        echo ""

        echo "Performance Metrics:"
        export PGPASSWORD="$DB_PASSWORD"
        psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" \
            --dbname="$DB_NAME" --command="SELECT * FROM hms.database_stats LIMIT 5;" \
            >> "$report_file" 2>/dev/null || echo "Performance data not available"

    } > "$report_file"

    log "Health report generated: $report_file"
}

# Main health check function
main() {
    log "=== HMS Database Health Check Started ==="

    # Run all checks
    check_connectivity
    check_connections
    check_performance
    check_replication
    check_system_resources
    check_backup_status

    # Generate report
    generate_health_report

    log "=== HMS Database Health Check Completed ==="
}

# Handle command line arguments
case "${1:-}" in
    "connectivity")
        check_connectivity
        ;;
    "performance")
        check_performance
        ;;
    "replication")
        check_replication
        ;;
    "resources")
        check_system_resources
        ;;
    "backup")
        check_backup_status
        ;;
    "report")
        generate_health_report
        ;;
    *)
        main
        ;;
esac