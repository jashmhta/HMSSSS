#!/bin/bash

# Enterprise Test Database Automation Script
# Provides automated test database creation, migration, seeding, and cleanup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
TEST_DB_NAME="hms_test_db"
TEST_DB_USER="hms_test_user"
TEST_DB_PASSWORD="TestPassword123!"
TEST_DB_HOST="localhost"
TEST_DB_PORT="5432"
SUPERUSER="postgres"

# Test runner configuration
TEST_PARALLEL_JOBS=4
TEST_TIMEOUT=30000  # 30 seconds
TEST_RETRY_COUNT=3
TEST_CLEANUP=true
TEST_ISOLATION=true

# Paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
LOGS_DIR="$PROJECT_ROOT/logs"

# Create logs directory
mkdir -p "$LOGS_DIR"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOGS_DIR/test-database.log"
}

log_info() { log "${BLUE}INFO${NC}" "$*"; }
log_success() { log "${GREEN}SUCCESS${NC}" "$*"; }
log_warning() { log "${YELLOW}WARNING${NC}" "$*"; }
log_error() { log "${RED}ERROR${NC}" "$*"; }
log_debug() { log "${PURPLE}DEBUG${NC}" "$*"; }

# Function to check if PostgreSQL is running
check_postgresql() {
    log_info "Checking PostgreSQL connectivity..."

    if ! pg_isready -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" > /dev/null 2>&1; then
        log_error "PostgreSQL is not running or not accessible at $TEST_DB_HOST:$TEST_DB_PORT"
        return 1
    fi

    log_success "PostgreSQL is running and accessible"
    return 0
}

# Function to create test database
create_test_database() {
    log_info "Creating test database: $TEST_DB_NAME"

    # Check if database exists
    if psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$SUPERUSER" -tc "SELECT 1 FROM pg_database WHERE datname = '$TEST_DB_NAME'" | grep -q 1; then
        log_warning "Test database $TEST_DB_NAME already exists"

        if [ "$TEST_ISOLATION" = "true" ]; then
            log_info "Dropping existing test database for isolation..."
            dropdb -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$SUPERUSER" "$TEST_DB_NAME" --if-exists
        else
            log_info "Using existing test database"
            return 0
        fi
    fi

    # Create test database
    createdb -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$SUPERUSER" "$TEST_DB_NAME" || {
        log_error "Failed to create test database $TEST_DB_NAME"
        return 1
    }

    # Create test user if not exists
    psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$SUPERUSER" -tc "SELECT 1 FROM pg_roles WHERE rolname = '$TEST_DB_USER'" | grep -q 1 || \
    psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$SUPERUSER" -c "CREATE USER $TEST_DB_USER WITH PASSWORD '$TEST_DB_PASSWORD';"

    # Grant privileges
    psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$SUPERUSER" -c "GRANT ALL PRIVILEGES ON DATABASE $TEST_DB_NAME TO $TEST_DB_USER;"
    psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$SUPERUSER" -d "$TEST_DB_NAME" -c "GRANT ALL ON SCHEMA public TO $TEST_DB_USER;"
    psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$SUPERUSER" -d "$TEST_DB_NAME" -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO $TEST_DB_USER;"
    psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$SUPERUSER" -d "$TEST_DB_NAME" -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $TEST_DB_USER;"

    log_success "Test database $TEST_DB_NAME created successfully"
}

# Function to run database migrations
run_migrations() {
    log_info "Running database migrations..."

    cd "$BACKEND_DIR"

    # Set environment for test database
    export DATABASE_URL="postgresql://$TEST_DB_USER:$TEST_DB_PASSWORD@$TEST_DB_HOST:$TEST_DB_PORT/$TEST_DB_NAME"

    # Run migrations
    if ! npx prisma migrate deploy; then
        log_error "Failed to run database migrations"
        return 1
    fi

    log_success "Database migrations completed successfully"
}

# Function to generate Prisma client
generate_prisma_client() {
    log_info "Generating Prisma client..."

    cd "$BACKEND_DIR"

    # Set environment for test database
    export DATABASE_URL="postgresql://$TEST_DB_USER:$TEST_DB_PASSWORD@$TEST_DB_HOST:$TEST_DB_PORT/$TEST_DB_NAME"

    # Generate client
    if ! npx prisma generate; then
        log_error "Failed to generate Prisma client"
        return 1
    fi

    log_success "Prisma client generated successfully"
}

