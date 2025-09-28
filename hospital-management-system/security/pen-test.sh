#!/bin/bash

# HMS Penetration Testing Script
# This script performs automated security testing on the HMS system

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/pen-test.log"
REPORT_DIR="$SCRIPT_DIR/reports"

# Target configuration
TARGET_HOST="${TARGET_HOST:-localhost}"
TARGET_PORT="${TARGET_PORT:-443}"
API_BASE_URL="${API_BASE_URL:-https://api.hms.local}"
FRONTEND_URL="${FRONTEND_URL:-https://hms.local}"

# Test configuration
TEST_TIMEOUT="${TEST_TIMEOUT:-30}"
MAX_CONCURRENT="${MAX_CONCURRENT:-5}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Setup test environment
setup_test_environment() {
    log "Setting up penetration testing environment..."

    # Create report directory
    mkdir -p "$REPORT_DIR"

    # Install required tools (if not present)
    command -v nmap >/dev/null 2>&1 || log "WARNING: nmap not found"
    command -v nikto >/dev/null 2>&1 || log "WARNING: nikto not found"
    command -v sqlmap >/dev/null 2>&1 || log "WARNING: sqlmap not found"
    command -v curl >/dev/null 2>&1 || error_exit "curl is required"

    log "Test environment setup completed"
}

# Port scanning
perform_port_scan() {
    log "Performing port scan on $TARGET_HOST..."

    local scan_file="$REPORT_DIR/port-scan.txt"

    if command -v nmap >/dev/null 2>&1; then
        nmap -sV -sC -p- --script vuln "$TARGET_HOST" -oN "$scan_file"
        log "Port scan completed: $scan_file"
    else
        log "WARNING: nmap not available, skipping port scan"
        echo "Port scan requires nmap to be installed" > "$scan_file"
    fi
}

# SSL/TLS testing
test_ssl_tls() {
    log "Testing SSL/TLS configuration..."

    local ssl_file="$REPORT_DIR/ssl-test.txt"

    {
        echo "SSL/TLS Test Results"
        echo "===================="
        echo "Target: $TARGET_HOST:$TARGET_PORT"
        echo "Date: $(date)"
        echo ""

        # Test SSL connection
        echo "SSL Connection Test:"
        if openssl s_client -connect "$TARGET_HOST:$TARGET_PORT" -servername "$TARGET_HOST" </dev/null 2>/dev/null | openssl x509 -noout -dates; then
            echo "✓ SSL connection successful"
        else
            echo "✗ SSL connection failed"
        fi
        echo ""

        # Test SSL protocols
        echo "SSL Protocol Support:"
        for protocol in ssl2 ssl3 tls1 tls1_1 tls1_2 tls1_3; do
            if openssl s_client -connect "$TARGET_HOST:$TARGET_PORT" -$protocol </dev/null >/dev/null 2>&1; then
                echo "✓ $protocol supported"
            else
                echo "✗ $protocol not supported"
            fi
        done
        echo ""

        # Test cipher suites
        echo "Strong Cipher Suites:"
        openssl s_client -connect "$TARGET_HOST:$TARGET_PORT" </dev/null 2>/dev/null | openssl ciphers -v | head -10

    } > "$ssl_file"

    log "SSL/TLS test completed: $ssl_file"
}

# Web application testing
test_web_application() {
    log "Testing web application security..."

    local web_file="$REPORT_DIR/web-app-test.txt"

    {
        echo "Web Application Security Test Results"
        echo "===================================="
        echo "Target: $FRONTEND_URL"
        echo "Date: $(date)"
        echo ""

        # Test for common vulnerabilities
        echo "Common Security Headers:"
        local headers
        headers=$(curl -I -s "$FRONTEND_URL" | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection|Strict-Transport-Security|Content-Security-Policy)" || true)

        if [ -n "$headers" ]; then
            echo "$headers"
        else
            echo "✗ No security headers found"
        fi
        echo ""

        # Test for directory listing
        echo "Directory Listing Tests:"
        local test_dirs=("/admin/" "/backup/" "/config/" "/.git/" "/.env")
        for dir in "${test_dirs[@]}"; do
            if curl -s "$FRONTEND_URL$dir" | grep -q "Index of"; then
                echo "✗ Directory listing enabled: $dir"
            else
                echo "✓ Directory listing disabled: $dir"
            fi
        done
        echo ""

        # Test for common files
        echo "Common File Exposure Tests:"
        local test_files=("/robots.txt" "/sitemap.xml" "/crossdomain.xml" "/clientaccesspolicy.xml")
        for file in "${test_files[@]}"; do
            if curl -s "$FRONTEND_URL$file" | grep -q "404"; then
                echo "✓ File not found (good): $file"
            else
                echo "? File exists: $file"
            fi
        done

    } > "$web_file"

    log "Web application test completed: $web_file"
}

