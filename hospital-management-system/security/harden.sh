#!/bin/bash

# HMS Security Hardening Script
# This script implements enterprise-grade security hardening

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/security-hardening.log"

# Security configuration
MIN_PASSWORD_LENGTH="${MIN_PASSWORD_LENGTH:-12}"
SESSION_TIMEOUT="${SESSION_TIMEOUT:-3600000}"
MAX_LOGIN_ATTEMPTS="${MAX_LOGIN_ATTEMPTS:-5}"
LOCKOUT_DURATION="${LOCKOUT_DURATION:-900}"

# SSL/TLS configuration
SSL_PROTOCOLS="TLSv1.2 TLSv1.3"
SSL_CIPHERS="ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Harden Docker containers
harden_containers() {
    log "Hardening Docker containers..."

    # Create security-focused docker-compose override
    cat > "$SCRIPT_DIR/docker-compose.security.yml" << EOF
version: '3.8'

services:
  # Security headers and hardening
  nginx:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
      - /var/cache/nginx

  backend:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    read_only: true
    tmpfs:
      - /tmp
    environment:
      - NODE_ENV=production
      - DEBUG=false

  postgres:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - DAC_OVERRIDE
      - SETGID
      - SETUID
    read_only: true
    tmpfs:
      - /tmp
      - /var/run/postgresql

  redis:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    read_only: true
    tmpfs:
      - /tmp
EOF

    log "Docker security hardening configuration created"
}

# Configure SSL/TLS
configure_ssl() {
    log "Configuring SSL/TLS security..."

    # Generate strong Diffie-Hellman parameters
    openssl dhparam -out "$SCRIPT_DIR/ssl/dhparam.pem" 2048

    # Create SSL configuration
    cat > "$SCRIPT_DIR/ssl/ssl.conf" << EOF
# SSL/TLS Configuration
ssl_protocols $SSL_PROTOCOLS;
ssl_ciphers $SSL_CIPHERS;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;

# HSTS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# CSP Header
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; child-src 'self'; worker-src 'self'; frame-ancestors 'self';" always;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
EOF

    log "SSL/TLS configuration completed"
}

# Configure firewall rules
configure_firewall() {
    log "Configuring firewall rules..."

    # Create UFW rules (if using UFW)
    cat > "$SCRIPT_DIR/firewall/ufw-rules.sh" << 'EOF'
#!/bin/bash

# UFW Firewall Rules for HMS

# Reset UFW
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (change port if not default)
ufw allow ssh

# Allow HTTP and HTTPS
ufw allow 80
ufw allow 443

# Allow monitoring ports (internal access only)
ufw allow from 10.0.0.0/8 to any port 9090  # Prometheus
ufw allow from 10.0.0.0/8 to any port 3001  # Grafana
ufw allow from 10.0.0.0/8 to any port 5601  # Kibana

# Rate limiting for SSH
ufw limit ssh

# Enable UFW
ufw --force enable

echo "UFW firewall rules configured"
EOF

    # Create iptables rules (alternative)
    cat > "$SCRIPT_DIR/firewall/iptables-rules.sh" << 'EOF'
#!/bin/bash

# iptables Firewall Rules for HMS

# Flush existing rules
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -t mangle -F
iptables -t mangle -X

# Default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH with rate limiting
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m limit --limit 3/min --limit-burst 3 -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j DROP

# Allow HTTP and HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow monitoring (internal only)
iptables -A INPUT -s 10.0.0.0/8 -p tcp --dport 9090 -j ACCEPT  # Prometheus
iptables -A INPUT -s 10.0.0.0/8 -p tcp --dport 3001 -j ACCEPT  # Grafana
iptables -A INPUT -s 10.0.0.0/8 -p tcp --dport 5601 -j ACCEPT  # Kibana

# Drop invalid packets
iptables -A INPUT -m conntrack --ctstate INVALID -j DROP

# Protection against common attacks
iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL ALL -j DROP
iptables -A INPUT -p tcp --tcp-flags SYN,FIN SYN,FIN -j DROP
iptables -A INPUT -p tcp --tcp-flags SYN,RST SYN,RST -j DROP
iptables -A INPUT -p tcp --tcp-flags FIN,RST FIN,RST -j DROP

# Save rules
iptables-save > /etc/iptables/rules.v4

echo "iptables firewall rules configured"
EOF

    chmod +x "$SCRIPT_DIR/firewall/"*.sh
    log "Firewall configuration completed"
}

# Configure application security
configure_application_security() {
    log "Configuring application security..."

    # Create security middleware configuration
    cat > "$SCRIPT_DIR/app/security-middleware.js" << 'EOF'
// HMS Security Middleware Configuration

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const hpp = require('hpp');

module.exports = (app) => {
  // Helmet security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        workerSrc: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://hms.local',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Request size limiting
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Hide server information
  app.disable('x-powered-by');

  console.log('Security middleware configured');
};
EOF

    log "Application security configuration completed"
}

