#!/bin/bash

# HMS Compliance Auditing Script
# This script audits the system against various compliance standards

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/compliance-audit.log"
REPORT_DIR="$SCRIPT_DIR/reports"

# Compliance standards to check
CHECK_HIPAA="${CHECK_HIPAA:-true}"
CHECK_GDPR="${CHECK_GDPR:-true}"
CHECK_SOC2="${CHECK_SOC2:-true}"
CHECK_PCI_DSS="${CHECK_PCI_DSS:-false}"

# System configuration
DB_NAME="${POSTGRES_DB:-hms_db}"
DB_USER="${POSTGRES_USER:-hms_app}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Setup audit environment
setup_audit_environment() {
    log "Setting up compliance audit environment..."

    mkdir -p "$REPORT_DIR"
    mkdir -p "$REPORT_DIR/hipaa" "$REPORT_DIR/gdpr" "$REPORT_DIR/soc2" "$REPORT_DIR/pci"

    log "Audit environment setup completed"
}

# HIPAA Compliance Audit
audit_hipaa_compliance() {
    if [ "$CHECK_HIPAA" != "true" ]; then
        log "Skipping HIPAA compliance audit"
        return 0
    fi

    log "Auditing HIPAA compliance..."

    local hipaa_file="$REPORT_DIR/hipaa/audit-results.txt"

    {
        echo "HIPAA Compliance Audit Report"
        echo "=============================="
        echo "Date: $(date)"
        echo ""

        # Security Rule Compliance
        echo "1. Security Management Process"
        echo "   1.1 Risk Analysis"
        check_file_exists "/var/log/hms/security-audit.log" "Security audit log exists"
        check_file_exists "$SCRIPT_DIR/harden.sh" "Security hardening script exists"
        echo ""

        echo "   1.2 Risk Management"
        check_service_running "fail2ban" "Intrusion prevention system"
        check_firewall_rules "Firewall rules configured"
        echo ""

        echo "   1.3 Sanction Policy"
        check_file_contains "/etc/security/access.conf" "Security access policies configured"
        echo ""

        echo "2. Assigned Security Responsibility"
        check_file_exists "/etc/security/staff-responsibilities.txt" "Security responsibilities documented"
        echo ""

        echo "3. Information Access Management"
        check_database_rls "patients" "Row Level Security on patients table"
        check_database_rls "medical_records" "Row Level Security on medical records"
        echo ""

        echo "4. Security Awareness and Training"
        check_file_exists "/var/log/hms/training-records.log" "Security training records"
        echo ""

        echo "5. Security Incident Procedures"
        check_file_exists "/etc/security/incident-response-plan.txt" "Incident response plan"
        check_file_exists "/var/log/hms/incidents.log" "Incident log"
        echo ""

        echo "6. Contingency Plan"
        check_file_exists "$SCRIPT_DIR/../database/backup-strategy.sh" "Backup strategy exists"
        check_file_exists "$SCRIPT_DIR/../deploy/blue-green-deploy.sh" "Disaster recovery plan"
        echo ""

        echo "7. Evaluation"
        check_file_exists "/var/log/hms/annual-security-review.log" "Annual security review"
        echo ""

        # Privacy Rule Compliance
        echo "Privacy Rule Compliance:"
        echo "   - Notice of Privacy Practices"
        check_file_exists "/var/www/hms/privacy-notice.html" "Privacy notice published"
        echo ""

        echo "   - Individual Rights"
        check_api_endpoint "/api/patients/data-access" "Data access request endpoint"
        echo ""

        echo "   - Administrative Requirements"
        check_file_exists "/var/log/hms/privacy-audit.log" "Privacy audit log"
        echo ""

        # Breach Notification Rule
        echo "Breach Notification:"
        check_file_exists "/etc/security/breach-notification-plan.txt" "Breach notification plan"
        check_file_exists "/var/log/hms/breach-log.log" "Breach log"
        echo ""

    } > "$hipaa_file"

    log "HIPAA compliance audit completed: $hipaa_file"
}