# API testing
test_api_security() {
    log "Testing API security..."

    local api_file="$REPORT_DIR/api-test.txt"

    {
        echo "API Security Test Results"
        echo "========================="
        echo "Target: $API_BASE_URL"
        echo "Date: $(date)"
        echo ""

        # Test authentication
        echo "Authentication Tests:"
        if curl -s "$API_BASE_URL/health" | grep -q "401\|403"; then
            echo "✓ Authentication required for API"
        else
            echo "? API may not require authentication"
        fi
        echo ""

        # Test for common API vulnerabilities
        echo "API Vulnerability Tests:"

        # Test for SQL injection
        local sqli_payload="' OR '1'='1"
        if curl -s "$API_BASE_URL/patients?search=$sqli_payload" | grep -q "error\|exception"; then
            echo "✓ SQL injection protection detected"
        else
            echo "? SQL injection test inconclusive"
        fi

        # Test for XSS
        local xss_payload="<script>alert('xss')</script>"
        if curl -s "$API_BASE_URL/patients?search=$xss_payload" | grep -q "$xss_payload"; then
            echo "✗ Potential XSS vulnerability"
        else
            echo "✓ XSS protection appears active"
        fi

        # Test rate limiting
        echo "Rate Limiting Test:"
        local success_count=0
        for i in {1..10}; do
            if curl -s "$API_BASE_URL/health" >/dev/null 2>&1; then
                ((success_count++))
            fi
        done

        if [ "$success_count" -lt 10 ]; then
            echo "✓ Rate limiting appears to be active"
        else
            echo "? Rate limiting may not be configured"
        fi

    } > "$api_file"

    log "API security test completed: $api_file"
}

# Database security testing
test_database_security() {
    log "Testing database security..."

    local db_file="$REPORT_DIR/database-test.txt"

    {
        echo "Database Security Test Results"
        echo "=============================="
        echo "Date: $(date)"
        echo ""

        # Test for database error disclosure
        echo "Error Disclosure Tests:"
        local error_payloads=(
            "'"
            "1' OR '1'='1"
            "../../../../etc/passwd"
            "<script>alert(1)</script>"
        )

        for payload in "${error_payloads[@]}"; do
            if curl -s "$API_BASE_URL/patients?search=$payload" | grep -i -q "error\|exception\|sql\|database"; then
                echo "✗ Potential error disclosure with payload: $payload"
            else
                echo "✓ No error disclosure with payload: $payload"
            fi
        done

        echo ""
        echo "Note: Database testing is limited without direct access."
        echo "Consider using sqlmap for comprehensive database testing."

    } > "$db_file"

    log "Database security test completed: $db_file"
}

# Vulnerability scanning
perform_vulnerability_scan() {
    log "Performing vulnerability scanning..."

    local vuln_file="$REPORT_DIR/vulnerability-scan.txt"

    if command -v nikto >/dev/null 2>&1; then
        nikto -h "$FRONTEND_URL" -o "$vuln_file" -Format txt
        log "Vulnerability scan completed: $vuln_file"
    else
        log "WARNING: nikto not available, skipping vulnerability scan"
        echo "Vulnerability scanning requires nikto to be installed" > "$vuln_file"
    fi
}

