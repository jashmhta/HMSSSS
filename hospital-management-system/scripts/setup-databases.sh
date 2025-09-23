#!/bin/bash

# Enterprise Database Setup Script for Hospital Management System
# This script creates and configures all required databases with proper permissions

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_SUPERUSER="postgres"

# Database names and users
MAIN_DB="hms_db"
MAIN_USER="hms_user"
MAIN_PASSWORD="StrongPassword123!"

TEST_DB="hms_test_db"
TEST_USER="hms_test_user"
TEST_PASSWORD="TestPassword123!"

DEV_DB="hms_dev_db"
DEV_USER="hms_dev_user"
DEV_PASSWORD="DevPassword123!"

SHADOW_DB="hms_shadow_db"
SHADOW_USER="hms_shadow_user"
SHADOW_PASSWORD="ShadowPassword123!"

echo -e "${BLUE}🏥 Hospital Management System - Enterprise Database Setup${NC}"
echo "=================================================="

# Function to check if PostgreSQL is running
check_postgresql() {
    echo -e "${YELLOW}🔍 Checking if PostgreSQL is running...${NC}"
    if pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is running on $DB_HOST:$DB_PORT${NC}"
        return 0
    else
        echo -e "${RED}❌ PostgreSQL is not running or not accessible${NC}"
        echo "Please start PostgreSQL and try again"
        return 1
    fi
}

# Function to create database and user
create_database() {
    local db_name=$1
    local db_user=$2
    local db_password=$3
    local description=$4

    echo -e "${YELLOW}🗄️  Creating $description database...${NC}"

    # Create user if not exists
    psql -h $DB_HOST -p $DB_PORT -U $DB_SUPERUSER -tc "SELECT 1 FROM pg_roles WHERE rolname='$db_user'" | grep -q 1 || \
    psql -h $DB_HOST -p $DB_PORT -U $DB_SUPERUSER -c "CREATE USER $db_user WITH PASSWORD '$db_password';"

    # Create database if not exists
    psql -h $DB_HOST -p $DB_PORT -U $DB_SUPERUSER -tc "SELECT 1 FROM pg_database WHERE datname='$db_name'" | grep -q 1 || \
    psql -h $DB_HOST -p $DB_PORT -U $DB_SUPERUSER -c "CREATE DATABASE $db_name OWNER $db_user;"

    # Grant all privileges
    psql -h $DB_HOST -p $DB_PORT -U $DB_SUPERUSER -c "GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;"
    psql -h $DB_HOST -p $DB_PORT -U $DB_SUPERUSER -c "GRANT ALL ON SCHEMA public TO $db_user;"
    psql -h $DB_HOST -p $DB_PORT -U $DB_SUPERUSER -d $db_name -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO $db_user;"
    psql -h $DB_HOST -p $DB_PORT -U $DB_SUPERUSER -d $db_name -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO $db_user;"
    psql -h $DB_HOST -p $DB_PORT -U $DB_SUPERUSER -d $db_name -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $db_user;"
    psql -h $DB_HOST -p $DB_PORT -U $DB_SUPERUSER -d $db_name -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $db_user;"

    echo -e "${GREEN}✅ $description database created successfully${NC}"
}

# Function to test database connection
test_database_connection() {
    local db_name=$1
    local db_user=$2
    local db_password=$3
    local description=$4

    echo -e "${YELLOW}🔌 Testing $description database connection...${NC}"

    if PGPASSWORD=$db_password psql -h $DB_HOST -p $DB_PORT -U $db_user -d $db_name -c "SELECT version();" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $description database connection successful${NC}"
        return 0
    else
        echo -e "${RED}❌ $description database connection failed${NC}"
        return 1
    fi
}

# Function to setup PostgreSQL extensions
setup_extensions() {
    local db_name=$1
    local description=$2

    echo -e "${YELLOW}🔧 Setting up PostgreSQL extensions for $description...${NC}"

    # Install useful extensions for enterprise applications
    extensions=(
        "uuid-ossp"        # UUID generation
        "pgcrypto"         # Cryptographic functions
        "pg_stat_statements"  # Query statistics
        "pg_trgm"          # Trigram matching for full-text search
        "btree_gin"        # GIN indexes for array types
        "btree_gist"       # GiST indexes
        "citext"           # Case-insensitive text
        "hstore"           # Key-value store
        "ltree"            # Hierarchical tree structures
        "unaccent"         # Text processing
        "fuzzystrmatch"    # Fuzzy string matching
    )

    for ext in "${extensions[@]}"; do
        psql -h $DB_HOST -p $DB_PORT -U $DB_SUPERUSER -d $db_name -c "CREATE EXTENSION IF NOT EXISTS \"$ext\";" || \
        echo -e "${YELLOW}⚠️  Could not create extension $ext - skipping${NC}"
    done

    echo -e "${GREEN}✅ PostgreSQL extensions configured for $description${NC}"
}

