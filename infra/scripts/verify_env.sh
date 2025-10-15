#!/bin/bash
set -euo pipefail

readonly REQUIRED_VARS=(
    "DATABASE_URL"
    "SECRET_KEY"
    "CORS_ORIGINS"
    "REDIS_URL"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_FOLDER"
    "CLOUDINARY_BASE"
    "NOTIF_WINDOW_SECONDS"
    "NOTIF_SUPPRESS_MINUTES"
    "NOTIF_WORKER_POLL_MS"
    "RESEND_API_KEY"
    "FROM_EMAIL"
    "FROM_NAME"
    "FRONTEND_URL"
    "ENVIRONMENT"
)

readonly OPTIONAL_VARS=(
    "EMAIL_ENABLED"
    "MAX_TRIES"
    "WAIT_SECONDS"
)

ERRORS=0
WARNINGS=0

log_success() {
    echo "✓ $1"
}

log_error() {
    echo "✗ $1" >&2
    ERRORS=$((ERRORS + 1))
}

log_warning() {
    echo "⚠ $1"
    WARNINGS=$((WARNINGS + 1))
}

check_var() {
    local var_name=$1
    local required=${2:-true}

    if [ -z "${!var_name:-}" ]; then
        if [ "$required" = true ]; then
            log_error "Missing required variable: $var_name"
        else
            log_warning "Optional variable not set: $var_name"
        fi
        return 1
    fi

    log_success "$var_name is configured"
    return 0
}

validate_database_url() {
    if [[ -n "${DATABASE_URL:-}" ]]; then
        if [[ ! "$DATABASE_URL" =~ ^postgresql(\+asyncpg)?:// ]]; then
            log_error "DATABASE_URL must use postgresql:// or postgresql+asyncpg://"
        elif [[ ! "$DATABASE_URL" =~ asyncpg ]]; then
            log_warning "DATABASE_URL should use asyncpg driver for async support"
        fi
    fi
}

validate_redis_url() {
    if [[ -n "${REDIS_URL:-}" ]]; then
        if [[ ! "$REDIS_URL" =~ ^redis:// ]]; then
            log_error "REDIS_URL must start with redis://"
        fi
    fi
}

validate_secret_key() {
    if [[ -n "${SECRET_KEY:-}" ]]; then
        if [ ${#SECRET_KEY} -lt 32 ]; then
            log_error "SECRET_KEY must be at least 32 characters (current: ${#SECRET_KEY})"
        fi
    fi
}

validate_cors_origins() {
    if [[ -n "${CORS_ORIGINS:-}" ]]; then
        IFS=',' read -ra ORIGINS <<< "$CORS_ORIGINS"
        for origin in "${ORIGINS[@]}"; do
            origin=$(echo "$origin" | xargs)
            if [[ ! "$origin" =~ ^https?:// ]]; then
                log_warning "CORS origin should use http:// or https://: $origin"
            fi
        done
    fi
}

validate_email() {
    if [[ -n "${FROM_EMAIL:-}" ]]; then
        if [[ ! "$FROM_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            log_error "FROM_EMAIL format is invalid"
        fi
    fi
}

validate_environment() {
    if [[ -n "${ENVIRONMENT:-}" ]]; then
        if [[ ! "$ENVIRONMENT" =~ ^(development|production|staging|test)$ ]]; then
            log_warning "ENVIRONMENT should be: development, production, staging, or test"
        fi
    fi
}

validate_numeric() {
    local var_name=$1
    if [[ -n "${!var_name:-}" ]] && ! [[ "${!var_name}" =~ ^[0-9]+$ ]]; then
        log_error "$var_name must be numeric"
    fi
}

main() {
    echo "Environment Verification"
    echo "========================"
    echo ""

    echo "Required Variables:"
    for var in "${REQUIRED_VARS[@]}"; do
        check_var "$var" true
    done
    echo ""

    echo "Optional Variables:"
    for var in "${OPTIONAL_VARS[@]}"; do
        check_var "$var" false
    done
    echo ""

    echo "Validation:"
    validate_database_url
    validate_redis_url
    validate_secret_key
    validate_cors_origins
    validate_email
    validate_environment
    validate_numeric "NOTIF_WINDOW_SECONDS"
    validate_numeric "NOTIF_SUPPRESS_MINUTES"
    validate_numeric "NOTIF_WORKER_POLL_MS"
    echo ""

    echo "Summary"
    echo "======="
    if [ $ERRORS -gt 0 ]; then
        echo "Errors: $ERRORS"
    fi
    if [ $WARNINGS -gt 0 ]; then
        echo "Warnings: $WARNINGS"
    fi

    if [ $ERRORS -eq 0 ]; then
        if [ $WARNINGS -eq 0 ]; then
            echo "Status: All checks passed"
        else
            echo "Status: Passed with warnings"
        fi
        exit 0
    else
        echo "Status: Failed - fix errors before deploying"
        exit 1
    fi
}

main "$@"
