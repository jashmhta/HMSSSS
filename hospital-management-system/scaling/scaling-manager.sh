#!/bin/bash

# HMS Scaling Manager Script
# This script monitors system metrics and manages auto-scaling decisions

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/hms/scaling-manager.log"
METRICS_FILE="/tmp/scaling-metrics.json"

# Scaling configuration
MONITOR_INTERVAL="${MONITOR_INTERVAL:-30}"
SCALE_UP_COOLDOWN="${SCALE_UP_COOLDOWN:-300}"
SCALE_DOWN_COOLDOWN="${SCALE_DOWN_COOLDOWN:-600}"

# Service configurations
declare -A SERVICES=(
    ["backend"]="2:10"
    ["frontend"]="2:5"
    ["postgres"]="1:3"
)

# Cooldown tracking
declare -A LAST_SCALE_UP
declare -A LAST_SCALE_DOWN

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Get current metrics from Prometheus
get_metrics() {
    local service="$1"
    local metric_type="$2"

    case "$metric_type" in
        "cpu")
            # Get CPU usage percentage
            curl -s "http://prometheus:9090/api/v1/query?query=100%20-%20(avg%20by(instance)%20(irate(node_cpu_seconds_total%7Bmode%3D%22idle%22%7D%5B5m%5D))%20*%20100)" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo "0"
            ;;
        "memory")
            # Get memory usage percentage
            curl -s "http://prometheus:9090/api/v1/query?query=(1%20-%20node_memory_MemAvailable_bytes%20/%20node_memory_MemTotal_bytes)%20*%20100" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo "0"
            ;;
        "requests")
            # Get requests per second for backend
            if [ "$service" = "backend" ]; then
                curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total%7Bjob%3D%22hms-backend%22%7D%5B5m%5D)" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo "0"
            else
                echo "0"
            fi
            ;;
        "connections")
            # Get active connections
            if [ "$service" = "backend" ]; then
                curl -s "http://prometheus:9090/api/v1/query?query=pg_stat_activity_count%7Bdatname%3D%22hms_db%22%7D" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo "0"
            else
                echo "0"
            fi
            ;;
        *)
            echo "0"
            ;;
    esac
}

# Get current replica count
get_current_replicas() {
    local service="$1"

    docker service ls --format "{{.Name}}:{{.Replicas}}" | grep "^${service}$" | cut -d: -f2 | cut -d/ -f1 2>/dev/null || echo "1"
}

# Scale service
scale_service() {
    local service="$1"
    local new_replicas="$2"
    local reason="$3"

    log "Scaling $service to $new_replicas replicas (reason: $reason)"

    # Update docker service replicas
    if docker service scale "${service}=${new_replicas}"; then
        log "Successfully scaled $service to $new_replicas replicas"

        # Send notification
        send_scaling_notification "$service" "$new_replicas" "$reason" "success"

        # Update cooldown
        if [ "$new_replicas" -gt "$(get_current_replicas "$service")" ]; then
            LAST_SCALE_UP["$service"]=$(date +%s)
        else
            LAST_SCALE_DOWN["$service"]=$(date +%s)
        fi

        return 0
    else
        log "Failed to scale $service"
        send_scaling_notification "$service" "$new_replicas" "scaling failed" "error"
        return 1
    fi
}

# Check if service can scale up
can_scale_up() {
    local service="$1"
    local current_replicas="$2"
    local max_replicas="$3"

    # Check max replicas
    if [ "$current_replicas" -ge "$max_replicas" ]; then
        log "$service already at maximum replicas ($max_replicas)"
        return 1
    fi

    # Check cooldown
    local last_scale_up="${LAST_SCALE_UP[$service]}"
    if [ -n "$last_scale_up" ]; then
        local time_since_scale_up=$(( $(date +%s) - last_scale_up ))
        if [ "$time_since_scale_up" -lt "$SCALE_UP_COOLDOWN" ]; then
            log "$service in scale-up cooldown ($time_since_scale_up/$SCALE_UP_COOLDOWN seconds)"
            return 1
        fi
    fi

    return 0
}

# Check if service can scale down
can_scale_down() {
    local service="$1"
    local current_replicas="$2"
    local min_replicas="$3"

    # Check min replicas
    if [ "$current_replicas" -le "$min_replicas" ]; then
        log "$service already at minimum replicas ($min_replicas)"
        return 1
    fi

    # Check cooldown
    local last_scale_down="${LAST_SCALE_DOWN[$service]}"
    if [ -n "$last_scale_down" ]; then
        local time_since_scale_down=$(( $(date +%s) - last_scale_down ))
        if [ "$time_since_scale_down" -lt "$SCALE_DOWN_COOLDOWN" ]; then
            log "$service in scale-down cooldown ($time_since_scale_down/$SCALE_DOWN_COOLDOWN seconds)"
            return 1
        fi
    fi

    return 0
}

