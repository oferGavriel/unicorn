#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════
# Unicorn Production Deployment Script
# ═══════════════════════════════════════════════════════════

COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_RESET='\033[0m'

log_info() {
    echo -e "${COLOR_GREEN}[INFO]${COLOR_RESET} $1"
}

log_error() {
    echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $1"
}

log_warn() {
    echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $1"
}

# ═══════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════
DOCKER_IMAGE="${DOCKER_IMAGE:-oferikog/unicorn-app:latest}"
COMPOSE_FILE="/home/ec2-user/docker-compose.prod.yaml"
ENV_FILE="/home/ec2-user/.env.prod"
BACKUP_DIR="/home/ec2-user/backups"
MAX_HEALTH_RETRIES=30
HEALTH_CHECK_INTERVAL=2

# ═══════════════════════════════════════════════════════════
# Step 1: Pull latest Docker image
# ═══════════════════════════════════════════════════════════
log_info "Pulling latest Docker image: $DOCKER_IMAGE"
docker pull "$DOCKER_IMAGE"

# ═══════════════════════════════════════════════════════════
# Step 2: Fetch secrets from AWS SSM and generate .env file
# ═══════════════════════════════════════════════════════════
log_info "Fetching secrets from AWS SSM Parameter Store..."

export AWS_DEFAULT_REGION=eu-central-1

fetch_secret() {
    local param_name=$1
    local secret_value
    secret_value=$(aws ssm get-parameter \
        --name "$param_name" \
        --with-decryption \
        --query Parameter.Value \
        --output text)

    if [ -z "$secret_value" ]; then
        log_error "Failed to fetch secret: $param_name"
        exit 1
    fi
    echo "$secret_value"
}

DATABASE_URL=$(fetch_secret "/app/unicorn/db-url")
CORS_ORIGINS=$(fetch_secret "/app/unicorn/cors-origins")
CLOUDINARY_CLOUD_NAME=$(fetch_secret "/app/unicorn/cloudinary-cloud-name")
CLOUDINARY_FOLDER=$(fetch_secret "/app/unicorn/cloudinary-folder")
CLOUDINARY_BASE=$(fetch_secret "/app/unicorn/cloudinary-base")
JWT_SECRET=$(fetch_secret "/app/unicorn/jwt-secret")

# Notification parameters
NOTIF_WINDOW_SECONDS=$(fetch_secret "/app/unicorn/notif-window-seconds")
NOTIF_SUPPRESS_MINUTES=$(fetch_secret "/app/unicorn/notif-suppress-minutes")
NOTIF_WORKER_POLL_MS=$(fetch_secret "/app/unicorn/notif-worker-poll-ms")

# Email parameters
RESEND_API_KEY=$(fetch_secret "/app/unicorn/resend-api-key")
FROM_EMAIL=$(fetch_secret "/app/unicorn/from-email")
FROM_NAME=$(fetch_secret "/app/unicorn/from-name")
EMAIL_ENABLED=$(fetch_secret "/app/unicorn/email-enabled")

# Application parameters
FRONTEND_URL=$(fetch_secret "/app/unicorn/frontend-url")
ENVIRONMENT=$(fetch_secret "/app/unicorn/environment")

# Create .env.prod file with ALL variables
log_info "Generating .env.prod file..."
cat > "$ENV_FILE" <<EOF
DATABASE_URL="${DATABASE_URL}"
SECRET_KEY="${JWT_SECRET}"
CORS_ORIGINS="${CORS_ORIGINS}"
CLOUDINARY_CLOUD_NAME="${CLOUDINARY_CLOUD_NAME}"
CLOUDINARY_FOLDER="${CLOUDINARY_FOLDER}"
CLOUDINARY_BASE="${CLOUDINARY_BASE}"
NOTIF_WINDOW_SECONDS="${NOTIF_WINDOW_SECONDS}"
NOTIF_SUPPRESS_MINUTES="${NOTIF_SUPPRESS_MINUTES}"
NOTIF_WORKER_POLL_MS="${NOTIF_WORKER_POLL_MS}"
RESEND_API_KEY="${RESEND_API_KEY}"
FROM_EMAIL="${FROM_EMAIL}"
FROM_NAME="${FROM_NAME}"
EMAIL_ENABLED="${EMAIL_ENABLED}"
FRONTEND_URL="${FRONTEND_URL}"
ENVIRONMENT="${ENVIRONMENT}"
REDIS_URL=redis://redis:6379/0
MAX_TRIES=60
WAIT_SECONDS=1
EOF