# Configure database security
configure_database_security() {
    log "Configuring database security..."

    # Create database security script
    cat > "$SCRIPT_DIR/database/security-setup.sql" << 'EOF'
-- HMS Database Security Configuration

-- Enable Row Level Security (RLS)
ALTER DATABASE hms_db SET row_security = on;

-- Create security functions
CREATE OR REPLACE FUNCTION auth.jwt_claims(user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'user_id', u.id,
    'role', u.role,
    'permissions', u.permissions
  )
  FROM users u
  WHERE u.id = user_id;
$$;

-- Create audit trigger for sensitive tables
CREATE OR REPLACE FUNCTION audit_sensitive_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_log (
    table_name,
    operation,
    old_values,
    new_values,
    changed_by,
    changed_at
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::jsonb ELSE NULL END,
    current_user,
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_data();

CREATE TRIGGER audit_medical_records
  AFTER INSERT OR UPDATE OR DELETE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_data();

-- Create data masking functions
CREATE OR REPLACE FUNCTION mask_ssn(ssn text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT concat(left(ssn, 3), '**-**-', right(ssn, 4));
$$;

-- Create password policy
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
ALTER SYSTEM SET password_min_length = 12;

-- Configure connection limits
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_preload_libraries = 'passwordcheck';

-- Reload configuration
SELECT pg_reload_conf();

-- Create monitoring views for security
CREATE VIEW security_monitoring AS
SELECT
  usename,
  client_addr,
  client_port,
  backend_start,
  query_start,
  state_change,
  state,
  query
FROM pg_stat_activity
WHERE usename NOT IN ('postgres', 'hms_monitor')
ORDER BY backend_start DESC;

GRANT SELECT ON security_monitoring TO hms_monitor;
EOF

    log "Database security configuration completed"
}

# Configure monitoring for security events
configure_security_monitoring() {
    log "Configuring security monitoring..."

    # Create security monitoring rules for Prometheus
    cat > "$SCRIPT_DIR/monitoring/security-alerts.yml" << 'EOF'
groups:
  - name: security_alerts
    rules:
      # Failed login attempts
      - alert: HighFailedLoginAttempts
        expr: rate(failed_login_attempts_total[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High number of failed login attempts"
          description: "Failed login attempts rate: {{ $value }} per minute"

      # Suspicious database activity
      - alert: UnusualDatabaseActivity
        expr: rate(pg_stat_activity_count[5m]) > 50
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Unusual database activity detected"
          description: "Database connections: {{ $value }}"

      # SSL/TLS certificate expiration
      - alert: SSLCertificateExpiration
        expr: ssl_certificate_expiration_days < 30
        for: 1h
        labels:
          severity: critical
        annotations:
          summary: "SSL certificate expiring soon"
          description: "SSL certificate expires in {{ $value }} days"

      # Unauthorized access attempts
      - alert: UnauthorizedAccessAttempts
        expr: rate(unauthorized_access_attempts_total[5m]) > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Unauthorized access attempts detected"
          description: "Unauthorized access attempts: {{ $value }} per minute"
EOF

    log "Security monitoring configuration completed"
}

# Generate security report
generate_security_report() {
    log "Generating security hardening report..."

    local report_file="$SCRIPT_DIR/reports/security-report-$(date +%Y%m%d_%H%M%S).txt"

    {
        echo "HMS Security Hardening Report"
        echo "=============================="
        echo "Timestamp: $(date)"
        echo ""

        echo "Security Configurations Applied:"
        echo "✓ Docker container hardening"
        echo "✓ SSL/TLS configuration"
        echo "✓ Firewall rules"
        echo "✓ Application security middleware"
        echo "✓ Database security policies"
        echo "✓ Security monitoring and alerting"
        echo ""

        echo "Security Checklist:"
        echo "□ Change default passwords"
        echo "□ Configure proper SSL certificates"
        echo "□ Set up log monitoring and alerting"
        echo "□ Configure backup encryption"
        echo "□ Set up regular security audits"
        echo "□ Configure intrusion detection"
        echo ""

        echo "Next Steps:"
        echo "1. Review and apply firewall rules"
        echo "2. Configure SSL certificates"
        echo "3. Set up log aggregation and monitoring"
        echo "4. Configure backup encryption"
        echo "5. Set up regular security scanning"
        echo ""

    } > "$report_file"

    log "Security report generated: $report_file"
}

# Main security hardening function
main() {
    log "=== HMS Security Hardening Started ==="

    # Create security directories
    mkdir -p "$SCRIPT_DIR/ssl" "$SCRIPT_DIR/firewall" "$SCRIPT_DIR/app" "$SCRIPT_DIR/database" "$SCRIPT_DIR/monitoring"

    # Apply security configurations
    harden_containers
    configure_ssl
    configure_firewall
    configure_application_security
    configure_database_security
    configure_security_monitoring

    # Generate report
    generate_security_report

    log "=== HMS Security Hardening Completed ==="
    log ""
    log "⚠️  IMPORTANT: Review the generated configurations and apply them to your environment"
    log "📋 Security checklist and next steps are available in the security report"
}

# Handle command line arguments
case "${1:-}" in
    "containers")
        harden_containers
        ;;
    "ssl")
        configure_ssl
        ;;
    "firewall")
        configure_firewall
        ;;
    "app")
        configure_application_security
        ;;
    "database")
        configure_database_security
        ;;
    "monitoring")
        configure_security_monitoring
        ;;
    "report")
        generate_security_report
        ;;
    *)
        main
        ;;
esac