# GDPR Compliance Audit
audit_gdpr_compliance() {
    if [ "$CHECK_GDPR" != "true" ]; then
        log "Skipping GDPR compliance audit"
        return 0
    fi

    log "Auditing GDPR compliance..."

    local gdpr_file="$REPORT_DIR/gdpr/audit-results.txt"

    {
        echo "GDPR Compliance Audit Report"
        echo "============================="
        echo "Date: $(date)"
        echo ""

        echo "1. Lawfulness, Fairness, and Transparency"
        check_file_exists "/var/www/hms/privacy-policy.html" "Privacy policy published"
        check_file_exists "/var/www/hms/cookie-policy.html" "Cookie policy published"
        echo ""

        echo "2. Purpose Limitation"
        check_file_exists "/var/log/hms/data-processing-purposes.log" "Data processing purposes documented"
        echo ""

        echo "3. Data Minimization"
        check_database_field_encryption "patients.ssn" "Sensitive data encrypted"
        check_database_field_encryption "patients.medical_record_number" "Medical data encrypted"
        echo ""

        echo "4. Accuracy"
        check_api_endpoint "/api/patients/verify-data" "Data accuracy verification endpoint"
        echo ""

        echo "5. Storage Limitation"
        check_file_exists "/etc/security/data-retention-policy.txt" "Data retention policy"
        check_database_cleanup_procedures "Data cleanup procedures"
        echo ""

        echo "6. Integrity and Confidentiality"
        check_ssl_configuration "SSL/TLS properly configured"
        check_encryption_at_rest "Data encryption at rest"
        echo ""

        echo "7. Accountability"
        check_file_exists "/var/log/hms/data-processing-register.log" "Data processing register"
        check_file_exists "/var/log/hms/dpia-assessments.log" "Data Protection Impact Assessments"
        echo ""

        echo "8. Data Subject Rights"
        check_api_endpoint "/api/gdpr/data-portability" "Data portability endpoint"
        check_api_endpoint "/api/gdpr/right-to-erasure" "Right to erasure endpoint"
        check_api_endpoint "/api/gdpr/data-rectification" "Data rectification endpoint"
        echo ""

        echo "9. Data Breach Notification"
        check_file_exists "/etc/security/gdpr-breach-notification.txt" "GDPR breach notification procedure"
        check_file_exists "/var/log/hms/gdpr-breaches.log" "GDPR breach log"
        echo ""

        echo "10. Data Protection Officer"
        check_file_exists "/etc/security/dpo-contact.txt" "Data Protection Officer contact information"
        echo ""

    } > "$gdpr_file"

    log "GDPR compliance audit completed: $gdpr_file"
}

# SOC 2 Compliance Audit
audit_soc2_compliance() {
    if [ "$CHECK_SOC2" != "true" ]; then
        log "Skipping SOC 2 compliance audit"
        return 0
    fi

    log "Auditing SOC 2 compliance..."

    local soc2_file="$REPORT_DIR/soc2/audit-results.txt"

    {
        echo "SOC 2 Compliance Audit Report"
        echo "=============================="
        echo "Date: $(date)"
        echo ""

        echo "Trust Services Criteria:"
        echo ""

        echo "1. Security"
        check_access_controls "Access controls implemented"
        check_encryption_in_transit "Data encrypted in transit"
        check_encryption_at_rest "Data encrypted at rest"
        check_firewall_configuration "Firewall properly configured"
        echo ""

        echo "2. Availability"
        check_backup_procedures "Backup procedures in place"
        check_disaster_recovery "Disaster recovery plan"
        check_monitoring_systems "Monitoring systems operational"
        echo ""

        echo "3. Processing Integrity"
        check_data_processing_accuracy "Data processing accuracy controls"
        check_quality_assurance "Quality assurance procedures"
        echo ""

        echo "4. Confidentiality"
        check_data_classification "Data classification policy"
        check_information_handling "Information handling procedures"
        echo ""

        echo "5. Privacy"
        check_privacy_policy "Privacy policy implemented"
        check_consent_management "Consent management system"
        check_data_subject_rights "Data subject rights procedures"
        echo ""

        echo "Additional SOC 2 Requirements:"
        check_risk_assessment "Risk assessment procedures"
        check_change_management "Change management process"
        check_incident_response "Incident response procedures"
        check_vendor_management "Vendor management procedures"
        echo ""

    } > "$soc2_file"

    log "SOC 2 compliance audit completed: $soc2_file"
}

