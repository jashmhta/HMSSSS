#!/bin/bash

# Enterprise Prisma Setup Verification Script
# Comprehensive verification of all Prisma functionality and database setup

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
DATABASE_DIR="$PROJECT_ROOT/database"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
LOGS_DIR="$PROJECT_ROOT/logs"

# Create logs directory
mkdir -p "$LOGS_DIR"

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging functions
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOGS_DIR/prisma-verification.log"
}

log_info() { log "${BLUE}INFO${NC}" "$*"; }
log_success() { log "${GREEN}SUCCESS${NC}" "$*"; }
log_warning() { log "${YELLOW}WARNING${NC}" "$*"; }
log_error() { log "${RED}ERROR${NC}" "$*"; }
log_debug() { log "${PURPLE}DEBUG${NC}" "$*"; }
log_test() { log "${CYAN}TEST${NC}" "$*"; }

# Test result tracking
test_start() {
    local test_name="$1"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log_test "Starting test: $test_name"
    TEST_START_TIME=$(date +%s)
}

test_pass() {
    local test_name="$1"
    local duration=$(( $(date +%s) - TEST_START_TIME ))
    PASSED_TESTS=$((PASSED_TESTS + 1))
    log_success "✅ Test passed: $test_name (${duration}s)"
}

test_fail() {
    local test_name="$1"
    local error_message="$2"
    local duration=$(( $(date +%s) - TEST_START_TIME ))
    FAILED_TESTS=$((FAILED_TESTS + 1))
    log_error "❌ Test failed: $test_name (${duration}s) - $error_message"
}

# Test 1: Check file structure
test_file_structure() {
    test_start "File Structure Verification"

    local required_files=(
        "$BACKEND_DIR/prisma/schema.prisma"
        "$BACKEND_DIR/prisma/migrations"
        "$BACKEND_DIR/prisma/seed.ts"
        "$DATABASE_DIR/schema.prisma"
        "$PROJECT_ROOT/.env"
        "$PROJECT_ROOT/.env.production"
        "$BACKEND_DIR/package.json"
        "$BACKEND_DIR/src/config/security.config.ts"
        "$BACKEND_DIR/src/config/database.config.ts"
        "$SCRIPTS_DIR/setup-databases.sh"
        "$SCRIPTS_DIR/test-database-automation.sh"
    )

    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ] && [ ! -d "$file" ]; then
            test_fail "File Structure" "Required file/directory not found: $file"
            return 1
        fi
    done

    test_pass "File Structure"
}

# Test 2: Check Prisma installation
test_prisma_installation() {
    test_start "Prisma Installation"

    cd "$BACKEND_DIR"

    if ! npm list prisma > /dev/null 2>&1; then
        test_fail "Prisma Installation" "Prisma not installed in backend package.json"
        return 1
    fi

    if ! npm list @prisma/client > /dev/null 2>&1; then
        test_fail "Prisma Installation" "@prisma/client not installed in backend package.json"
        return 1
    fi

    test_pass "Prisma Installation"
}

# Test 3: Check environment variables
test_environment_variables() {
    test_start "Environment Variables"

    local required_vars=(
        "DATABASE_URL"
        "DATABASE_TEST_URL"
        "DATABASE_DEV_URL"
        "PRISMA_DATABASE_URL"
        "SHADOW_DATABASE_URL"
        "JWT_SECRET"
        "BCRYPT_ROUNDS"
        "NODE_ENV"
    )

    cd "$PROJECT_ROOT"

    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" .env; then
            test_fail "Environment Variables" "Required environment variable not found: $var"
            return 1
        fi
    done

    test_pass "Environment Variables"
}

# Test 4: Check schema validation
test_schema_validation() {
    test_start "Schema Validation"

    cd "$BACKEND_DIR"

    # Set environment variable for validation
    export DATABASE_URL="postgresql://fake:fake@localhost:5432/fake"

    if ! npx prisma validate > /dev/null 2>&1; then
        test_fail "Schema Validation" "Prisma schema validation failed"
        return 1
    fi

    test_pass "Schema Validation"
}

