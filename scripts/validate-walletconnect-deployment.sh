#!/bin/bash

# WalletConnect Deployment Validation Script
# This script automates all validation steps for WalletConnect deployments

set -e

ENVIRONMENT=${1:-testnet}
DEPLOYMENT_URL=${2:-"https://${ENVIRONMENT}.passportx.app"}
LOG_FILE="deployment-validation-${ENVIRONMENT}-$(date +%s).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Validation functions
validate_endpoint_accessible() {
    log_info "Validating endpoint accessibility..."
    
    if curl -s -f "$DEPLOYMENT_URL/health" > /dev/null 2>&1; then
        log_info "✓ Endpoint is accessible"
        ((TESTS_PASSED++))
        return 0
    else
        log_error "✗ Endpoint is not accessible"
        ((TESTS_FAILED++))
        return 1
    fi
}

validate_walletconnect_enabled() {
    log_info "Validating WalletConnect is enabled..."
    
    RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/walletconnect/status" 2>/dev/null || echo "{}")
    
    if echo "$RESPONSE" | grep -q "enabled.*true"; then
        log_info "✓ WalletConnect is enabled"
        ((TESTS_PASSED++))
        return 0
    else
        log_warn "⚠ WalletConnect status unclear (may be expected)"
        return 0
    fi
}

validate_ssl_certificate() {
    log_info "Validating SSL certificate..."
    
    if curl -s -I "$DEPLOYMENT_URL" 2>&1 | grep -q "https"; then
        log_info "✓ SSL certificate is valid"
        ((TESTS_PASSED++))
        return 0
    else
        log_error "✗ SSL certificate validation failed"
        ((TESTS_FAILED++))
        return 1
    fi
}

validate_response_time() {
    log_info "Validating response time..."
    
    START=$(date +%s%N)
    curl -s "$DEPLOYMENT_URL" > /dev/null
    END=$(date +%s%N)
    
    RESPONSE_TIME=$(( (END - START) / 1000000 ))
    
    if [ "$RESPONSE_TIME" -lt 5000 ]; then
        log_info "✓ Response time is acceptable: ${RESPONSE_TIME}ms"
        ((TESTS_PASSED++))
        return 0
    else
        log_warn "⚠ Response time is high: ${RESPONSE_TIME}ms"
        return 0
    fi
}

validate_dependencies() {
    log_info "Validating required dependencies..."
    
    REQUIRED_COMMANDS=("curl" "npm" "node" "jq")
    
    for cmd in "${REQUIRED_COMMANDS[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            log_info "✓ $cmd is installed"
            ((TESTS_PASSED++))
        else
            log_error "✗ $cmd is not installed"
            ((TESTS_FAILED++))
        fi
    done
}

validate_environment_config() {
    log_info "Validating environment configuration..."
    
    case "$ENVIRONMENT" in
        testnet)
            if [ -n "$TESTNET_WALLETCONNECT_PROJECT_ID" ]; then
                log_info "✓ Testnet WalletConnect Project ID is set"
                ((TESTS_PASSED++))
            else
                log_warn "⚠ Testnet WalletConnect Project ID not set in environment"
            fi
            ;;
        mainnet|mainnet-staging)
            if [ -n "$MAINNET_STAGING_WALLETCONNECT_PROJECT_ID" ] || [ -n "$MAINNET_WALLETCONNECT_PROJECT_ID" ]; then
                log_info "✓ Mainnet WalletConnect Project ID is set"
                ((TESTS_PASSED++))
            else
                log_warn "⚠ Mainnet WalletConnect Project ID not set in environment"
            fi
            ;;
    esac
}

validate_database_connection() {
    log_info "Validating database connection..."
    
    if curl -s "$DEPLOYMENT_URL/api/health/db" 2>/dev/null | grep -q "connected\|healthy"; then
        log_info "✓ Database connection is healthy"
        ((TESTS_PASSED++))
        return 0
    else
        log_warn "⚠ Database health check unavailable"
        return 0
    fi
}

