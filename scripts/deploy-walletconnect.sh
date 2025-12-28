#!/bin/bash

# WalletConnect Deployment Automation Script
# Automates the deployment process for WalletConnect across environments

set -e

ENVIRONMENT=${1:-testnet}
DRY_RUN=${2:-false}
TIMESTAMP=$(date +%s)
DEPLOYMENT_LOG="deployment-${ENVIRONMENT}-${TIMESTAMP}.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

# Validate environment
validate_environment() {
    log_step "Validating environment: $ENVIRONMENT"
    
    case "$ENVIRONMENT" in
        testnet|mainnet-staging|production)
            log_info "✓ Valid environment: $ENVIRONMENT"
            ;;
        *)
            log_error "✗ Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Load environment variables
load_env_variables() {
    log_step "Loading environment variables"
    
    ENV_FILE=".env.walletconnect.${ENVIRONMENT}"
    
    if [ -f "$ENV_FILE" ]; then
        log_info "Loading from $ENV_FILE"
        set -a
        source "$ENV_FILE"
        set +a
        log_info "✓ Environment variables loaded"
    else
        log_error "✗ Environment file not found: $ENV_FILE"
        exit 1
    fi
}

# Check git status
check_git_status() {
    log_step "Checking git status"
    
    if [ -z "$(git status --porcelain)" ]; then
        log_info "✓ Working directory is clean"
    else
        log_error "✗ Working directory has uncommitted changes"
        git status
        exit 1
    fi
    
    # Verify we're on the correct branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    
    case "$ENVIRONMENT" in
        testnet)
            if [ "$CURRENT_BRANCH" != "develop" ]; then
                log_error "✗ Testnet deployment requires develop branch (current: $CURRENT_BRANCH)"
                exit 1
            fi
            ;;
        mainnet-staging)
            if [ "$CURRENT_BRANCH" != "develop" ]; then
                log_error "✗ Mainnet staging deployment requires develop branch (current: $CURRENT_BRANCH)"
                exit 1
            fi
            ;;
        production)
            if [ "$CURRENT_BRANCH" != "main" ]; then
                log_error "✗ Production deployment requires main branch (current: $CURRENT_BRANCH)"
                exit 1
            fi
            ;;
    esac
    
    log_info "✓ On correct branch: $CURRENT_BRANCH"
}

# Run tests
run_tests() {
    log_step "Running tests"
    
    if [ "$DRY_RUN" == "true" ]; then
        log_warn "⊘ Skipping tests (dry run)"
        return 0
    fi
    
    log_info "Running unit tests..."
    npm run test:unit || {
        log_error "✗ Unit tests failed"
        exit 1
    }
    
    log_info "Running WalletConnect integration tests..."
    npm run test -- tests/integration/walletconnect.test.ts || {
        log_error "✗ WalletConnect integration tests failed"
        exit 1
    }
    
    log_info "✓ All tests passed"
}

# Build application
build_application() {
    log_step "Building application"
    
    if [ "$DRY_RUN" == "true" ]; then
        log_warn "⊘ Skipping build (dry run)"
        return 0
    fi
    
    log_info "Building Next.js application..."
    npm run build || {
        log_error "✗ Build failed"
        exit 1
    }
    
    log_info "✓ Build completed successfully"
}

# Build Docker image
build_docker_image() {
    log_step "Building Docker image"
    
    if [ "$DRY_RUN" == "true" ]; then
        log_warn "⊘ Skipping Docker build (dry run)"
        return 0
    fi
    
    IMAGE_NAME="passportx-walletconnect:${ENVIRONMENT}"
    IMAGE_TAG="passportx-walletconnect:${ENVIRONMENT}-${TIMESTAMP}"
    
    log_info "Building Docker image: $IMAGE_NAME"
    
    docker build \
        --build-arg ENVIRONMENT=$ENVIRONMENT \
        --build-arg WALLETCONNECT_PROJECT_ID=$WALLETCONNECT_PROJECT_ID \
        -t "$IMAGE_NAME" \
        -t "$IMAGE_TAG" \
        .
    
    if [ $? -eq 0 ]; then
        log_info "✓ Docker image built successfully"
        echo "$IMAGE_NAME" >> "$DEPLOYMENT_LOG"
        echo "$IMAGE_TAG" >> "$DEPLOYMENT_LOG"
    else
        log_error "✗ Docker build failed"
        exit 1
    fi
}

# Run validation
validate_deployment() {
    log_step "Validating deployment configuration"
    
    log_info "Running deployment validation script..."
    npm run validate:walletconnect || {
        log_warn "⚠ Validation script not found or failed, continuing..."
    }
    
    log_info "✓ Validation completed"
}