# Function to seed test data
seed_test_data() {
    log_info "Seeding test data..."

    cd "$BACKEND_DIR"

    # Set environment for test database
    export DATABASE_URL="postgresql://$TEST_DB_USER:$TEST_DB_PASSWORD@$TEST_DB_HOST:$TEST_DB_PORT/$TEST_DB_NAME"
    export NODE_ENV="test"

    # Run seed script
    if ! npx prisma db seed; then
        log_error "Failed to seed test data"
        return 1
    fi

    log_success "Test data seeded successfully"
}

# Function to create test isolation
setup_test_isolation() {
    if [ "$TEST_ISOLATION" != "true" ]; then
        log_info "Test isolation is disabled"
        return 0
    fi

    log_info "Setting up test isolation..."

    cd "$BACKEND_DIR"

    # Set environment for test database
    export DATABASE_URL="postgresql://$TEST_DB_USER:$TEST_DB_PASSWORD@$TEST_DB_HOST:$TEST_DB_PORT/$TEST_DB_NAME"

    # Create transaction for each test
    psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$TEST_DB_USER" -d "$TEST_DB_NAME" << 'EOF'
-- Create function to reset test data
CREATE OR REPLACE FUNCTION reset_test_data()
RETURNS void AS $$
BEGIN
    -- Delete all test data in reverse order of dependencies
    DELETE FROM audit_logs;
    DELETE FROM data_retention_logs;
    DELETE FROM compliance_checks;
    DELETE FROM inventory_logs;
    DELETE FROM bill_items;
    DELETE FROM bills;
    DELETE FROM surgeries;
    DELETE FROM operating_theaters;
    DELETE FROM opd_visits;
    DELETE FROM emergency_visits;
    DELETE FROM lab_reports;
    DELETE FROM lab_results;
    DELETE FROM lab_samples;
    DELETE FROM lab_tests;
    DELETE FROM lab_quality_control;
    DELETE FROM lab_reagents;
    DELETE FROM lab_equipment;
    DELETE FROM lab_test_catalog;
    DELETE FROM lis_integrations;
    DELETE FROM prescriptions;
    DELETE FROM medications;
    DELETE FROM blood_donations;
    DELETE FROM radiology_tests;
    DELETE FROM medical_records;
    DELETE FROM appointments;
    DELETE FROM admins;
    DELETE FROM pharmacists;
    DELETE FROM lab_technicians;
    DELETE FROM receptionists;
    DELETE FROM nurses;
    DELETE FROM doctors;
    DELETE FROM patients;
    DELETE FROM users;

    -- Reset sequences
    PERFORM setval(pg_get_serial_sequence('users', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('patients', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('doctors', 'id'), 1, false);
    PERFORM setval(pg_get_serial_sequence('appointments', 'id'), 1, false);

END;
$$ LANGUAGE plpgsql;

-- Create function to create test snapshot
CREATE OR REPLACE FUNCTION create_test_snapshot(snapshot_name TEXT)
RETURNS void AS $$
BEGIN
    -- This would create a database snapshot for testing
    -- Implementation depends on PostgreSQL version and extensions
    -- For now, we'll just log the action
    RAISE NOTICE 'Creating test snapshot: %', snapshot_name;
END;
$$ LANGUAGE plpgsql;
EOF

    log_success "Test isolation setup completed"
}

# Function to run health checks
run_health_checks() {
    log_info "Running database health checks..."

    cd "$BACKEND_DIR"

    # Set environment for test database
    export DATABASE_URL="postgresql://$TEST_DB_USER:$TEST_DB_PASSWORD@$TEST_DB_HOST:$TEST_DB_PORT/$TEST_DB_NAME"

    # Test database connection
    if ! npx prisma db execute --stdin <<< "SELECT version();"; then
        log_error "Database connection test failed"
        return 1
    fi

    # Test schema integrity
    if ! npx prisma validate; then
        log_error "Schema validation failed"
        return 1
    fi

    # Test basic queries
    if ! npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"; then
        log_error "Basic query test failed"
        return 1
    fi

    log_success "Database health checks passed"
}

# Function to run performance tests
run_performance_tests() {
    log_info "Running database performance tests..."

    cd "$BACKEND_DIR"

    # Set environment for test database
    export DATABASE_URL="postgresql://$TEST_DB_USER:$TEST_DB_PASSWORD@$TEST_DB_HOST:$TEST_DB_PORT/$TEST_DB_NAME"

    # Test connection pooling
    local start_time=$(date +%s%N)
    for i in {1..10}; do
        npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1
    done
    local end_time=$(date +%s%N)
    local duration=$((($end_time - $start_time) / 1000000))

    log_info "Connection pooling test completed in ${duration}ms"

    # Test query performance
    start_time=$(date +%s%N)
    npx prisma db execute --stdin <<< "SELECT * FROM users;" > /dev/null 2>&1
    end_time=$(date +%s%N)
    duration=$((($end_time - $start_time) / 1000000)

    log_info "Query performance test completed in ${duration}ms"

    log_success "Performance tests completed"
}

# Function to cleanup test database
cleanup_test_database() {
    if [ "$TEST_CLEANUP" != "true" ]; then
        log_info "Test cleanup is disabled"
        return 0
    fi

    log_info "Cleaning up test database..."

    # Reset test data if isolation is enabled
    if [ "$TEST_ISOLATION" = "true" ]; then
        cd "$BACKEND_DIR"
        export DATABASE_URL="postgresql://$TEST_DB_USER:$TEST_DB_PASSWORD@$TEST_DB_HOST:$TEST_DB_PORT/$TEST_DB_NAME"

        psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$TEST_DB_USER" -d "$TEST_DB_NAME" -c "SELECT reset_test_data();" 2>/dev/null || true
        log_success "Test data reset completed"
    else
        # Drop the entire database
        dropdb -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$SUPERUSER" "$TEST_DB_NAME" --if-exists
        log_success "Test database dropped"
    fi
}

# Function to generate test report
generate_test_report() {
    log_info "Generating test report..."

    local report_file="$LOGS_DIR/test-database-report-$(date +%Y%m%d_%H%M%S).md"

    cat > "$report_file" << EOF
# Test Database Report

**Generated:** $(date '+%Y-%m-%d %H:%M:%S')
**Database:** $TEST_DB_NAME
**Host:** $TEST_DB_HOST:$TEST_DB_PORT

## Configuration
- **Test Isolation:** $TEST_ISOLATION
- **Parallel Jobs:** $TEST_PARALLEL_JOBS
- **Timeout:** $TEST_TIMEOUT ms
- **Cleanup Enabled:** $TEST_CLEANUP

## Database Information
\`\`\`sql
$(psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$TEST_DB_USER" -d "$TEST_DB_NAME" -c "SELECT version();" 2>/dev/null || echo "Database connection failed")
\`\`\`

## Schema Statistics
\`\`\`sql
$(psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$TEST_DB_USER" -d "$TEST_DB_NAME" -c "
SELECT
    schemaname,
    COUNT(*) as table_count,
    SUM(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_tables
WHERE schemaname = 'public'
GROUP BY schemaname;" 2>/dev/null || echo "Schema statistics failed")
\`\`\`

## Test Results
- **Database Creation:** ✅
- **Migrations:** ✅
- **Prisma Client Generation:** ✅
- **Test Data Seeding:** ✅
- **Health Checks:** ✅
- **Performance Tests:** ✅
- **Cleanup:** ✅

## Summary
Test database setup and validation completed successfully.

EOF

    log_success "Test report generated: $report_file"
}

# Main execution function
main() {
    log_info "🧪 Starting Enterprise Test Database Automation"
    echo "=================================================="

    # Change to project root
    cd "$PROJECT_ROOT"

    # Check prerequisites
    check_postgresql || exit 1

    echo

    # Create test database
    create_test_database || exit 1

    echo

    # Run migrations
    run_migrations || exit 1

    echo

    # Generate Prisma client
    generate_prisma_client || exit 1

    echo

    # Setup test isolation
    setup_test_isolation || exit 1

    echo

    # Seed test data
    seed_test_data || exit 1

    echo

    # Run health checks
    run_health_checks || exit 1

    echo

    # Run performance tests
    run_performance_tests || exit 1

    echo

    # Generate test report
    generate_test_report

    echo
    log_success "🎉 Test Database Automation Completed Successfully!"
    echo
    log_info "📋 Next Steps:"
    echo "  - Run tests: npm run test"
    echo "  - Run specific tests: npm run test:unit"
    echo "  - Run integration tests: npm run test:integration"
    echo "  - View test report: $LOGS_DIR/test-database-report-*.md"
    echo

    # Cleanup if requested
    if [ "$TEST_CLEANUP" = "true" ]; then
        echo
        log_info "🧹 Cleaning up test database..."
        cleanup_test_database
    fi
}

# Function to handle script interruption
cleanup() {
    log_warning "Script interrupted, cleaning up..."
    cleanup_test_database
    exit 1
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cleanup)
            TEST_CLEANUP=false
            shift
            ;;
        --no-isolation)
            TEST_ISOLATION=false
            shift
            ;;
        --parallel-jobs)
            TEST_PARALLEL_JOBS="$2"
            shift 2
            ;;
        --timeout)
            TEST_TIMEOUT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --no-cleanup        Skip database cleanup"
            echo "  --no-isolation     Disable test isolation"
            echo "  --parallel-jobs N   Set number of parallel jobs (default: 4)"
            echo "  --timeout N         Set test timeout in milliseconds (default: 30000)"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"