# Evaluate scaling decision for service
evaluate_scaling() {
    local service="$1"
    local min_replicas="$2"
    local max_replicas="$3"

    local current_replicas
    current_replicas=$(get_current_replicas "$service")

    log "Evaluating scaling for $service (current: $current_replicas, min: $min_replicas, max: $max_replicas)"

    # Get metrics
    local cpu_usage
    local memory_usage
    local requests_per_second
    local active_connections

    cpu_usage=$(get_metrics "$service" "cpu")
    memory_usage=$(get_metrics "$service" "memory")
    requests_per_second=$(get_metrics "$service" "requests")
    active_connections=$(get_metrics "$service" "connections")

    log "$service metrics - CPU: ${cpu_usage}%, Memory: ${memory_usage}%, RPS: ${requests_per_second}, Connections: ${active_connections}"

    # Scale up conditions
    local should_scale_up=false
    local scale_up_reason=""

    if [ "$(echo "$cpu_usage > 70" | bc -l)" -eq 1 ]; then
        should_scale_up=true
        scale_up_reason="high CPU usage (${cpu_usage}%)"
    elif [ "$(echo "$memory_usage > 80" | bc -l)" -eq 1 ]; then
        should_scale_up=true
        scale_up_reason="high memory usage (${memory_usage}%)"
    elif [ "$service" = "backend" ] && [ "$(echo "$requests_per_second > 100" | bc -l)" -eq 1 ]; then
        should_scale_up=true
        scale_up_reason="high request rate (${requests_per_second} RPS)"
    elif [ "$service" = "postgres" ] && [ "$active_connections" -gt 150 ]; then
        should_scale_up=true
        scale_up_reason="high connection count (${active_connections})"
    fi

    # Scale down conditions
    local should_scale_down=false
    local scale_down_reason=""

    if [ "$(echo "$cpu_usage < 30" | bc -l)" -eq 1 ] && [ "$(echo "$memory_usage < 40" | bc -l)" -eq 1 ]; then
        should_scale_down=true
        scale_down_reason="low resource usage (CPU: ${cpu_usage}%, Memory: ${memory_usage}%)"
    fi

    # Emergency scaling
    if [ "$(echo "$cpu_usage > 90" | bc -l)" -eq 1 ] || [ "$(echo "$memory_usage > 95" | bc -l)" -eq 1 ]; then
        log "EMERGENCY: $service experiencing critical resource usage"
        local emergency_replicas=$((current_replicas * 2))
        if [ "$emergency_replicas" -gt "$max_replicas" ]; then
            emergency_replicas=$max_replicas
        fi
        scale_service "$service" "$emergency_replicas" "emergency scaling due to critical resource usage"
        return
    fi

    # Execute scaling decisions
    if [ "$should_scale_up" = true ]; then
        if can_scale_up "$service" "$current_replicas" "$max_replicas"; then
            local new_replicas=$((current_replicas + 1))
            if [ "$new_replicas" -gt "$max_replicas" ]; then
                new_replicas=$max_replicas
            fi
            scale_service "$service" "$new_replicas" "$scale_up_reason"
        fi
    elif [ "$should_scale_down" = true ]; then
        if can_scale_down "$service" "$current_replicas" "$min_replicas"; then
            local new_replicas=$((current_replicas - 1))
            if [ "$new_replicas" -lt "$min_replicas" ]; then
                new_replicas=$min_replicas
            fi
            scale_service "$service" "$new_replicas" "$scale_down_reason"
        fi
    else
        log "$service scaling evaluation: no action needed"
    fi
}

# Send scaling notification
send_scaling_notification() {
    local service="$1"
    local replicas="$2"
    local reason="$3"
    local status="$4"

    log "Sending scaling notification: $service -> $replicas replicas ($reason) [$status]"

    # This could be extended to send emails, Slack notifications, etc.
}

# Main scaling manager function
main() {
    log "=== HMS Scaling Manager Started ==="

    # Initialize cooldown tracking
    for service in "${!SERVICES[@]}"; do
        LAST_SCALE_UP["$service"]=""
        LAST_SCALE_DOWN["$service"]=""
    done

    # Main monitoring loop
    while true; do
        log "Starting scaling evaluation cycle..."

        # Evaluate each service
        for service in "${!SERVICES[@]}"; do
            IFS=':' read -r min_replicas max_replicas <<< "${SERVICES[$service]}"
            evaluate_scaling "$service" "$min_replicas" "$max_replicas"
        done

        log "Scaling evaluation cycle completed. Sleeping for $MONITOR_INTERVAL seconds..."
        sleep "$MONITOR_INTERVAL"
    done
}

# Handle command line arguments
case "${1:-}" in
    "evaluate")
        # Run single evaluation cycle
        log "Running single scaling evaluation cycle..."
        for service in "${!SERVICES[@]}"; do
            IFS=':' read -r min_replicas max_replicas <<< "${SERVICES[$service]}"
            evaluate_scaling "$service" "$min_replicas" "$max_replicas"
        done
        ;;
    "scale-up")
        if [ -n "$2" ]; then
            local current_replicas
            current_replicas=$(get_current_replicas "$2")
            IFS=':' read -r min_replicas max_replicas <<< "${SERVICES[$2]}"
            local new_replicas=$((current_replicas + 1))
            if [ "$new_replicas" -le "$max_replicas" ]; then
                scale_service "$2" "$new_replicas" "manual scale-up"
            else
                log "Cannot scale up $2: already at maximum replicas ($max_replicas)"
            fi
        else
            log "Usage: $0 scale-up <service>"
        fi
        ;;
    "scale-down")
        if [ -n "$2" ]; then
            local current_replicas
            current_replicas=$(get_current_replicas "$2")
            IFS=':' read -r min_replicas max_replicas <<< "${SERVICES[$2]}"
            local new_replicas=$((current_replicas - 1))
            if [ "$new_replicas" -ge "$min_replicas" ]; then
                scale_service "$2" "$new_replicas" "manual scale-down"
            else
                log "Cannot scale down $2: already at minimum replicas ($min_replicas)"
            fi
        else
            log "Usage: $0 scale-down <service>"
        fi
        ;;
    "status")
        log "Current scaling status:"
        for service in "${!SERVICES[@]}"; do
            local current_replicas
            current_replicas=$(get_current_replicas "$service")
            IFS=':' read -r min_replicas max_replicas <<< "${SERVICES[$service]}"
            log "  $service: $current_replicas replicas (min: $min_replicas, max: $max_replicas)"
        done
        ;;
    *)
        main
        ;;
esac