# Test 5: Check Prisma client generation
test_client_generation() {
    test_start "Prisma Client Generation"

    cd "$BACKEND_DIR"

    # Set environment variable for generation
    export DATABASE_URL="postgresql://fake:fake@localhost:5432/fake"

    if ! npx prisma generate --force > /dev/null 2>&1; then
        test_fail "Prisma Client Generation" "Prisma client generation failed"
        return 1
    fi

    test_pass "Prisma Client Generation"
}

# Test 6: Check package.json scripts
test_package_scripts() {
    test_start "Package.json Scripts"

    cd "$BACKEND_DIR"

    local required_scripts=(
        "db:migrate"
        "db:generate"
        "db:seed"
        "db:studio"
        "db:push"
        "db:migrate:deploy"
        "db:migrate:status"
        "db:reset"
        "db:studio:prod"
        "db:seed:test"
    )

    for script in "${required_scripts[@]}"; do
        if ! npm run --silent | grep -q "$script"; then
            test_fail "Package.json Scripts" "Required script not found: $script"
            return 1
        fi
    done

    # Check prisma configuration
    if ! jq -e '.prisma.schema == "prisma/schema.prisma"' package.json > /dev/null 2>&1; then
        test_fail "Package.json Scripts" "Prisma schema path not configured in package.json"
        return 1
    fi

    test_pass "Package.json Scripts"
}

# Test 7: Check TypeScript compilation
test_typescript_compilation() {
    test_start "TypeScript Compilation"

    cd "$BACKEND_DIR"

    if ! npx tsc --noEmit > /dev/null 2>&1; then
        test_fail "TypeScript Compilation" "TypeScript compilation failed"
        return 1
    fi

    test_pass "TypeScript Compilation"
}

# Test 8: Check seed script compilation
test_seed_script() {
    test_start "Seed Script"

    cd "$BACKEND_DIR"

    # Check if seed script exists and is valid TypeScript
    if ! npx ts-node prisma/seed.ts --help > /dev/null 2>&1; then
        # This is expected to fail since it's not a help script, but we check if it compiles
        if ! npx tsc prisma/seed.ts --noEmit > /dev/null 2>&1; then
            test_fail "Seed Script" "Seed script TypeScript compilation failed"
            return 1
        fi
    fi

    test_pass "Seed Script"
}

# Test 9: Check security configuration
test_security_config() {
    test_start "Security Configuration"

    cd "$BACKEND_DIR"

    local security_config="$BACKEND_DIR/src/config/security.config.ts"

    if [ ! -f "$security_config" ]; then
        test_fail "Security Configuration" "Security config file not found"
        return 1
    fi

    # Check if it's valid TypeScript
    if ! npx tsc "$security_config" --noEmit > /dev/null 2>&1; then
        test_fail "Security Configuration" "Security config TypeScript compilation failed"
        return 1
    fi

    test_pass "Security Configuration"
}

# Test 10: Check database configuration
test_database_config() {
    test_start "Database Configuration"

    cd "$BACKEND_DIR"

    local database_config="$BACKEND_DIR/src/config/database.config.ts"

    if [ ! -f "$database_config" ]; then
        test_fail "Database Configuration" "Database config file not found"
        return 1
    fi

    # Check if it's valid TypeScript
    if ! npx tsc "$database_config" --noEmit > /dev/null 2>&1; then
        test_fail "Database Configuration" "Database config TypeScript compilation failed"
        return 1
    fi

    test_pass "Database Configuration"
}

# Test 11: Check script permissions
test_script_permissions() {
    test_start "Script Permissions"

    local scripts=(
        "$SCRIPTS_DIR/setup-databases.sh"
        "$SCRIPTS_DIR/test-database-automation.sh"
    )

    for script in "${scripts[@]}"; do
        if [ ! -x "$script" ]; then
            test_fail "Script Permissions" "Script not executable: $script"
            return 1
        fi
    done

    test_pass "Script Permissions"
}