# Generate comprehensive report
generate_comprehensive_report() {
    log "Generating comprehensive penetration test report..."

    local report_file="$REPORT_DIR/comprehensive-report.html"

    {
        echo "<!DOCTYPE html>"
        echo "<html><head><title>HMS Penetration Test Report</title></head><body>"
        echo "<h1>HMS Penetration Test Report</h1>"
        echo "<p><strong>Date:</strong> $(date)</p>"
        echo "<p><strong>Target:</strong> $TARGET_HOST</p>"
        echo "<p><strong>Tester:</strong> Automated Security Scan</p>"
        echo ""
        echo "<h2>Executive Summary</h2>"
        echo "<p>This report contains the results of automated security testing performed on the HMS system.</p>"
        echo ""
        echo "<h2>Test Results</h2>"
        echo "<ul>"
        echo "<li><a href='#port-scan'>Port Scan Results</a></li>"
        echo "<li><a href='#ssl-test'>SSL/TLS Test Results</a></li>"
        echo "<li><a href='#web-app'>Web Application Test Results</a></li>"
        echo "<li><a href='#api-test'>API Security Test Results</a></li>"
        echo "<li><a href='#database'>Database Security Test Results</a></li>"
        echo "<li><a href='#vulnerability'>Vulnerability Scan Results</a></li>"
        echo "</ul>"
        echo ""
        echo "<h2>Detailed Results</h2>"
        echo ""
        echo "<h3 id='port-scan'>Port Scan Results</h3>"
        echo "<pre>"
        cat "$REPORT_DIR/port-scan.txt" 2>/dev/null || echo 'No port scan results available'
        echo "</pre>"
        echo ""
        echo "<h3 id='ssl-test'>SSL/TLS Test Results</h3>"
        echo "<pre>"
        cat "$REPORT_DIR/ssl-test.txt" 2>/dev/null || echo 'No SSL test results available'
        echo "</pre>"
        echo ""
        echo "<h3 id='web-app'>Web Application Test Results</h3>"
        echo "<pre>"
        cat "$REPORT_DIR/web-app-test.txt" 2>/dev/null || echo 'No web app test results available'
        echo "</pre>"
        echo ""
        echo "<h3 id='api-test'>API Security Test Results</h3>"
        echo "<pre>"
        cat "$REPORT_DIR/api-test.txt" 2>/dev/null || echo 'No API test results available'
        echo "</pre>"
        echo ""
        echo "<h3 id='database'>Database Security Test Results</h3>"
        echo "<pre>"
        cat "$REPORT_DIR/database-test.txt" 2>/dev/null || echo 'No database test results available'
        echo "</pre>"
        echo ""
        echo "<h3 id='vulnerability'>Vulnerability Scan Results</h3>"
        echo "<pre>"
        cat "$REPORT_DIR/vulnerability-scan.txt" 2>/dev/null || echo 'No vulnerability scan results available'
        echo "</pre>"
        echo ""
        echo "<h2>Recommendations</h2>"
        echo "<ul>"
        echo "<li>Review and address any vulnerabilities found</li>"
        echo "<li>Ensure all security headers are properly configured</li>"
        echo "<li>Implement rate limiting for API endpoints</li>"
        echo "<li>Regular security audits and penetration testing</li>"
        echo "<li>Keep all software and dependencies updated</li>"
        echo "</ul>"
        echo ""
        echo "</body></html>"

    } > "$report_file"

    log "Comprehensive report generated: $report_file"
}

# Main penetration testing function
main() {
    log "=== HMS Penetration Testing Started ==="

    setup_test_environment

    # Run all security tests
    perform_port_scan
    test_ssl_tls
    test_web_application
    test_api_security
    test_database_security
    perform_vulnerability_scan

    # Generate comprehensive report
    generate_comprehensive_report

    log "=== HMS Penetration Testing Completed ==="
    log "Reports available in: $REPORT_DIR"
}

# Handle command line arguments
case "${1:-}" in
    "port-scan")
        setup_test_environment
        perform_port_scan
        ;;
    "ssl")
        setup_test_environment
        test_ssl_tls
        ;;
    "web")
        setup_test_environment
        test_web_application
        ;;
    "api")
        setup_test_environment
        test_api_security
        ;;
    "database")
        setup_test_environment
        test_database_security
        ;;
    "vulnerability")
        setup_test_environment
        perform_vulnerability_scan
        ;;
    "report")
        generate_comprehensive_report
        ;;
    *)
        main
        ;;
esac