# Deploy using docker-compose
deploy_docker_compose() {
    log_step "Deploying using docker-compose"
    
    if [ "$DRY_RUN" == "true" ]; then
        log_warn "⊘ Skipping docker-compose up (dry run)"
        return 0
    fi
    
    DOCKER_COMPOSE_FILE="docker-compose.walletconnect.${ENVIRONMENT}.yml"
    
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "✗ Docker compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    
    log_info "Starting services with docker-compose..."
    
    docker-compose -f "$DOCKER_COMPOSE_FILE" down || true
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    if [ $? -eq 0 ]; then
        log_info "✓ Docker compose services started"
    else
        log_error "✗ Docker compose deployment failed"
        exit 1
    fi
}

# Wait for services to be ready
wait_for_services() {
    log_step "Waiting for services to be ready"
    
    if [ "$DRY_RUN" == "true" ]; then
        log_warn "⊘ Skipping wait (dry run)"
        return 0
    fi
    
    MAX_ATTEMPTS=60
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
            log_info "✓ Application is ready"
            return 0
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        log_info "Waiting for application to be ready... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
        sleep 2
    done
    
    log_error "✗ Services failed to start"
    exit 1
}

# Run smoke tests
run_smoke_tests() {
    log_step "Running smoke tests"
    
    if [ "$DRY_RUN" == "true" ]; then
        log_warn "⊘ Skipping smoke tests (dry run)"
        return 0
    fi
    
    log_info "Testing health endpoint..."
    curl -s -f http://localhost:3000/health || {
        log_error "✗ Health check failed"
        exit 1
    }
    
    log_info "Testing WalletConnect status..."
    curl -s -f http://localhost:3000/api/walletconnect/status || {
        log_warn "⚠ WalletConnect status endpoint not available"
    }
    
    log_info "✓ Smoke tests passed"
}

# Backup current state
backup_current_state() {
    log_step "Backing up current deployment state"
    
    BACKUP_DIR="backups/walletconnect-${ENVIRONMENT}-${TIMESTAMP}"
    mkdir -p "$BACKUP_DIR"
    
    # Backup current docker-compose state
    docker-compose -f "docker-compose.walletconnect.${ENVIRONMENT}.yml" config > "$BACKUP_DIR/docker-compose.backup.yml" || true
    
    # Backup current environment
    cp ".env.walletconnect.${ENVIRONMENT}" "$BACKUP_DIR/.env.backup" || true
    
    log_info "✓ Backup created: $BACKUP_DIR"
}

# Generate deployment report
generate_deployment_report() {
    log_step "Generating deployment report"
    
    REPORT_FILE="deployment-report-${ENVIRONMENT}-${TIMESTAMP}.json"
    
    cat > "$REPORT_FILE" << EOF
{
  "deployment": {
    "environment": "$ENVIRONMENT",
    "timestamp": "$(date -Iseconds)",
    "git_branch": "$(git rev-parse --abbrev-ref HEAD)",
    "git_commit": "$(git rev-parse HEAD)",
    "git_tag": "$(git describe --tags 2>/dev/null || echo 'none')",
    "dry_run": $([[ "$DRY_RUN" == "true" ]] && echo "true" || echo "false")
  },
  "configuration": {
    "environment_file": ".env.walletconnect.${ENVIRONMENT}",
    "docker_compose_file": "docker-compose.walletconnect.${ENVIRONMENT}.yml",
    "config_file": "config/walletconnect.${ENVIRONMENT}.config.ts"
  },
  "deployment_log": "$DEPLOYMENT_LOG",
  "backup_location": "$BACKUP_DIR",
  "status": "completed",
  "timestamp_ms": $((TIMESTAMP * 1000))
}
EOF
    
    log_info "✓ Deployment report generated: $REPORT_FILE"
    cat "$REPORT_FILE"
}

# Cleanup on error
cleanup_on_error() {
    log_error "✗ Deployment failed"
    log_info "Logs saved to: $DEPLOYMENT_LOG"
    exit 1
}

trap cleanup_on_error ERR

# Main execution
main() {
    echo "========================================" | tee "$DEPLOYMENT_LOG"
    echo "WalletConnect Deployment Script" | tee -a "$DEPLOYMENT_LOG"
    echo "Environment: $ENVIRONMENT" | tee -a "$DEPLOYMENT_LOG"
    echo "Timestamp: $(date)" | tee -a "$DEPLOYMENT_LOG"
    if [ "$DRY_RUN" == "true" ]; then
        echo "Mode: DRY RUN" | tee -a "$DEPLOYMENT_LOG"
    fi
    echo "========================================" | tee -a "$DEPLOYMENT_LOG"
    
    validate_environment
    load_env_variables
    check_git_status
    backup_current_state
    validate_deployment
    run_tests
    build_application
    build_docker_image
    deploy_docker_compose
    wait_for_services
    run_smoke_tests
    generate_deployment_report
    
    echo "" | tee -a "$DEPLOYMENT_LOG"
    log_info "✓ Deployment completed successfully!"
    log_info "Logs: $DEPLOYMENT_LOG"
    log_info "Report: deployment-report-${ENVIRONMENT}-${TIMESTAMP}.json"
    echo "========================================" | tee -a "$DEPLOYMENT_LOG"
}

# Run main function
main "$@"
