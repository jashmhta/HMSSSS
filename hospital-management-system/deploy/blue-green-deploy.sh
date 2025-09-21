#!/bin/bash

# HMS Blue-Green Deployment Script
# This script implements zero-downtime deployment using blue-green strategy

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
LOG_FILE="/var/log/hms/blue-green-deploy.log"

# Deployment configuration
BLUE_STACK="hms-blue"
GREEN_STACK="hms-green"
ACTIVE_STACK_FILE="/tmp/hms-active-stack"

# Health check configuration
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3000/health}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"

# Traffic switching configuration
LOAD_BALANCER="${LOAD_BALANCER:-nginx}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    # Attempt rollback on error
    rollback_deployment
    exit 1
}

# Determine active and inactive stacks
get_stacks() {
    if [ -f "$ACTIVE_STACK_FILE" ]; then
        ACTIVE_STACK=$(cat "$ACTIVE_STACK_FILE")
    else
        ACTIVE_STACK="$BLUE_STACK"
    fi

    if [ "$ACTIVE_STACK" = "$BLUE_STACK" ]; then
        INACTIVE_STACK="$GREEN_STACK"
    else
        INACTIVE_STACK="$BLUE_STACK"
    fi
}

# Check if stack is healthy
check_stack_health() {
    local stack_name="$1"
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / HEALTH_CHECK_INTERVAL))
    local attempt=1

    log "Checking health of $stack_name stack..."

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
            log "$stack_name stack is healthy"
            return 0
        fi

        log "Attempt $attempt/$max_attempts: $stack_name stack not healthy yet..."
        sleep "$HEALTH_CHECK_INTERVAL"
        ((attempt++))
    done

    log "$stack_name stack failed health check"
    return 1
}

# Deploy to inactive stack
deploy_to_inactive() {
    local inactive_stack="$1"

    log "Deploying to $inactive_stack stack..."

    # Pull latest images
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" -p "$inactive_stack" pull

    # Start the inactive stack
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" -p "$inactive_stack" up -d

    # Wait for health check
    if ! check_stack_health "$inactive_stack"; then
        error_exit "Deployment to $inactive_stack failed health check"
    fi

    log "Successfully deployed to $inactive_stack stack"
}

# Switch traffic to new stack
switch_traffic() {
    local new_stack="$1"

    log "Switching traffic to $new_stack stack..."

    # Update load balancer configuration
    case "$LOAD_BALANCER" in
        "nginx")
            switch_nginx_traffic "$new_stack"
            ;;
        "haproxy")
            switch_haproxy_traffic "$new_stack"
            ;;
        *)
            error_exit "Unsupported load balancer: $LOAD_BALANCER"
            ;;
    esac

    # Update active stack file
    echo "$new_stack" > "$ACTIVE_STACK_FILE"

    log "Traffic successfully switched to $new_stack stack"
}

# Switch traffic using Nginx
switch_nginx_traffic() {
    local new_stack="$1"

    # This would update nginx upstream configuration
    # For demonstration, we'll use a simple approach
    log "Updating Nginx configuration for $new_stack..."

    # In a real scenario, you might:
    # 1. Update nginx configuration file
    # 2. Test configuration
    # 3. Reload nginx

    # For this demo, we'll simulate the switch
    sleep 5
    log "Nginx traffic switch completed"
}

# Switch traffic using HAProxy
switch_haproxy_traffic() {
    local new_stack="$1"

    log "Updating HAProxy configuration for $new_stack..."

    # This would update HAProxy backend configuration
    # For demonstration purposes
    sleep 5
    log "HAProxy traffic switch completed"
}

# Stop old stack
stop_old_stack() {
    local old_stack="$1"

    log "Stopping $old_stack stack..."

    # Stop the old stack
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" -p "$old_stack" down

    log "$old_stack stack stopped"
}

# Rollback deployment
rollback_deployment() {
    log "Rolling back deployment..."

    get_stacks

    # Switch traffic back to active stack
    switch_traffic "$ACTIVE_STACK"

    # Stop the failed stack
    stop_old_stack "$INACTIVE_STACK"

    log "Deployment rollback completed"
}

# Validate deployment
validate_deployment() {
    local new_stack="$1"

    log "Validating deployment of $new_stack..."

    # Run smoke tests
    if ! curl -f -s "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
        error_exit "Smoke test failed for $new_stack"
    fi

    # Check application logs for errors
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" -p "$new_stack" logs --tail=100 | grep -i error; then
        log "WARNING: Errors found in $new_stack logs"
    fi

    # Check database connectivity
    if ! docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" -p "$new_stack" exec -T backend curl -f http://postgres:5432 >/dev/null 2>&1; then
        log "WARNING: Database connectivity issue detected"
    fi

    log "Deployment validation completed"
}

# Monitor deployment
monitor_deployment() {
    local new_stack="$1"
    local monitor_duration="${MONITOR_DURATION:-300}"

    log "Monitoring $new_stack deployment for $monitor_duration seconds..."

    local end_time=$(( $(date +%s) + monitor_duration ))

    while [ $(date +%s) -lt $end_time ]; do
        # Check health
        if ! curl -f -s "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
            log "WARNING: Health check failed during monitoring"
        fi

        # Check error rates
        local error_count
        error_count=$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" -p "$new_stack" logs --tail=1000 | grep -c "ERROR" || true)

        if [ "$error_count" -gt 10 ]; then
            log "WARNING: High error count detected: $error_count"
        fi

        sleep 60
    done

    log "Deployment monitoring completed"
}

# Send deployment notification
send_deployment_notification() {
    local status="$1"
    local message="$2"

    log "Sending deployment notification: $status - $message"

    # This could be extended to send emails, Slack notifications, etc.
}

# Main deployment function
main() {
    log "=== HMS Blue-Green Deployment Started ==="

    # Trap for cleanup on error
    trap 'error_exit "Deployment script interrupted"' INT TERM

    get_stacks

    log "Active stack: $ACTIVE_STACK"
    log "Inactive stack: $INACTIVE_STACK"

    # Deploy to inactive stack
    deploy_to_inactive "$INACTIVE_STACK"

    # Validate deployment
    validate_deployment "$INACTIVE_STACK"

    # Switch traffic
    switch_traffic "$INACTIVE_STACK"

    # Monitor for a period
    monitor_deployment "$INACTIVE_STACK"

    # Stop old stack
    stop_old_stack "$ACTIVE_STACK"

    log "=== HMS Blue-Green Deployment Completed Successfully ==="
    send_deployment_notification "SUCCESS" "Blue-green deployment completed successfully"
}

# Handle command line arguments
case "${1:-}" in
    "rollback")
        log "Manual rollback requested"
        rollback_deployment
        ;;
    "status")
        get_stacks
        log "Active stack: $ACTIVE_STACK"
        log "Inactive stack: $INACTIVE_STACK"
        ;;
    "switch")
        if [ -n "$2" ]; then
            switch_traffic "$2"
        else
            log "Usage: $0 switch <stack-name>"
        fi
        ;;
    *)
        main
        ;;
esac