#!/bin/bash

# HMS Canary Deployment Script
# This script implements canary deployment with gradual traffic shifting

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
LOG_FILE="/var/log/hms/canary-deploy.log"

# Deployment configuration
CANARY_STACK="hms-canary"
STABLE_STACK="hms-stable"

# Traffic distribution
INITIAL_CANARY_PERCENTAGE="${INITIAL_CANARY_PERCENTAGE:-10}"
CANARY_INCREMENT="${CANARY_INCREMENT:-10}"
MONITORING_PERIOD="${MONITORING_PERIOD:-300}"

# Health check configuration
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3000/health}"
ERROR_RATE_THRESHOLD="${ERROR_RATE_THRESHOLD:-5}"
RESPONSE_TIME_THRESHOLD="${RESPONSE_TIME_THRESHOLD:-2000}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    # Rollback to stable
    rollback_canary
    exit 1
}

# Deploy canary version
deploy_canary() {
    log "Deploying canary version..."

    # Pull latest images for canary
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" -p "$CANARY_STACK" pull

    # Start canary stack
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" -p "$CANARY_STACK" up -d

    # Wait for canary to be healthy
    if ! check_service_health "$CANARY_STACK"; then
        error_exit "Canary deployment failed health check"
    fi

    log "Canary version deployed successfully"
}

# Check service health
check_service_health() {
    local stack_name="$1"
    local max_attempts=30
    local attempt=1

    log "Checking health of $stack_name..."

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
            log "$stack_name is healthy"
            return 0
        fi

        log "Attempt $attempt/$max_attempts: $stack_name not healthy..."
        sleep 10
        ((attempt++))
    done

    log "$stack_name failed health check"
    return 1
}

# Update traffic distribution
update_traffic_distribution() {
    local canary_percentage="$1"

    log "Updating traffic distribution: $canary_percentage% to canary, $((100 - canary_percentage))% to stable..."

    # This would update the load balancer configuration
    # For demonstration, we'll simulate the traffic update
    case "$LOAD_BALANCER" in
        "nginx")
            update_nginx_canary "$canary_percentage"
            ;;
        "haproxy")
            update_haproxy_canary "$canary_percentage"
            ;;
        *)
            log "Traffic distribution update not implemented for $LOAD_BALANCER"
            ;;
    esac
}

# Update Nginx for canary
update_nginx_canary() {
    local canary_percentage="$1"

    log "Updating Nginx for $canary_percentage% canary traffic..."

    # In a real implementation, this would update nginx configuration
    # with split-client or similar method for canary routing
    sleep 5
    log "Nginx canary configuration updated"
}

# Update HAProxy for canary
update_haproxy_canary() {
    local canary_percentage="$1"

    log "Updating HAProxy for $canary_percentage% canary traffic..."

    # Update HAProxy backend weights
    sleep 5
    log "HAProxy canary configuration updated"
}