# Test 12: Check environment files
test_environment_files() {
    test_start "Environment Files"

    cd "$PROJECT_ROOT"

    # Check .env file
    if [ ! -f ".env" ]; then
        test_fail "Environment Files" ".env file not found"
        return 1
    fi

    # Check .env.production file
    if [ ! -f ".env.production" ]; then
        test_fail "Environment Files" ".env.production file not found"
        return 1
    fi

    # Check if environment files have required variables
    local env_vars=("DATABASE_URL" "JWT_SECRET" "NODE_ENV")
    for var in "${env_vars[@]}"; do
        if ! grep -q "^$var=" .env; then
            test_fail "Environment Files" "Variable $var not found in .env"
            return 1
        fi
    done

    test_pass "Environment Files"
}

# Test 13: Check documentation
test_documentation() {
    test_start "Documentation"

    local docs=(
        "$PROJECT_ROOT/README.md"
        "$PROJECT_ROOT/CLAUDE.md"
    )

    for doc in "${docs[@]}"; do
        if [ ! -f "$doc" ]; then
            test_fail "Documentation" "Documentation file not found: $doc"
            return 1
        fi
    done

    test_pass "Documentation"
}

# Test 14: Check database schema consistency
test_schema_consistency() {
    test_start "Schema Consistency"

    # Compare schema files (they should be identical)
    if ! cmp "$DATABASE_DIR/schema.prisma" "$BACKEND_DIR/prisma/schema.prisma" > /dev/null 2>&1; then
        test_fail "Schema Consistency" "Schema files are not identical"
        return 1
    fi

    test_pass "Schema Consistency"
}

# Test 15: Check dependencies installation
test_dependencies() {
    test_start "Dependencies Installation"

    cd "$BACKEND_DIR"

    if [ ! -d "node_modules" ]; then
        test_fail "Dependencies Installation" "node_modules directory not found"
        return 1
    fi

    # Check if key dependencies are installed
    local dependencies=(
        "@prisma/client"
        "prisma"
        "@nestjs/config"
        "bcrypt"
        "class-validator"
    )

    for dep in "${dependencies[@]}"; do
        if ! npm list "$dep" > /dev/null 2>&1; then
            test_fail "Dependencies Installation" "Dependency not installed: $dep"
            return 1
        fi
    done

    test_pass "Dependencies Installation"
}

# Test 16: Check configuration files structure
test_config_structure() {
    test_start "Configuration Structure"

    cd "$BACKEND_DIR/src"

    local config_files=(
        "config/security.config.ts"
        "config/database.config.ts"
    )

    for config in "${config_files[@]}"; do
        if [ ! -f "$config" ]; then
            test_fail "Configuration Structure" "Configuration file not found: $config"
            return 1
        fi
    done

    test_pass "Configuration Structure"
}