# Function to setup database optimizations
setup_optimizations() {
    local db_name=$1
    local description=$2

    echo -e "${YELLOW}⚡ Setting up database optimizations for $description...${NC}"

    # Create optimization functions
    psql -h $DB_HOST -p $DB_PORT -U $DB_SUPERUSER -d $db_name << 'EOF'
-- Function to update table statistics
CREATE OR REPLACE FUNCTION update_table_stats()
RETURNS void AS $$
BEGIN
    ANALYZE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data (for future use)
CREATE OR REPLACE FUNCTION cleanup_old_data(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- This will be implemented based on specific retention policies
    -- For now, just return 0
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Function to monitor database performance
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE(
    table_name TEXT,
    row_count BIGINT,
    table_size BIGINT,
    index_size BIGINT,
    total_size BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname || '.' || tablename as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_total_relation_size(schemaname||'.'||tablename) as table_size,
        pg_indexes_size(schemaname||'.'||tablename) as index_size,
        pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename) as total_size
    FROM pg_stat_user_tables;
END;
$$ LANGUAGE plpgsql;

-- Create view for database health
CREATE OR REPLACE VIEW database_health AS
SELECT
    datname as database_name,
    pg_size_pretty(pg_database_size(datname)) as size,
    age(datfrozenxid) as xid_age,
    pg_stat_get_dead_tuples(c.oid) as dead_tuples
FROM pg_database d
JOIN pg_class c ON d.datname = c.relname
WHERE d.datistemplate = false;
EOF

    echo -e "${GREEN}✅ Database optimizations configured for $description${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}🚀 Starting enterprise database setup...${NC}"
    echo

    # Check if PostgreSQL is running
    check_postgresql || exit 1

    echo

    # Create all databases
    create_database "$MAIN_DB" "$MAIN_USER" "$MAIN_PASSWORD" "Main Production"
    create_database "$TEST_DB" "$TEST_USER" "$TEST_PASSWORD" "Test"
    create_database "$DEV_DB" "$DEV_USER" "$DEV_PASSWORD" "Development"
    create_database "$SHADOW_DB" "$SHADOW_USER" "$SHADOW_PASSWORD" "Shadow (for migrations)"

    echo

    # Test all database connections
    test_database_connection "$MAIN_DB" "$MAIN_USER" "$MAIN_PASSWORD" "Main Production"
    test_database_connection "$TEST_DB" "$TEST_USER" "$TEST_PASSWORD" "Test"
    test_database_connection "$DEV_DB" "$DEV_USER" "$DEV_PASSWORD" "Development"
    test_database_connection "$SHADOW_DB" "$SHADOW_USER" "$SHADOW_PASSWORD" "Shadow"

    echo

    # Setup extensions and optimizations for main database
    setup_extensions "$MAIN_DB" "Main Production"
    setup_optimizations "$MAIN_DB" "Main Production"

    # Setup basic extensions for other databases
    setup_extensions "$TEST_DB" "Test"
    setup_extensions "$DEV_DB" "Development"

    echo
    echo -e "${GREEN}🎉 Enterprise database setup completed successfully!${NC}"
    echo
    echo -e "${BLUE}📋 Database Configuration Summary:${NC}"
    echo "┌─────────────────────────┬────────────────────────┬─────────────────────────┐"
    echo "│ Database               │ User                   │ Purpose                  │"
    echo "├─────────────────────────┼────────────────────────┼─────────────────────────┤"
    echo "│ $MAIN_DB               │ $MAIN_USER              │ Production               │"
    echo "│ $TEST_DB               │ $TEST_USER              │ Testing                  │"
    echo "│ $DEV_DB                │ $DEV_USER               │ Development              │"
    echo "│ $SHADOW_DB             │ $SHADOW_USER            │ Prisma Migrations        │"
    echo "└─────────────────────────┴────────────────────────┴─────────────────────────┘"
    echo
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "1. Run 'npm run db:migrate' to apply database migrations"
    echo "2. Run 'npm run db:seed' to populate with test data"
    echo "3. Run 'npm run db:studio' to open Prisma Studio"
    echo
}

# Run main function
main "$@"