# PCI DSS Compliance Audit
audit_pci_dss_compliance() {
    if [ "$CHECK_PCI_DSS" != "true" ]; then
        log "Skipping PCI DSS compliance audit"
        return 0
    fi

    log "Auditing PCI DSS compliance..."

    local pci_file="$REPORT_DIR/pci/audit-results.txt"

    {
        echo "PCI DSS Compliance Audit Report"
        echo "==============================="
        echo "Date: $(date)"
        echo ""

        echo "PCI DSS Requirements:"
        echo ""

        echo "Requirement 1: Install and maintain network security controls"
        check_firewall_configuration "Firewall configuration"
        check_network_segmentation "Network segmentation"
        echo ""

        echo "Requirement 2: Apply secure configurations to all system components"
        check_secure_configuration "Secure system configuration"
        check_software_inventory "Software inventory management"
        echo ""

        echo "Requirement 3: Protect stored account data"
        check_encryption_at_rest "Data encryption at rest"
        check_key_management "Cryptographic key management"
        echo ""

        echo "Requirement 4: Protect cardholder data with strong cryptography during transmission"
        check_ssl_configuration "SSL/TLS configuration"
        check_encryption_in_transit "Data encrypted in transit"
        echo ""

        echo "Requirement 5: Protect all systems and networks from malicious software"
        check_antivirus "Antivirus software"
        check_malware_protection "Malware protection"
        echo ""

        echo "Requirement 6: Develop and maintain secure systems and applications"
        check_secure_development "Secure development practices"
        check_vulnerability_management "Vulnerability management"
        echo ""

        echo "Requirement 7: Restrict access to system components and cardholder data"
        check_access_controls "Access control systems"
        check_least_privilege "Principle of least privilege"
        echo ""

        echo "Requirement 8: Identify users and authenticate access to system components"
        check_user_authentication "User authentication"
        check_password_policies "Password policies"
        echo ""

        echo "Requirement 9: Restrict physical access to cardholder data"
        check_physical_security "Physical security controls"
        echo ""

        echo "Requirement 10: Log and monitor all access to system components and cardholder data"
        check_audit_logging "Audit logging"
        check_log_monitoring "Log monitoring"
        echo ""

        echo "Requirement 11: Test security of systems and networks regularly"
        check_penetration_testing "Penetration testing"
        check_vulnerability_scanning "Vulnerability scanning"
        echo ""

        echo "Requirement 12: Support information security with organizational policies and programs"
        check_security_policy "Information security policy"
        check_incident_response "Incident response plan"
        echo ""

    } > "$pci_file"

    log "PCI DSS compliance audit completed: $pci_file"
}

# Helper functions for compliance checks
check_file_exists() {
    local file="$1"
    local description="$2"

    if [ -f "$file" ]; then
        echo "✓ $description"
    else
        echo "✗ $description - FILE NOT FOUND: $file"
    fi
}

check_file_contains() {
    local file="$1"
    local description="$2"

    if [ -f "$file" ] && [ -s "$file" ]; then
        echo "✓ $description"
    else
        echo "✗ $description - FILE MISSING OR EMPTY: $file"
    fi
}

check_service_running() {
    local service="$1"
    local description="$2"

    if systemctl is-active --quiet "$service" 2>/dev/null || service "$service" status >/dev/null 2>&1; then
        echo "✓ $description"
    else
        echo "? $description - SERVICE STATUS UNKNOWN"
    fi
}

check_firewall_rules() {
    local description="$1"

    if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
        echo "✓ $description (UFW)"
    elif command -v firewall-cmd >/dev/null 2>&1 && firewall-cmd --state >/dev/null 2>&1; then
        echo "✓ $description (firewalld)"
    elif iptables -L >/dev/null 2>&1; then
        echo "✓ $description (iptables)"
    else
        echo "? $description - FIREWALL STATUS UNKNOWN"
    fi
}

check_database_rls() {
    local table="$1"
    local description="$2"

    # This would check if Row Level Security is enabled on the table
    echo "? $description - MANUAL VERIFICATION REQUIRED"
}

check_api_endpoint() {
    local endpoint="$1"
    local description="$2"

    if curl -s "http://localhost:3000$endpoint" >/dev/null 2>&1; then
        echo "✓ $description"
    else
        echo "✗ $description - ENDPOINT NOT ACCESSIBLE"
    fi
}

check_database_field_encryption() {
    local field="$1"
    local description="$2"

    # This would check if the database field is encrypted
    echo "? $description - MANUAL VERIFICATION REQUIRED"
}

check_ssl_configuration() {
    local description="$1"

    if openssl s_client -connect localhost:443 </dev/null >/dev/null 2>&1; then
        echo "✓ $description"
    else
        echo "✗ $description - SSL NOT CONFIGURED"
    fi
}