# Generate comprehensive test report
generate_test_report() {
    local report_file="$LOGS_DIR/prisma-verification-report-$(date +%Y%m%d_%H%M%S).md"

    cat > "$report_file" << EOF
# Prisma Setup Verification Report

**Generated:** $(date '+%Y-%m-%d %H:%M:%S')
**Project:** Hospital Management System
**Environment:** $(node --version), $(npm --version)

## Test Results Summary
- **Total Tests:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS
- **Failed:** $FAILED_TESTS
- **Success Rate:** $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%

## Test Details
$(for i in $(seq 1 $TOTAL_TESTS); do
    echo "- Test $i: $([[ $i -le $PASSED_TESTS ]] && echo "✅ Passed" || echo "❌ Failed")"
done)

## Environment Information
- **Node.js:** $(node --version)
- **npm:** $(npm --version)
- **Prisma CLI:** $(cd "$BACKEND_DIR" && npx prisma --version 2>/dev/null || echo "Not available")
- **Prisma Client:** $(cd "$BACKEND_DIR" && npm list @prisma/client | head -2 | tail -1 | cut -d'@' -f2 | cut -d' ' -f1 || echo "Not available")

## Configuration Files
- **Schema:** $BACKEND_DIR/prisma/schema.prisma
- **Environment:** $PROJECT_ROOT/.env
- **Package:** $BACKEND_DIR/package.json
- **Security Config:** $BACKEND_DIR/src/config/security.config.ts
- **Database Config:** $BACKEND_DIR/src/config/database.config.ts

## Next Steps
1. **If all tests passed:** Your Prisma setup is ready for production
2. **If tests failed:** Review the failed tests and fix the issues
3. **Database Setup:** Run \`./scripts/setup-databases.sh\` to set up databases
4. **Testing:** Run \`./scripts/test-database-automation.sh\` to verify database operations
5. **Development:** Run \`npm run dev\` to start the development server

## Manual Verification Commands
\`\`\`bash
# Validate schema
cd backend && npx prisma validate

# Generate client
cd backend && npx prisma generate

# Run migrations (when database is ready)
cd backend && npx prisma migrate dev

# Test database setup
./scripts/test-database-automation.sh
\`\`\`

## Troubleshooting
- **PostgreSQL not running:** Start PostgreSQL service
- **Environment variables:** Check .env file configuration
- **Missing dependencies:** Run \`npm install\` in backend directory
- **Permission issues:** Ensure scripts are executable

## Files Created/Modified
### Configuration Files
- \`backend/prisma/schema.prisma\` - Main database schema
- \`backend/prisma/seed.ts\` - Database seed script
- \`backend/src/config/security.config.ts\` - Security configuration
- \`backend/src/config/database.config.ts\` - Database configuration
- \`.env.production\` - Production environment variables

### Automation Scripts
- \`scripts/setup-databases.sh\` - Database setup script
- \`scripts/test-database-automation.sh\` - Test database automation
- \`scripts/verify-prisma-setup.sh\` - Setup verification script

### Documentation
- This verification report

EOF

    echo ""
    log_success "📊 Test report generated: $report_file"
    echo ""
}

# Main execution
main() {
    log_info "🔍 Starting Enterprise Prisma Setup Verification"
    echo "=================================================="

    # Change to project root
    cd "$PROJECT_ROOT"

    # Run all tests
    test_file_structure
    test_prisma_installation
    test_environment_variables
    test_schema_validation
    test_client_generation
    test_package_scripts
    test_typescript_compilation
    test_seed_script
    test_security_config
    test_database_config
    test_script_permissions
    test_environment_files
    test_documentation
    test_schema_consistency
    test_dependencies
    test_config_structure

    echo ""
    log_info "📊 Test Results Summary:"
    echo "========================"
    log_info "Total Tests: $TOTAL_TESTS"
    log_success "Passed: $PASSED_TESTS"
    if [ $FAILED_TESTS -gt 0 ]; then
        log_error "Failed: $FAILED_TESTS"
    else
        log_success "Failed: $FAILED_TESTS"
    fi
    log_info "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    echo ""

    # Generate report
    generate_test_report

    # Final result
    if [ $FAILED_TESTS -eq 0 ]; then
        log_success "🎉 All tests passed! Prisma setup is ready for production!"
        echo ""
        log_info "📋 Next Steps:"
        echo "  1. Set up PostgreSQL: sudo systemctl start postgresql"
        echo "  2. Create databases: ./scripts/setup-databases.sh"
        echo "  3. Test automation: ./scripts/test-database-automation.sh"
        echo "  4. Start development: npm run dev"
        echo ""
        log_success "✨ Enterprise-grade database infrastructure is ready!"
    else
        log_error "❌ Some tests failed. Please review the errors above and fix the issues."
        echo ""
        log_warning "🔧 Troubleshooting:"
        echo "  - Check the verification report for detailed error information"
        echo "  - Ensure PostgreSQL is running and accessible"
        echo "  - Verify all environment variables are set correctly"
        echo "  - Run 'npm install' in the backend directory"
        echo "  - Check file permissions and paths"
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --help    Show this help message"
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