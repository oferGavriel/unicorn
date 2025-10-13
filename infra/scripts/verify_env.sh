#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════
# Environment Variables Verification Script
# Ensures all required environment variables are set
# ═══════════════════════════════════════════════════════════

COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

ERRORS=0
WARNINGS=0

log_success() {
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} $1"
}

log_error() {
    echo -e "${COLOR_RED}✗${COLOR_RESET} $1"
    ERRORS=$((ERRORS + 1))
}

log_warning() {
    echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} $1"
    WARNINGS=$((WARNINGS + 1))
}

log_info() {
    echo -e "${COLOR_BLUE}ℹ${COLOR_RESET} $1"
}

check_var() {
    local var_name=$1
    local required=${2:-true}
    local secret=${3:-false}

    if [ -z "${!var_name:-}" ]; then
        if [ "$required" = true ]; then
            log_error "Missing required variable: $var_name"
        else
            log_warning "Optional variable not set: $var_name"
        fi
        return 1
    else
        if [ "$secret" = true ]; then
            log_success "$var_name is set (value hidden)"
        else
            log_success "$var_name = ${!var_name}"
        fi
        return 0
    fi
}

echo "═══════════════════════════════════════════════════════════"
echo "  Environment Variables Verification"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════
# Core Database Variables
# ═══════════════════════════════════════════════════════════
echo "📊 Database Configuration:"
check_var "DATABASE_URL" true true

# Validate DATABASE_URL format
if [[ -n "${DATABASE_URL:-}" ]]; then
    if [[ ! "$DATABASE_URL" =~ ^postgresql(\+asyncpg)?:// ]]; then
        log_error "DATABASE_URL must start with 'postgresql://' or 'postgresql+asyncpg://'"
    elif [[ "$DATABASE_URL" =~ asyncpg ]]; then
        log_success "DATABASE_URL uses asyncpg driver (correct for FastAPI)"
    else
        log_warning "DATABASE_URL doesn't specify asyncpg driver (should be postgresql+asyncpg://...)"
    fi
fi

echo ""

# ═══════════════════════════════════════════════════════════
# Redis Configuration
# ═══════════════════════════════════════════════════════════
echo "🔴 Redis Configuration:"
check_var "REDIS_URL" true false

# Validate REDIS_URL format
if [[ -n "${REDIS_URL:-}" ]]; then
    if [[ ! "$REDIS_URL" =~ ^redis:// ]]; then
        log_error "REDIS_URL must start with 'redis://'"
    else
        log_success "REDIS_URL format is correct"
    fi
fi

echo ""

# ═══════════════════════════════════════════════════════════
# Security Configuration
# ═══════════════════════════════════════════════════════════
echo "🔐 Security Configuration:"
check_var "SECRET_KEY" true true
check_var "CORS_ORIGINS" true false

# Validate SECRET_KEY strength
if [[ -n "${SECRET_KEY:-}" ]]; then
    if [ ${#SECRET_KEY} -lt 32 ]; then
        log_warning "SECRET_KEY should be at least 32 characters long (current: ${#SECRET_KEY})"
    else
        log_success "SECRET_KEY has adequate length (${#SECRET_KEY} characters)"
    fi
fi

# Validate CORS_ORIGINS format
if [[ -n "${CORS_ORIGINS:-}" ]]; then
    IFS=',' read -ra ORIGINS <<< "$CORS_ORIGINS"
    for origin in "${ORIGINS[@]}"; do
        origin=$(echo "$origin" | xargs)  # trim whitespace
        if [[ ! "$origin" =~ ^https?:// ]]; then
            log_warning "CORS origin should start with http:// or https://: $origin"
        fi
    done
fi

echo ""

# ═══════════════════════════════════════════════════════════
# Cloudinary Configuration
# ═══════════════════════════════════════════════════════════
echo "☁️  Cloudinary Configuration:"
check_var "CLOUDINARY_CLOUD_NAME" true false
check_var "CLOUDINARY_FOLDER" true false
check_var "CLOUDINARY_BASE" true false

echo ""

# ═══════════════════════════════════════════════════════════
# Notification Configuration
# ═══════════════════════════════════════════════════════════
echo "🔔 Notification Configuration:"
check_var "NOTIF_WINDOW_SECONDS" true false
check_var "NOTIF_SUPPRESS_MINUTES" true false
check_var "NOTIF_WORKER_POLL_MS" true false

# Validate notification values
if [[ -n "${NOTIF_WINDOW_SECONDS:-}" ]] && ! [[ "$NOTIF_WINDOW_SECONDS" =~ ^[0-9]+$ ]]; then
    log_error "NOTIF_WINDOW_SECONDS must be a number"
fi

if [[ -n "${NOTIF_SUPPRESS_MINUTES:-}" ]] && ! [[ "$NOTIF_SUPPRESS_MINUTES" =~ ^[0-9]+$ ]]; then
    log_error "NOTIF_SUPPRESS_MINUTES must be a number"
fi

if [[ -n "${NOTIF_WORKER_POLL_MS:-}" ]] && ! [[ "$NOTIF_WORKER_POLL_MS" =~ ^[0-9]+$ ]]; then
    log_error "NOTIF_WORKER_POLL_MS must be a number"
fi

echo ""

# ═══════════════════════════════════════════════════════════
# Email Configuration
# ═══════════════════════════════════════════════════════════
echo "📧 Email Configuration:"
check_var "RESEND_API_KEY" true true
check_var "FROM_EMAIL" true false
check_var "FROM_NAME" true false
check_var "EMAIL_ENABLED" false false

# Validate email format
if [[ -n "${FROM_EMAIL:-}" ]]; then
    if [[ "$FROM_EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        log_success "FROM_EMAIL format is valid"
    else
        log_error "FROM_EMAIL format is invalid: $FROM_EMAIL"
    fi
fi

echo ""

# ═══════════════════════════════════════════════════════════
# Application Configuration
# ═══════════════════════════════════════════════════════════
echo "⚙️  Application Configuration:"
check_var "ENVIRONMENT" true false
check_var "FRONTEND_URL" true false

# Validate ENVIRONMENT
if [[ -n "${ENVIRONMENT:-}" ]]; then
    if [[ ! "$ENVIRONMENT" =~ ^(development|production|staging|test)$ ]]; then
        log_warning "ENVIRONMENT should be one of: development, production, staging, test (current: $ENVIRONMENT)"
    fi
fi

# Validate FRONTEND_URL
if [[ -n "${FRONTEND_URL:-}" ]]; then
    if [[ ! "$FRONTEND_URL" =~ ^https?:// ]]; then
        log_error "FRONTEND_URL must start with http:// or https://"
    fi
fi

echo ""

# ═══════════════════════════════════════════════════════════
# Optional Configuration
# ═══════════════════════════════════════════════════════════
echo "🔧 Optional Configuration:"
check_var "MAX_TRIES" false false
check_var "WAIT_SECONDS" false false

echo ""

# ═══════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════"
echo "  Verification Summary"
echo "═══════════════════════════════════════════════════════════"

if [ $ERRORS -gt 0 ]; then
    echo -e "${COLOR_RED}❌ Found $ERRORS error(s)${COLOR_RESET}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${COLOR_YELLOW}⚠️  Found $WARNINGS warning(s)${COLOR_RESET}"
fi

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${COLOR_GREEN}✅ All environment variables are properly configured!${COLOR_RESET}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${COLOR_YELLOW}⚠️  Configuration has warnings but should work${COLOR_RESET}"
    exit 0
else
    echo -e "${COLOR_RED}❌ Please fix the errors before deploying${COLOR_RESET}"
    exit 1
fi
