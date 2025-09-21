#!/bin/bash

# HMS Database High Availability Setup Script
# This script configures PostgreSQL high availability with streaming replication

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/hms/ha-setup.log"

# Database configuration
PRIMARY_HOST="${PRIMARY_HOST:-postgres-primary}"
STANDBY_HOST="${STANDBY_HOST:-postgres-standby}"
REPLICATION_USER="${REPLICATION_USER:-repl_user}"
REPLICATION_PASSWORD="${REPLICATION_PASSWORD:-repl_password}"
DB_NAME="${POSTGRES_DB:-hms_db}"
DB_USER="${POSTGRES_USER:-hms_app}"
DB_PASSWORD="${POSTGRES_PASSWORD}"

# Connection pool configuration
POOL_SIZE="${POOL_SIZE:-20}"
POOL_MODE="${POOL_MODE:-transaction}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Check if running as primary or standby
is_primary() {
    hostname | grep -q "primary"
}

# Configure primary database
configure_primary() {
    log "Configuring primary database..."

    # Create replication user
    docker exec "$PRIMARY_HOST" psql -U postgres -c "CREATE USER $REPLICATION_USER REPLICATION LOGIN ENCRYPTED PASSWORD '$REPLICATION_PASSWORD';"

    # Grant replication permissions
    docker exec "$PRIMARY_HOST" psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $REPLICATION_USER;"

    # Configure postgresql.conf for replication
    docker exec "$PRIMARY_HOST" bash -c "
        echo 'wal_level = replica' >> /var/lib/postgresql/data/postgresql.conf
        echo 'max_wal_senders = 10' >> /var/lib/postgresql/data/postgresql.conf
        echo 'wal_keep_size = 64' >> /var/lib/postgresql/data/postgresql.conf
        echo 'hot_standby = on' >> /var/lib/postgresql/data/postgresql.conf
    "

    # Configure pg_hba.conf for replication
    docker exec "$PRIMARY_HOST" bash -c "
        echo 'host replication $REPLICATION_USER 0.0.0.0/0 md5' >> /var/lib/postgresql/data/pg_hba.conf
        echo 'host all $DB_USER 0.0.0.0/0 md5' >> /var/lib/postgresql/data/pg_hba.conf
    "

    # Restart primary
    docker restart "$PRIMARY_HOST"

    log "Primary database configured successfully"
}