check_encryption_at_rest() {
    local description="$1"

    # Check if database encryption is enabled
    echo "? $description - MANUAL VERIFICATION REQUIRED"
}

check_encryption_in_transit() {
    local description="$1"

    if curl -I https://localhost/ 2>/dev/null | grep -q "Strict-Transport-Security"; then
        echo "✓ $description"
    else
        echo "✗ $description - HTTPS NOT PROPERLY CONFIGURED"
    fi
}

check_backup_procedures() {
    local description="$1"

    if [ -f "$SCRIPT_DIR/../database/backup-strategy.sh" ]; then
        echo "✓ $description"
    else
        echo "✗ $description - BACKUP PROCEDURES NOT FOUND"
    fi
}

check_disaster_recovery() {
    local description="$1"

    if [ -f "$SCRIPT_DIR/../deploy/blue-green-deploy.sh" ]; then
        echo "✓ $description"
    else
        echo "✗ $description - DISASTER RECOVERY PLAN NOT FOUND"
    fi
}

check_monitoring_systems() {
    local description="$1"

    if docker ps | grep -q prometheus && docker ps | grep -q grafana; then
        echo "✓ $description"
    else
        echo "✗ $description - MONITORING SYSTEMS NOT RUNNING"
    fi
}

# Additional helper functions for other compliance checks
check_access_controls() { echo "? Access controls - MANUAL VERIFICATION REQUIRED"; }
check_data_processing_accuracy() { echo "? Data processing accuracy - MANUAL VERIFICATION REQUIRED"; }
check_quality_assurance() { echo "? Quality assurance - MANUAL VERIFICATION REQUIRED"; }
check_data_classification() { echo "? Data classification - MANUAL VERIFICATION REQUIRED"; }
check_information_handling() { echo "? Information handling - MANUAL VERIFICATION REQUIRED"; }
check_privacy_policy() { echo "? Privacy policy - MANUAL VERIFICATION REQUIRED"; }
check_consent_management() { echo "? Consent management - MANUAL VERIFICATION REQUIRED"; }
check_data_subject_rights() { echo "? Data subject rights - MANUAL VERIFICATION REQUIRED"; }
check_risk_assessment() { echo "? Risk assessment - MANUAL VERIFICATION REQUIRED"; }
check_change_management() { echo "? Change management - MANUAL VERIFICATION REQUIRED"; }
check_incident_response() { echo "? Incident response - MANUAL VERIFICATION REQUIRED"; }
check_vendor_management() { echo "? Vendor management - MANUAL VERIFICATION REQUIRED"; }
check_secure_configuration() { echo "? Secure configuration - MANUAL VERIFICATION REQUIRED"; }
check_software_inventory() { echo "? Software inventory - MANUAL VERIFICATION REQUIRED"; }
check_key_management() { echo "? Key management - MANUAL VERIFICATION REQUIRED"; }
check_antivirus() { echo "? Antivirus - MANUAL VERIFICATION REQUIRED"; }
check_malware_protection() { echo "? Malware protection - MANUAL VERIFICATION REQUIRED"; }
check_secure_development() { echo "? Secure development - MANUAL VERIFICATION REQUIRED"; }
check_vulnerability_management() { echo "? Vulnerability management - MANUAL VERIFICATION REQUIRED"; }
check_least_privilege() { echo "? Least privilege - MANUAL VERIFICATION REQUIRED"; }
check_user_authentication() { echo "? User authentication - MANUAL VERIFICATION REQUIRED"; }
check_password_policies() { echo "? Password policies - MANUAL VERIFICATION REQUIRED"; }
check_physical_security() { echo "? Physical security - MANUAL VERIFICATION REQUIRED"; }
check_audit_logging() { echo "? Audit logging - MANUAL VERIFICATION REQUIRED"; }
check_log_monitoring() { echo "? Log monitoring - MANUAL VERIFICATION REQUIRED"; }
check_penetration_testing() { echo "? Penetration testing - MANUAL VERIFICATION REQUIRED"; }
check_vulnerability_scanning() { echo "? Vulnerability scanning - MANUAL VERIFICATION REQUIRED"; }
check_security_policy() { echo "? Security policy - MANUAL VERIFICATION REQUIRED"; }
check_database_cleanup_procedures() { echo "? Database cleanup procedures - MANUAL VERIFICATION REQUIRED"; }