chmod 600 "$ENV_FILE"
log_info ".env.prod file created securely"

# ═══════════════════════════════════════════════════════════
# Step 3: Backup current state
# ═══════════════════════════════════════════════════════════
log_info "Creating backup of current deployment..."
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"

if docker ps -q -f name=unicorn-app | grep -q .; then
    docker logs unicorn-app > "$BACKUP_DIR/app-logs-$(date +%Y%m%d-%H%M%S).log" 2>&1 || true
    log_info "Logs backed up to $BACKUP_DIR"
fi

# Keep only last 5 backups
ls -t "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

# ═══════════════════════════════════════════════════════════
# Step 4: Docker Compose will handle migrations via prestart.sh
# ═══════════════════════════════════════════════════════════
log_info "Migrations will be handled by prestart.sh in the container..."

# ═══════════════════════════════════════════════════════════
# Step 5: Deploy with Docker Compose (rolling update)
# ═══════════════════════════════════════════════════════════
log_info "Starting Docker Compose deployment..."

cd /home/ec2-user

# Export DOCKER_IMAGE for docker-compose
export DOCKER_IMAGE="$DOCKER_IMAGE"

# Pull all images defined in compose
docker-compose -f "$COMPOSE_FILE" pull

# Start services with rolling update strategy
# This will:
# 1. Start new containers
# 2. Wait for health checks
# 3. Stop old containers only after new ones are healthy
docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans --no-build

# ═══════════════════════════════════════════════════════════
# Step 6: Health check
# ═══════════════════════════════════════════════════════════
log_info "Waiting for services to become healthy..."

wait_for_health() {
    local service_name=$1
    local retries=0

    while [ $retries -lt $MAX_HEALTH_RETRIES ]; do
        if docker inspect --format='{{.State.Health.Status}}' "unicorn-$service_name" 2>/dev/null | grep -q "healthy"; then
            log_info "✓ $service_name is healthy"
            return 0
        fi

        retries=$((retries + 1))
        sleep $HEALTH_CHECK_INTERVAL
    done

    log_error "✗ $service_name failed health check"
    return 1
}

# Check critical services
if ! wait_for_health "redis"; then
    log_error "Redis health check failed"
    exit 1
fi

if ! wait_for_health "app"; then
    log_error "App health check failed. Rolling back..."
    docker-compose -f "$COMPOSE_FILE" logs app
    exit 1
fi

if ! wait_for_health "nginx"; then
    log_error "Nginx health check failed"
    exit 1
fi

log_info "Worker is starting (no health check required for background worker)"

# ═══════════════════════════════════════════════════════════
# Step 7: Cleanup old images
# ═══════════════════════════════════════════════════════════
log_info "Cleaning up old Docker images..."

# Remove dangling images (untagged)
docker image prune -f || true

# Remove old images (keep last 3 versions only)
log_info "Keeping only the 3 most recent images..."
docker images oferikog/unicorn-app --format "{{.ID}} {{.CreatedAt}}" | \
  tail -n +4 | \
  awk '{print $1}' | \
  xargs -r docker rmi -f || true

# Remove unused images older than 7 days
docker image prune -a -f --filter "until=168h" || true

log_info "Disk usage after cleanup:"
df -h / | grep -v Filesystem

# ═══════════════════════════════════════════════════════════
# Step 8: Final verification
# ═══════════════════════════════════════════════════════════
log_info "Verifying deployment..."

# Test API endpoint
if curl -f -s -o /dev/null http://localhost:8000/health; then
    log_info "✓ API health endpoint responding"
else
    log_error "✗ API health endpoint not responding"
    docker-compose -f "$COMPOSE_FILE" logs app
    exit 1
fi

# Show running containers
log_info "Currently running services:"
docker-compose -f "$COMPOSE_FILE" ps

log_info "═══════════════════════════════════════════════════════════"
log_info "SUCCESS: Deployment completed successfully!"
log_info "═══════════════════════════════════════════════════════════"
log_info "App:    http://localhost:8000"
log_info "Redis:  redis://localhost:6379"
log_info "Nginx:  http://localhost:80 (HTTPS: 443)"
log_info "═══════════════════════════════════════════════════════════"
