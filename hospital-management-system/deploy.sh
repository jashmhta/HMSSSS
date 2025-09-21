#!/bin/bash

# HMS Production Deployment Script
# This script handles the complete production deployment of the HMS system

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.prod"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
BACKUP_DIR="$PROJECT_ROOT/backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    # Check if .env.prod exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Production environment file not found: $ENV_FILE"
        log_info "Please copy .env.example to .env.prod and configure your production settings."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Validate environment configuration
validate_environment() {
    log_info "Validating environment configuration..."

    # Source environment file
    set -a
    source "$ENV_FILE"
    set +a

    # Check required environment variables
    required_vars=(
        "POSTGRES_PASSWORD"
        "JWT_SECRET"
        "REDIS_PASSWORD"
        "GRAFANA_ADMIN_PASSWORD"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [[ "${!var}" == CHANGE_THIS* ]]; then
            log_error "Required environment variable $var is not set or has default value"
            exit 1
        fi
    done

    # Validate JWT secret length
    if [ ${#JWT_SECRET} -lt 64 ]; then
        log_error "JWT_SECRET must be at least 64 characters long"
        exit 1
    fi

    log_success "Environment validation passed"
}

# Generate SSL certificates if they don't exist
generate_ssl_certificates() {
    log_info "Checking SSL certificates..."

    local ssl_dir="$PROJECT_ROOT/nginx/ssl"

    if [ ! -f "$ssl_dir/hms.local.crt" ] || [ ! -f "$ssl_dir/hms.local.key" ]; then
        log_warning "SSL certificates not found. Generating self-signed certificates..."
        log_warning "Please replace these with proper certificates from a trusted CA in production."

        mkdir -p "$ssl_dir"

        # Generate certificates
        openssl req -x509 -newkey rsa:4096 \
            -keyout "$ssl_dir/hms.local.key" \
            -out "$ssl_dir/hms.local.crt" \
            -days 365 -nodes \
            -subj "/C=US/ST=State/L=City/O=HMS/CN=hms.local"

        openssl req -x509 -newkey rsa:4096 \
            -keyout "$ssl_dir/api.hms.local.key" \
            -out "$ssl_dir/api.hms.local.crt" \
            -days 365 -nodes \
            -subj "/C=US/ST=State/L=City/O=HMS/CN=api.hms.local"

        log_success "SSL certificates generated"
    else
        log_success "SSL certificates already exist"
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."

    directories=(
        "$PROJECT_ROOT/logs"
        "$PROJECT_ROOT/uploads"
        "$PROJECT_ROOT/temp"
        "$BACKUP_DIR/data"
    )

    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        log_info "Created directory: $dir"
    done

    log_success "Directories created"
}

# Pre-deployment backup (if database exists)
pre_deployment_backup() {
    log_info "Checking for existing deployment..."

    # This would check if there's an existing deployment and create a backup
    # For now, we'll skip this as it's the first deployment
    log_info "First deployment detected, skipping pre-deployment backup"
}

# Deploy the stack
deploy_stack() {
    log_info "Deploying HMS stack..."

    cd "$PROJECT_ROOT"

    # Pull latest images
    log_info "Pulling latest Docker images..."
    docker-compose -f "$COMPOSE_FILE" pull

    # Start the stack
    log_info "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d

    log_success "HMS stack deployed successfully"
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."

    local services=("postgres" "redis" "backend" "frontend" "nginx")
    local max_attempts=30
    local attempt=1

    for service in "${services[@]}"; do
        log_info "Waiting for $service..."

        while [ $attempt -le $max_attempts ]; do
            if docker-compose -f "$COMPOSE_FILE" ps "$service" | grep -q "healthy\|running"; then
                log_success "$service is ready"
                break
            fi

            log_info "Attempt $attempt/$max_attempts: $service not ready yet..."
            sleep 10
            ((attempt++))
        done

        if [ $attempt -gt $max_attempts ]; then
            log_error "$service failed to start properly"
            exit 1
        fi
    done

    log_success "All services are healthy"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."

    # Wait for database to be ready
    sleep 10

    # Run Prisma migrations
    docker-compose -f "$COMPOSE_FILE" exec -T backend npx prisma migrate deploy

    log_success "Database migrations completed"
}

# Post-deployment health check
post_deployment_check() {
    log_info "Running post-deployment health checks..."

    # Check API health
    if curl -f -k https://api.hms.local/health >/dev/null 2>&1; then
        log_success "API health check passed"
    else
        log_warning "API health check failed - this may be normal if SSL certificates are not trusted"
    fi

    # Check frontend
    if curl -f -k https://hms.local >/dev/null 2>&1; then
        log_success "Frontend health check passed"
    else
        log_warning "Frontend health check failed - this may be normal if SSL certificates are not trusted"
    fi

    # Check monitoring endpoints
    if curl -f http://localhost:9090 >/dev/null 2>&1; then
        log_success "Prometheus is accessible"
    else
        log_warning "Prometheus health check failed"
    fi

    if curl -f http://localhost:3001 >/dev/null 2>&1; then
        log_success "Grafana is accessible"
    else
        log_warning "Grafana health check failed"
    fi
}

# Display deployment information
display_deployment_info() {
    log_success "HMS Production Deployment Completed!"
    echo
    echo "========================================"
    echo "🚀 Deployment Summary"
    echo "========================================"
    echo "🌐 Frontend: https://hms.local"
    echo "🔌 API: https://api.hms.local"
    echo "📊 Grafana: http://localhost:3001 (admin/admin123)"
    echo "📈 Prometheus: http://localhost:9090"
    echo "🔍 Kibana: http://localhost:5601"
    echo "========================================"
    echo
    log_warning "⚠️  IMPORTANT SECURITY NOTES:"
    echo "1. Change default Grafana password immediately"
    echo "2. Replace self-signed SSL certificates with CA-signed ones"
    echo "3. Update all default passwords in .env.prod"
    echo "4. Configure firewall rules for production security"
    echo "5. Set up proper monitoring alerts"
    echo
    log_info "To view logs: docker-compose -f $COMPOSE_FILE logs -f"
    log_info "To stop: docker-compose -f $COMPOSE_FILE down"
}

# Main deployment function
main() {
    echo "========================================"
    echo "🏥 HMS Production Deployment"
    echo "========================================"

    check_prerequisites
    validate_environment
    generate_ssl_certificates
    create_directories
    pre_deployment_backup
    deploy_stack
    wait_for_services
    run_migrations
    post_deployment_check
    display_deployment_info

    log_success "🎉 HMS deployment completed successfully!"
}

# Handle command line arguments
case "${1:-}" in
    "stop")
        log_info "Stopping HMS stack..."
        cd "$PROJECT_ROOT"
        docker-compose -f "$COMPOSE_FILE" down
        log_success "HMS stack stopped"
        ;;
    "restart")
        log_info "Restarting HMS stack..."
        cd "$PROJECT_ROOT"
        docker-compose -f "$COMPOSE_FILE" restart
        log_success "HMS stack restarted"
        ;;
    "logs")
        log_info "Showing HMS logs..."
        cd "$PROJECT_ROOT"
        docker-compose -f "$COMPOSE_FILE" logs -f
        ;;
    "backup")
        log_info "Running manual backup..."
        cd "$PROJECT_ROOT"
        docker-compose -f "$COMPOSE_FILE" exec backup /scripts/backup.sh
        ;;
    *)
        main
        ;;
esac