# Generate comprehensive compliance report
generate_compliance_report() {
    log "Generating comprehensive compliance report..."

    local report_file="$REPORT_DIR/comprehensive-report.html"

    {
        echo "<!DOCTYPE html>"
        echo "<html><head><title>HMS Compliance Audit Report</title></head><body>"
        echo "<h1>HMS Compliance Audit Report</h1>"
        echo "<p><strong>Date:</strong> $(date)</p>"
        echo "<p><strong>System:</strong> Hospital Management System</p>"
        echo ""
        echo "<h2>Audit Summary</h2>"
        echo "<p>This report contains the results of automated compliance auditing against multiple standards.</p>"
        echo ""
        echo "<h2>Compliance Standards Checked</h2>"
        echo "<ul>"

        if [ "$CHECK_HIPAA" = "true" ]; then
            echo "<li><a href='#hipaa'>HIPAA (Health Insurance Portability and Accountability Act)</a></li>"
        fi

        if [ "$CHECK_GDPR" = "true" ]; then
            echo "<li><a href='#gdpr'>GDPR (General Data Protection Regulation)</a></li>"
        fi

        if [ "$CHECK_SOC2" = "true" ]; then
            echo "<li><a href='#soc2'>SOC 2 (System and Organization Controls)</a></li>"
        fi

        if [ "$CHECK_PCI_DSS" = "true" ]; then
            echo "<li><a href='#pci'>PCI DSS (Payment Card Industry Data Security Standard)</a></li>"
        fi

        echo "</ul>"
        echo ""
        echo "<h2>Detailed Results</h2>"
        echo ""

        if [ "$CHECK_HIPAA" = "true" ]; then
            echo "<h3 id='hipaa'>HIPAA Compliance Results</h3>"
            echo "<pre>"
            cat "$REPORT_DIR/hipaa/audit-results.txt" 2>/dev/null || echo 'No HIPAA results available'
            echo "</pre>"
        fi

        if [ "$CHECK_GDPR" = "true" ]; then
            echo "<h3 id='gdpr'>GDPR Compliance Results</h3>"
            echo "<pre>"
            cat "$REPORT_DIR/gdpr/audit-results.txt" 2>/dev/null || echo 'No GDPR results available'
            echo "</pre>"
        fi

        if [ "$CHECK_SOC2" = "true" ]; then
            echo "<h3 id='soc2'>SOC 2 Compliance Results</h3>"
            echo "<pre>"
            cat "$REPORT_DIR/soc2/audit-results.txt" 2>/dev/null || echo 'No SOC 2 results available'
            echo "</pre>"
        fi

        if [ "$CHECK_PCI_DSS" = "true" ]; then
            echo "<h3 id='pci'>PCI DSS Compliance Results</h3>"
            echo "<pre>"
            cat "$REPORT_DIR/pci/audit-results.txt" 2>/dev/null || echo 'No PCI DSS results available'
            echo "</pre>"
        fi

        echo ""
        echo "<h2>Recommendations</h2>"
        echo "<ul>"
        echo "<li>Review all manual verification items marked with '?'</li>"
        echo "<li>Address any items marked with '✗'</li>"
        echo "<li>Implement missing policies and procedures</li>"
        echo "<li>Schedule regular compliance audits</li>"
        echo "<li>Train staff on compliance requirements</li>"
        echo "</ul>"
        echo ""
        echo "</body></html>"

    } > "$report_file"

    log "Comprehensive compliance report generated: $report_file"
}

# Main compliance audit function
main() {
    log "=== HMS Compliance Audit Started ==="

    setup_audit_environment

    # Run compliance audits
    audit_hipaa_compliance
    audit_gdpr_compliance
    audit_soc2_compliance
    audit_pci_dss_compliance

    # Generate comprehensive report
    generate_compliance_report

    log "=== HMS Compliance Audit Completed ==="
    log "Reports available in: $REPORT_DIR"
}

# Handle command line arguments
case "${1:-}" in
    "hipaa")
        setup_audit_environment
        audit_hipaa_compliance
        ;;
    "gdpr")
        setup_audit_environment
        audit_gdpr_compliance
        ;;
    "soc2")
        setup_audit_environment
        audit_soc2_compliance
        ;;
    "pci")
        setup_audit_environment
        audit_pci_dss_compliance
        ;;
    "report")
        generate_compliance_report
        ;;
    *)
        main
        ;;
esac