#!/bin/bash

# HMS Deployment Health Check Script
# This script validates deployment health and monitors for post-deployment issues

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
LOG_FILE="/var/log/hms/deploy-health-check.log"

# Health check configuration
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3000/health}"
API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

# Performance thresholds
RESPONSE_TIME_THRESHOLD="${RESPONSE_TIME_THRESHOLD:-2000}"
ERROR_RATE_THRESHOLD="${ERROR_RATE_THRESHOLD:-5}"
CPU_THRESHOLD="${CPU_THRESHOLD:-80}"
MEMORY_THRESHOLD="${MEMORY_THRESHOLD:-85}"

# Monitoring duration
MONITOR_DURATION="${MONITOR_DURATION:-600}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check application health
check_application_health() {
    log "Checking application health..."

    # Health endpoint check
    if ! curl -f -s "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
        error_exit "Health check endpoint failed"
    fi

    log "Health check passed"

    # API endpoints check
    local api_endpoints=(
        "/patients?limit=1"
        "/appointments?limit=1"
        "/laboratory/tests?limit=1"
        "/radiology/exams?limit=1"
    )

    for endpoint in "${api_endpoints[@]}"; do
        if ! curl -f -s "${API_BASE_URL}${endpoint}" >/dev/null 2>&1; then
            log "WARNING: API endpoint ${endpoint} failed"
        else
            log "API endpoint ${endpoint} OK"
        fi
    done
}

# Check frontend health
check_frontend_health() {
    log "Checking frontend health..."

    # Frontend availability check
    if ! curl -f -s "$FRONTEND_URL" >/dev/null 2>&1; then
        error_exit "Frontend is not accessible"
    fi

    log "Frontend is accessible"

    # Check for JavaScript errors (basic check)
    local js_error_count
    js_error_count=$(curl -s "$FRONTEND_URL" | grep -c "console.error\|Uncaught" || true)

    if [ "$js_error_count" -gt 0 ]; then
        log "WARNING: Potential JavaScript errors detected in frontend"
    fi
}

# Check database connectivity
check_database_connectivity() {
    log "Checking database connectivity..."

    # This would check database connectivity from the application
    # For demonstration, we'll check if the database container is running
    if ! docker ps | grep -q postgres; then
        error_exit "Database container is not running"
    fi

    log "Database container is running"

    # Check if application can connect to database
    if ! docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T backend curl -f http://postgres:5432 >/dev/null 2>&1; then
        log "WARNING: Application cannot connect to database"
    fi
}

# Check cache connectivity
check_cache_connectivity() {
    log "Checking cache connectivity..."

    if ! docker ps | grep -q redis; then
        error_exit "Redis container is not running"
    fi

    log "Redis container is running"
}

# Performance validation
validate_performance() {
    log "Validating performance..."

    local total_requests=0
    local failed_requests=0
    local total_response_time=0

    # Run performance tests
    for i in {1..10}; do
        local start_time
        start_time=$(date +%s%N)

        if curl -f -s -w "%{http_code}" "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
            ((total_requests++))
        else
            ((failed_requests++))
        fi

        local end_time
        end_time=$(date +%s%N)
        local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds

        total_response_time=$((total_response_time + response_time))

        sleep 1
    done

    # Calculate metrics
    local success_rate=$(( (total_requests * 100) / (total_requests + failed_requests) ))
    local avg_response_time=$((total_response_time / total_requests))

    log "Performance Results:"
    log "  Total Requests: $((total_requests + failed_requests))"
    log "  Success Rate: ${success_rate}%"
    log "  Average Response Time: ${avg_response_time}ms"

    # Check thresholds
    if [ "$success_rate" -lt 95 ]; then
        error_exit "Success rate too low: ${success_rate}%"
    fi

    if [ "$avg_response_time" -gt "$RESPONSE_TIME_THRESHOLD" ]; then
        error_exit "Average response time too high: ${avg_response_time}ms"
    fi
}