# Configure standby database
configure_standby() {
    log "Configuring standby database..."

    # Stop standby
    docker stop "$STANDBY_HOST"

    # Remove existing data
    docker exec "$STANDBY_HOST" rm -rf /var/lib/postgresql/data/*

    # Take base backup from primary
    docker run --rm --network hms_network \
        -e PGPASSWORD="$DB_PASSWORD" \
        postgres:15 pg_basebackup \
        -h "$PRIMARY_HOST" \
        -U "$REPLICATION_USER" \
        -D /tmp/backup \
        -Fp -Xs -P -R

    # Copy backup to standby
    docker cp /tmp/backup/. "$STANDBY_HOST:/var/lib/postgresql/data/"

    # Configure recovery.conf
    docker exec "$STANDBY_HOST" bash -c "
        cat > /var/lib/postgresql/data/postgresql.conf << EOF
wal_level = replica
max_wal_senders = 10
wal_keep_size = 64
hot_standby = on
EOF
    "

    # Configure standby.signal
    docker exec "$STANDBY_HOST" touch /var/lib/postgresql/data/standby.signal

    # Start standby
    docker start "$STANDBY_HOST"

    log "Standby database configured successfully"
}

# Configure PgBouncer connection pooler
configure_pgbouncer() {
    log "Configuring PgBouncer connection pooler..."

    # Create PgBouncer configuration
    cat > /tmp/pgbouncer.ini << EOF
[databases]
$DB_NAME = host=$PRIMARY_HOST port=5432 dbname=$DB_NAME

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = $POOL_MODE
max_client_conn = 1000
default_pool_size = $POOL_SIZE
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 50
max_user_connections = 100

logfile = /var/log/postgresql/pgbouncer.log
pidfile = /var/run/postgresql/pgbouncer.pid
admin_users = $DB_USER
EOF

    # Create userlist for PgBouncer
    cat > /tmp/userlist.txt << EOF
"$DB_USER" "$DB_PASSWORD"
"$REPLICATION_USER" "$REPLICATION_PASSWORD"
EOF

    # Start PgBouncer container
    docker run -d \
        --name pgbouncer \
        --network hms_network \
        -p 6432:6432 \
        -v /tmp/pgbouncer.ini:/etc/pgbouncer/pgbouncer.ini:ro \
        -v /tmp/userlist.txt:/etc/pgbouncer/userlist.txt:ro \
        edoburu/pgbouncer:latest \
        /etc/pgbouncer/pgbouncer.ini

    log "PgBouncer configured successfully"
}

# Configure HAProxy load balancer
configure_haproxy() {
    log "Configuring HAProxy load balancer..."

    # Create HAProxy configuration
    cat > /tmp/haproxy.cfg << EOF
global
    log /dev/log local0
    log /dev/log local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin expose-fd listeners
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

defaults
    log global
    mode tcp
    option tcplog
    option dontlognull
    timeout connect 5000
    timeout client 50000
    timeout server 50000

frontend postgres_front
    bind *:5433
    default_backend postgres_back

backend postgres_back
    option httpchk GET /health
    http-check expect status 200
    default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions

    server postgres-primary $PRIMARY_HOST:5432 check port 5432
    server postgres-standby $STANDBY_HOST:5432 check port 5432 backup

listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
EOF

    # Start HAProxy container
    docker run -d \
        --name haproxy \
        --network hms_network \
        -p 5433:5433 \
        -p 8404:8404 \
        -v /tmp/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro \
        haproxy:2.7-alpine

    log "HAProxy configured successfully"
}

# Configure monitoring for HA
configure_monitoring() {
    log "Configuring monitoring for HA setup..."

    # Add HA metrics to Prometheus
    cat >> /tmp/prometheus-ha.yml << EOF
  - job_name: 'postgres-primary'
    static_configs:
      - targets: ['$PRIMARY_HOST:9187']
    scrape_interval: 30s

  - job_name: 'postgres-standby'
    static_configs:
      - targets: ['$STANDBY_HOST:9187']
    scrape_interval: 30s

  - job_name: 'pgbouncer'
    static_configs:
      - targets: ['pgbouncer:6432']
    scrape_interval: 30s

  - job_name: 'haproxy'
    static_configs:
      - targets: ['haproxy:8404']
    scrape_interval: 30s
EOF

    log "HA monitoring configured"
}

# Test replication
test_replication() {
    log "Testing database replication..."

    # Wait for replication to be established
    sleep 30

    # Check replication status on primary
    docker exec "$PRIMARY_HOST" psql -U postgres -c "SELECT * FROM pg_stat_replication;"

    # Check if standby is connected
    local standby_count
    standby_count=$(docker exec "$PRIMARY_HOST" psql -U postgres -c "SELECT COUNT(*) FROM pg_stat_replication;" -t)

    if [ "$standby_count" -gt 0 ]; then
        log "Replication test successful - $standby_count standby(s) connected"
    else
        error_exit "Replication test failed - no standbys connected"
    fi

    # Test failover (optional)
    log "Testing failover capability..."
    # This would involve promoting standby and checking if application can connect
}

# Main HA setup function
main() {
    log "=== HMS Database HA Setup Started ==="

    if is_primary; then
        log "Running on primary node"
        configure_primary
    else
        log "Running on standby node"
        configure_standby
    fi

    # Configure connection pooling and load balancing
    configure_pgbouncer
    configure_haproxy
    configure_monitoring

    # Test the setup
    test_replication

    log "=== HMS Database HA Setup Completed Successfully ==="
}

# Handle command line arguments
case "${1:-}" in
    "primary")
        configure_primary
        ;;
    "standby")
        configure_standby
        ;;
    "test")
        test_replication
        ;;
    *)
        main
        ;;
esac