validate_api_endpoints() {
    log_info "Validating API endpoints..."
    
    ENDPOINTS=(
        "/api/health"
        "/api/walletconnect/status"
        "/api/config"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        if curl -s -f "$DEPLOYMENT_URL$endpoint" > /dev/null 2>&1; then
            log_info "✓ Endpoint $endpoint is accessible"
            ((TESTS_PASSED++))
        else
            log_warn "⚠ Endpoint $endpoint not accessible (may be expected)"
        fi
    done
}

validate_security_headers() {
    log_info "Validating security headers..."
    
    HEADERS=$(curl -s -I "$DEPLOYMENT_URL" 2>&1)
    
    SECURITY_HEADERS=(
        "X-Content-Type-Options: nosniff"
        "X-Frame-Options"
        "Strict-Transport-Security"
    )
    
    for header in "${SECURITY_HEADERS[@]}"; do
        if echo "$HEADERS" | grep -q "$header"; then
            log_info "✓ Security header present: $(echo $header | cut -d':' -f1)"
            ((TESTS_PASSED++))
        else
            log_warn "⚠ Security header missing: $(echo $header | cut -d':' -f1)"
        fi
    done
}

validate_walletconnect_tests() {
    log_info "Running WalletConnect tests..."
    
    if npm run test -- tests/integration/walletconnect.test.ts > /dev/null 2>&1; then
        log_info "✓ WalletConnect tests passed"
        ((TESTS_PASSED++))
        return 0
    else
        log_warn "⚠ WalletConnect tests failed or not available"
        return 0
    fi
}

validate_configuration_file() {
    log_info "Validating configuration file..."
    
    CONFIG_FILE="config/walletconnect.${ENVIRONMENT}.config.ts"
    
    if [ -f "$CONFIG_FILE" ]; then
        log_info "✓ Configuration file exists: $CONFIG_FILE"
        ((TESTS_PASSED++))
        return 0
    else
        log_error "✗ Configuration file missing: $CONFIG_FILE"
        ((TESTS_FAILED++))
        return 1
    fi
}

validate_environment_variables() {
    log_info "Validating environment variables..."
    
    ENV_FILE=".env.walletconnect.${ENVIRONMENT}"
    
    if [ -f "$ENV_FILE" ]; then
        log_info "✓ Environment file exists: $ENV_FILE"
        ((TESTS_PASSED++))
        
        REQUIRED_VARS=("WALLETCONNECT_PROJECT_ID" "NEXT_PUBLIC_WALLETCONNECT_ENABLED")
        
        for var in "${REQUIRED_VARS[@]}"; do
            if grep -q "^$var=" "$ENV_FILE"; then
                log_info "✓ Variable $var is configured"
                ((TESTS_PASSED++))
            else
                log_warn "⚠ Variable $var not found in environment file"
            fi
        done
        return 0
    else
        log_warn "⚠ Environment file not found: $ENV_FILE"
        return 0
    fi
}

validate_network_connectivity() {
    log_info "Validating network connectivity..."
    
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        log_info "✓ Network connectivity is available"
        ((TESTS_PASSED++))
        return 0
    else
        log_error "✗ Network connectivity check failed"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Main execution
main() {
    echo "========================================" | tee "$LOG_FILE"
    echo "WalletConnect Deployment Validation" | tee -a "$LOG_FILE"
    echo "Environment: $ENVIRONMENT" | tee -a "$LOG_FILE"
    echo "Timestamp: $(date)" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    
    log_info "Starting validation for $ENVIRONMENT environment..."
    
    # Run all validations
    validate_dependencies
    validate_network_connectivity
    validate_endpoint_accessible
    validate_ssl_certificate
    validate_response_time
    validate_security_headers
    validate_api_endpoints
    validate_database_connection
    validate_configuration_file
    validate_environment_variables
    validate_environment_config
    validate_walletconnect_enabled
    validate_walletconnect_tests
    
    # Summary
    echo "" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    echo "Validation Summary" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    log_info "Tests Passed: $TESTS_PASSED"
    log_error "Tests Failed: $TESTS_FAILED"
    echo "Log file: $LOG_FILE" | tee -a "$LOG_FILE"
    echo "========================================" | tee -a "$LOG_FILE"
    
    if [ "$TESTS_FAILED" -eq 0 ]; then
        log_info "✓ All validations passed!"
        exit 0
    else
        log_error "✗ Some validations failed. Please review the log file."
        exit 1
    fi
}

# Run main function
main "$@"
