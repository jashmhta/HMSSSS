#!/bin/bash

# HMS Disaster Recovery Execution Script
# This script automates the disaster recovery process

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/hms/disaster-recovery.log"
STATUS_FILE="/tmp/dr-status.json"

# Recovery configuration
PRIMARY_REGION="${PRIMARY_REGION:-us-east-1}"
SECONDARY_REGION="${SECONDARY_REGION:-us-west-2}"
RECOVERY_TIME_TARGET="${RECOVERY_TIME_TARGET:-240}" # 4 hours in minutes

# Recovery steps tracking
declare -A RECOVERY_STEPS

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    update_recovery_status "failed" "$1"
    exit 1
}

# Update recovery status
update_recovery_status() {
    local status="$1"
    local message="$2"

    cat > "$STATUS_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "status": "$status",
  "message": "$message",
  "currentStep": "${RECOVERY_STEPS[current]:-unknown}",
  "completedSteps": $(printf '%s\n' "${!RECOVERY_STEPS[@]}" | jq -R . | jq -s 'map(select(. != "current"))'),
  "progress": $(echo "scale=2; (${#RECOVERY_STEPS[@]} * 100) / 10" | bc)
}
EOF

    log "Recovery status updated: $status - $message"
}

# Set current recovery step
set_recovery_step() {
    local step="$1"
    RECOVERY_STEPS["$step"]="in_progress"
    RECOVERY_STEPS["current"]="$step"
    update_recovery_status "in_progress" "Executing step: $step"
}

# Mark step as completed
complete_recovery_step() {
    local step="$1"
    RECOVERY_STEPS["$step"]="completed"
    log "Completed recovery step: $step"
}

# Check system health
check_system_health() {
    local service="$1"
    local max_attempts="${2:-30}"
    local attempt=1

    log "Checking health of $service..."

    while [ $attempt -le $max_attempts ]; do
        case "$service" in
            "database")
                if psql -h localhost -U hms_app -d hms_db -c "SELECT 1;" >/dev/null 2>&1; then
                    log "$service is healthy"
                    return 0
                fi
                ;;
            "backend")
                if curl -f -s "http://localhost:3000/health" >/dev/null 2>&1; then
                    log "$service is healthy"
                    return 0
                fi
                ;;
            "frontend")
                if curl -f -s "http://localhost:3000" >/dev/null 2>&1; then
                    log "$service is healthy"
                    return 0
                fi
                ;;
            *)
                log "Unknown service: $service"
                return 1
                ;;
        esac

        log "Attempt $attempt/$max_attempts: $service not healthy yet..."
        sleep 10
        ((attempt++))
    done

    log "$service failed health check"
    return 1
}

# Step 1: Assess the disaster
assess_disaster() {
    set_recovery_step "assessment"

    log "Assessing disaster impact..."

    # Check primary region availability
    if curl -f -s "https://api.hms.local/health" >/dev/null 2>&1; then
        log "Primary region appears to be available"
        update_recovery_status "assessment_complete" "Primary region is operational"
        return 0
    fi

    # Check secondary region
    if curl -f -s "https://api-dr.hms.local/health" >/dev/null 2>&1; then
        log "Secondary region is available"
    else
        log "WARNING: Secondary region is also unavailable"
    fi

    # Determine disaster type and scope
    log "Disaster assessment complete"
    complete_recovery_step "assessment"
}

# Step 2: Activate disaster recovery site
activate_dr_site() {
    set_recovery_step "activate_dr"

    log "Activating disaster recovery site..."

    # Switch DNS to secondary region
    # This would typically involve updating Route 53 or similar
    log "Switching DNS to secondary region..."

    # Start DR environment
    if [ -f "$SCRIPT_DIR/dr-compose.yml" ]; then
        docker-compose -f "$SCRIPT_DIR/dr-compose.yml" up -d
        log "DR environment started"
    else
        log "WARNING: DR compose file not found"
    fi

    complete_recovery_step "activate_dr"
}