# Check system resources
check_system_resources() {
    log "Checking system resources..."

    # Check container resource usage
    log "Container Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemPerc}}" | while read -r line; do
        log "  $line"
    done

    # Check for high resource usage
    local high_cpu_containers
    high_cpu_containers=$(docker stats --no-stream --format "{{.Container}} {{.CPUPerc}}" | awk -v threshold="$CPU_THRESHOLD" '$2 > threshold {print $1}')

    if [ -n "$high_cpu_containers" ]; then
        log "WARNING: High CPU usage detected in: $high_cpu_containers"
    fi

    local high_mem_containers
    high_mem_containers=$(docker stats --no-stream --format "{{.Container}} {{.MemPerc}}" | sed 's/%//' | awk -v threshold="$MEMORY_THRESHOLD" '$2 > threshold {print $1}')

    if [ -n "$high_mem_containers" ]; then
        log "WARNING: High memory usage detected in: $high_mem_containers"
    fi
}

# Check logs for errors
check_logs_for_errors() {
    log "Checking logs for errors..."

    local error_patterns=(
        "ERROR"
        "Exception"
        "Failed"
        "Timeout"
        "Connection refused"
    )

    for pattern in "${error_patterns[@]}"; do
        local error_count
        error_count=$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" logs --tail=1000 | grep -c "$pattern" || true)

        if [ "$error_count" -gt 0 ]; then
            log "Found $error_count occurrences of '$pattern' in logs"
        fi
    done
}

# Monitor deployment
monitor_deployment() {
    local monitor_duration="$1"

    log "Monitoring deployment for $monitor_duration seconds..."

    local end_time=$(( $(date +%s) + monitor_duration ))
    local error_count=0

    while [ $(date +%s) -lt $end_time ]; do
        # Continuous health checks
        if ! curl -f -s "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
            ((error_count++))
            log "WARNING: Health check failed"
        fi

        # Check system resources periodically
        if [ $(( $(date +%s) % 60 )) -eq 0 ]; then
            check_system_resources
        fi

        sleep 10
    done

    # Calculate error rate
    local total_checks=$((monitor_duration / 10))
    local error_rate=$(( (error_count * 100) / total_checks ))

    log "Monitoring completed. Error rate: ${error_rate}%"

    if [ "$error_rate" -gt "$ERROR_RATE_THRESHOLD" ]; then
        error_exit "High error rate during monitoring: ${error_rate}%"
    fi
}

# Generate health report
generate_health_report() {
    log "Generating deployment health report..."

    local report_file="/tmp/deploy-health-report-$(date +%Y%m%d_%H%M%S).txt"

    {
        echo "HMS Deployment Health Report"
        echo "============================"
        echo "Timestamp: $(date)"
        echo "Environment: Production"
        echo ""

        echo "Application Health:"
        echo "  Health Check: $(curl -f -s "$HEALTH_CHECK_URL" >/dev/null 2>&1 && echo 'PASS' || echo 'FAIL')"
        echo "  Frontend: $(curl -f -s "$FRONTEND_URL" >/dev/null 2>&1 && echo 'PASS' || echo 'FAIL')"
        echo ""

        echo "System Resources:"
        docker stats --no-stream --format "  {{.Container}}: CPU {{.CPUPerc}}, Memory {{.MemPerc}}"
        echo ""

        echo "Recent Errors:"
        docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" logs --tail=20 | grep -i error || echo "  No recent errors"
        echo ""

    } > "$report_file"

    log "Health report generated: $report_file"
}

# Send notification
send_health_notification() {
    local status="$1"
    local message="$2"

    log "Sending health notification: $status - $message"

    # This could be extended to send emails, Slack notifications, etc.
}

# Main health check function
main() {
    log "=== HMS Deployment Health Check Started ==="

    # Run all checks
    check_application_health
    check_frontend_health
    check_database_connectivity
    check_cache_connectivity
    validate_performance
    check_system_resources
    check_logs_for_errors

    # Monitor for specified duration
    monitor_deployment "$MONITOR_DURATION"

    # Generate report
    generate_health_report

    log "=== HMS Deployment Health Check Completed Successfully ==="
    send_health_notification "SUCCESS" "Deployment health check passed"
}

# Handle command line arguments
case "${1:-}" in
    "quick")
        log "Running quick health check..."
        check_application_health
        check_frontend_health
        ;;
    "performance")
        validate_performance
        ;;
    "resources")
        check_system_resources
        ;;
    "monitor")
        monitor_deployment "${2:-300}"
        ;;
    "report")
        generate_health_report
        ;;
    *)
        main
        ;;
esac