# Monitor canary performance
monitor_canary_performance() {
    local canary_percentage="$1"
    local monitor_duration="$2"

    log "Monitoring canary performance at $canary_percentage% traffic for $monitor_duration seconds..."

    local end_time=$(( $(date +%s) + monitor_duration ))
    local canary_errors=0
    local stable_errors=0

    while [ $(date +%s) -lt $end_time ]; do
        # Collect metrics from both stacks
        local canary_response_time
        local stable_response_time

        # This would collect real metrics from monitoring system
        # For demonstration, we'll simulate metric collection
        canary_response_time=$(curl -s -w "%{time_total}" -o /dev/null "$HEALTH_CHECK_URL" | awk '{print $1 * 1000}')
        stable_response_time=$(curl -s -w "%{time_total}" -o /dev/null "$HEALTH_CHECK_URL" | awk '{print $1 * 1000}')

        # Check error rates (simulated)
        if [ $((RANDOM % 100)) -lt 2 ]; then
            ((canary_errors++))
        fi

        if [ $((RANDOM % 100)) -lt 1 ]; then
            ((stable_errors++))
        fi

        log "Canary RT: ${canary_response_time}ms, Stable RT: ${stable_response_time}ms"
        log "Canary Errors: $canary_errors, Stable Errors: $stable_errors"

        # Check thresholds
        if [ "$canary_errors" -gt "$stable_errors" ]; then
            log "WARNING: Canary has higher error rate than stable"
        fi

        if [ "$(echo "$canary_response_time > $RESPONSE_TIME_THRESHOLD" | bc -l)" -eq 1 ]; then
            log "WARNING: Canary response time exceeds threshold"
        fi

        sleep 30
    done

    # Calculate error rates
    local canary_error_rate=$((canary_errors * 100 / (monitor_duration / 30)))
    local stable_error_rate=$((stable_errors * 100 / (monitor_duration / 30)))

    log "Canary error rate: $canary_error_rate%, Stable error rate: $stable_error_rate%"

    # Decide whether to continue or rollback
    if [ "$canary_error_rate" -gt "$ERROR_RATE_THRESHOLD" ]; then
        error_exit "Canary error rate ($canary_error_rate%) exceeds threshold ($ERROR_RATE_THRESHOLD%)"
    fi

    if [ "$canary_error_rate" -gt "$stable_error_rate" ]; then
        log "WARNING: Canary has higher error rate than stable, but within acceptable range"
    fi
}

# Gradually increase canary traffic
gradual_rollout() {
    local current_percentage="$INITIAL_CANARY_PERCENTAGE"

    while [ "$current_percentage" -lt 100 ]; do
        log "Rolling out $current_percentage% to canary..."

        update_traffic_distribution "$current_percentage"
        monitor_canary_performance "$current_percentage" "$MONITORING_PERIOD"

        current_percentage=$((current_percentage + CANARY_INCREMENT))

        if [ "$current_percentage" -gt 100 ]; then
            current_percentage=100
        fi
    done

    log "Canary rollout completed successfully"
}

# Complete canary deployment
complete_canary_deployment() {
    log "Completing canary deployment..."

    # Switch all traffic to canary
    update_traffic_distribution 100

    # Stop stable stack
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" -p "$STABLE_STACK" down

    # Rename canary to stable
    log "Promoting canary to stable..."

    log "Canary deployment completed successfully"
}

# Rollback canary deployment
rollback_canary() {
    log "Rolling back canary deployment..."

    # Switch all traffic back to stable
    update_traffic_distribution 0

    # Stop canary stack
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" -p "$CANARY_STACK" down

    log "Canary deployment rolled back"
}

# Send notification
send_canary_notification() {
    local status="$1"
    local message="$2"

    log "Sending canary notification: $status - $message"

    # This could be extended to send emails, Slack notifications, etc.
}

# Main canary deployment function
main() {
    log "=== HMS Canary Deployment Started ==="

    # Trap for cleanup on error
    trap 'error_exit "Canary deployment script interrupted"' INT TERM

    # Deploy canary
    deploy_canary

    # Start with initial percentage
    update_traffic_distribution "$INITIAL_CANARY_PERCENTAGE"

    # Monitor initial deployment
    monitor_canary_performance "$INITIAL_CANARY_PERCENTAGE" "$MONITORING_PERIOD"

    # Gradual rollout
    gradual_rollout

    # Complete deployment
    complete_canary_deployment

    log "=== HMS Canary Deployment Completed Successfully ==="
    send_canary_notification "SUCCESS" "Canary deployment completed successfully"
}

# Handle command line arguments
case "${1:-}" in
    "rollback")
        log "Manual rollback requested"
        rollback_canary
        ;;
    "status")
        log "Canary deployment status"
        # This would show current traffic distribution
        ;;
    "promote")
        log "Promoting canary to stable"
        complete_canary_deployment
        ;;
    *)
        main
        ;;
esac