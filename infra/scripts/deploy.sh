#!/bin/bash
set -euo pipefail

readonly DOCKER_IMAGE="${DOCKER_IMAGE:-oferikog/unicorn-app:latest}"
readonly COMPOSE_FILE="/home/ec2-user/docker-compose.prod.yaml"
readonly ENV_FILE="/home/ec2-user/.env.prod"
readonly BACKUP_DIR="/home/ec2-user/backups"
readonly MAX_HEALTH_RETRIES=30
readonly HEALTH_CHECK_INTERVAL=2
readonly AWS_REGION="eu-central-1"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
    exit 1
}

fetch_secret() {
    local param_name=$1
    local secret_value

    secret_value=$(aws ssm get-parameter \
        --name "$param_name" \
        --region "$AWS_REGION" \
        --with-decryption \
        --query Parameter.Value \
        --output text 2>/dev/null)

    if [ -z "$secret_value" ]; then
        error "Failed to fetch secret: $param_name"
    fi

    echo "$secret_value"
}

wait_for_health() {
    local service_name=$1
    local retries=0

    while [ $retries -lt $MAX_HEALTH_RETRIES ]; do
        if docker inspect --format='{{.State.Health.Status}}' "unicorn-$service_name" 2>/dev/null | grep -q "healthy"; then
            log "$service_name is healthy"
            return 0
        fi
        retries=$((retries + 1))
        sleep $HEALTH_CHECK_INTERVAL
    done

    error "$service_name health check failed"
}

create_env_file() {
    log "Fetching configuration from AWS SSM"

    local database_url cors_origins cloudinary_cloud_name cloudinary_folder cloudinary_base
    local jwt_secret notif_window notif_suppress notif_poll resend_key from_email
    local from_name email_enabled frontend_url environment

    database_url=$(fetch_secret "/app/unicorn/db-url")
    cors_origins=$(fetch_secret "/app/unicorn/cors-origins")
    cloudinary_cloud_name=$(fetch_secret "/app/unicorn/cloudinary-cloud-name")
    cloudinary_folder=$(fetch_secret "/app/unicorn/cloudinary-folder")
    cloudinary_base=$(fetch_secret "/app/unicorn/cloudinary-base")
    jwt_secret=$(fetch_secret "/app/unicorn/jwt-secret")
    notif_window=$(fetch_secret "/app/unicorn/notif-window-seconds")
    notif_suppress=$(fetch_secret "/app/unicorn/notif-suppress-minutes")
    notif_poll=$(fetch_secret "/app/unicorn/notif-worker-poll-ms")
    resend_key=$(fetch_secret "/app/unicorn/resend-api-key")
    from_email=$(fetch_secret "/app/unicorn/from-email")
    from_name=$(fetch_secret "/app/unicorn/from-name")
    email_enabled=$(fetch_secret "/app/unicorn/email-enabled")
    frontend_url=$(fetch_secret "/app/unicorn/frontend-url")
    environment=$(fetch_secret "/app/unicorn/environment")

    log "Generating environment configuration"

    cat > "$ENV_FILE" << EOF
DATABASE_URL="$database_url"
SECRET_KEY="$jwt_secret"
CORS_ORIGINS="$cors_origins"
CLOUDINARY_CLOUD_NAME="$cloudinary_cloud_name"
CLOUDINARY_FOLDER="$cloudinary_folder"
CLOUDINARY_BASE="$cloudinary_base"
NOTIF_WINDOW_SECONDS="$notif_window"
NOTIF_SUPPRESS_MINUTES="$notif_suppress"
NOTIF_WORKER_POLL_MS="$notif_poll"
RESEND_API_KEY="$resend_key"
FROM_EMAIL="$from_email"
FROM_NAME="$from_name"
EMAIL_ENABLED="$email_enabled"
FRONTEND_URL="$frontend_url"
ENVIRONMENT="$environment"
REDIS_URL="redis://redis:6379/0"
MAX_TRIES="60"
WAIT_SECONDS="1"
EOF

    chmod 600 "$ENV_FILE"
    log "Environment configuration created"
}

backup_logs() {
    mkdir -p "$BACKUP_DIR"

    if docker ps -q -f name=unicorn-app | grep -q .; then
        local timestamp
        timestamp=$(date +%Y%m%d-%H%M%S)
        docker logs unicorn-app > "$BACKUP_DIR/app-logs-$timestamp.log" 2>&1 || true
        log "Logs backed up"
    fi

    ls -t "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
}

deploy_services() {
    log "Deploying services"

    cd /home/ec2-user

    DOCKER_IMAGE="$DOCKER_IMAGE" \
    AWS_DEFAULT_REGION="$AWS_REGION" \
    docker-compose -f "$COMPOSE_FILE" pull

    DOCKER_IMAGE="$DOCKER_IMAGE" \
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans --no-build
}

verify_deployment() {
    log "Verifying deployment"

    wait_for_health "redis"
    wait_for_health "app"
    wait_for_health "nginx"

    if docker exec unicorn-app curl -f -s http://localhost:8000/api/v1/health > /dev/null; then
        log "API health check passed"
    else
        error "API health check failed"
    fi
}

cleanup() {
    log "Cleaning up resources"

    docker image prune -f > /dev/null 2>&1 || true

    docker images oferikog/unicorn-app --format "{{.ID}} {{.CreatedAt}}" | \
        tail -n +4 | \
        awk '{print $1}' | \
        xargs -r docker rmi -f > /dev/null 2>&1 || true

    docker image prune -a -f --filter "until=168h" > /dev/null 2>&1 || true
}

main() {
    log "Starting deployment: $DOCKER_IMAGE"

    docker pull "$DOCKER_IMAGE"
    create_env_file
    backup_logs
    deploy_services
    verify_deployment
    cleanup

    log "Deployment completed successfully"
    docker-compose -f "$COMPOSE_FILE" ps
}

main "$@"