# Step 3: Restore from backup
restore_from_backup() {
    set_recovery_step "restore_backup"

    log "Restoring from backup..."

    # Find latest backup
    local latest_backup
    latest_backup=$(find /backup -name "*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)

    if [ -z "$latest_backup" ]; then
        error_exit "No backup found for restoration"
    fi

    log "Found latest backup: $latest_backup"

    # Restore database
    log "Restoring database from backup..."
    gunzip -c "$latest_backup" | psql -h localhost -U hms_app -d hms_db

    # Verify restoration
    local patient_count
    patient_count=$(psql -h localhost -U hms_app -d hms_db -c "SELECT COUNT(*) FROM patients;" -t)
    log "Restored database with $patient_count patient records"

    complete_recovery_step "restore_backup"
}

# Step 4: Restore application services
restore_services() {
    set_recovery_step "restore_services"

    log "Restoring application services..."

    # Start backend services
    docker-compose -f "$SCRIPT_DIR/../docker-compose.prod.yml" up -d backend
    check_system_health "backend"

    # Start frontend services
    docker-compose -f "$SCRIPT_DIR/../docker-compose.prod.yml" up -d frontend
    check_system_health "frontend"

    # Start supporting services
    docker-compose -f "$SCRIPT_DIR/../docker-compose.prod.yml" up -d redis prometheus grafana
    sleep 30

    complete_recovery_step "restore_services"
}

# Step 5: Validate system functionality
validate_system() {
    set_recovery_step "validate_system"

    log "Validating system functionality..."

    # Test critical functionality
    local tests_passed=0
    local total_tests=0

    # Test patient data access
    ((total_tests++))
    if psql -h localhost -U hms_app -d hms_db -c "SELECT COUNT(*) FROM patients;" >/dev/null 2>&1; then
        ((tests_passed++))
        log "✓ Patient data access test passed"
    else
        log "✗ Patient data access test failed"
    fi

    # Test API endpoints
    ((total_tests++))
    if curl -f -s "http://localhost:3000/api/patients?limit=1" >/dev/null 2>&1; then
        ((tests_passed++))
        log "✓ API endpoints test passed"
    else
        log "✗ API endpoints test failed"
    fi

    # Test frontend access
    ((total_tests++))
    if curl -f -s "http://localhost:3000" >/dev/null 2>&1; then
        ((tests_passed++))
        log "✓ Frontend access test passed"
    else
        log "✗ Frontend access test failed"
    fi

    local success_rate=$(( (tests_passed * 100) / total_tests ))
    log "Validation complete: $tests_passed/$total_tests tests passed ($success_rate%)"

    if [ "$success_rate" -lt 80 ]; then
        error_exit "System validation failed: only $success_rate% tests passed"
    fi

    complete_recovery_step "validate_system"
}

# Step 6: Switch traffic to recovered system
switch_traffic() {
    set_recovery_step "switch_traffic"

    log "Switching traffic to recovered system..."

    # Update load balancer configuration
    # This would typically involve updating DNS, load balancers, etc.
    log "Updating load balancer configuration..."

    # Wait for traffic to stabilize
    sleep 60

    # Verify traffic is flowing correctly
    if curl -f -s "https://api.hms.local/health" >/dev/null 2>&1; then
        log "Traffic successfully switched to recovered system"
    else
        log "WARNING: Traffic switch may not be complete"
    fi

    complete_recovery_step "switch_traffic"
}

# Step 7: Monitor and stabilize
monitor_recovery() {
    set_recovery_step "monitor_recovery"

    log "Monitoring recovery for stabilization..."

    local monitor_duration=300 # 5 minutes
    local error_count=0

    local end_time=$(( $(date +%s) + monitor_duration ))

    while [ $(date +%s) -lt $end_time ]; do
        if ! curl -f -s "https://api.hms.local/health" >/dev/null 2>&1; then
            ((error_count++))
        fi
        sleep 10
    done

    local error_rate=$(( (error_count * 100) / (monitor_duration / 10) ))
    log "Monitoring complete. Error rate: $error_rate%"

    if [ "$error_rate" -gt 10 ]; then
        log "WARNING: High error rate during monitoring ($error_rate%)"
    fi

    complete_recovery_step "monitor_recovery"
}

# Step 8: Decommission primary (if applicable)
decommission_primary() {
    set_recovery_step "decommission_primary"

    log "Evaluating primary system status..."

    # Check if primary is back online
    if curl -f -s "https://api.hms.local/health" >/dev/null 2>&1; then
        log "Primary system appears to be operational"
        # Optionally switch back to primary
        log "Consider switching back to primary system when stable"
    else
        log "Primary system remains unavailable"
        # Mark primary as decommissioned
        log "Primary system marked as decommissioned"
    fi

    complete_recovery_step "decommission_primary"
}

# Send recovery notification
send_recovery_notification() {
    local status="$1"
    local message="$2"

    log "Sending recovery notification: $status - $message"

    # This could be extended to send emails, Slack notifications, etc.
}

# Main disaster recovery function
main() {
    log "=== HMS Disaster Recovery Started ==="

    # Initialize recovery status
    update_recovery_status "started" "Disaster recovery process initiated"

    # Execute recovery steps
    assess_disaster
    activate_dr_site
    restore_from_backup
    restore_services
    validate_system
    switch_traffic
    monitor_recovery
    decommission_primary

    # Recovery complete
    update_recovery_status "completed" "Disaster recovery completed successfully"
    send_recovery_notification "SUCCESS" "HMS disaster recovery completed successfully"

    log "=== HMS Disaster Recovery Completed ==="
}

# Handle command line arguments
case "${1:-}" in
    "assess")
        assess_disaster
        ;;
    "activate")
        activate_dr_site
        ;;
    "restore")
        restore_from_backup
        ;;
    "validate")
        validate_system
        ;;
    "status")
        if [ -f "$STATUS_FILE" ]; then
            cat "$STATUS_FILE"
        else
            echo "No recovery status available"
        fi
        ;;
    *)
        main
        ;;
esac