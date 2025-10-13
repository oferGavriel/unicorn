# ═══════════════════════════════════════════════════════════
# Stage 1: Base image with Python and Poetry
# ═══════════════════════════════════════════════════════════
FROM python:3.12-slim AS base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    POETRY_VERSION=1.7.1 \
    POETRY_HOME="/opt/poetry" \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false

# Add Poetry to PATH
ENV PATH="$POETRY_HOME/bin:$PATH"

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -

WORKDIR /app

# ═══════════════════════════════════════════════════════════
# Stage 2: Dependencies installation
# ═══════════════════════════════════════════════════════════
FROM base AS dependencies

# Copy dependency files
COPY apps/api/pyproject.toml apps/api/poetry.lock ./

# Install dependencies (without dev dependencies for production)
RUN poetry install --only main --no-root --no-directory

# ═══════════════════════════════════════════════════════════
# Stage 3: Development image (with hot reload)
# ═══════════════════════════════════════════════════════════
FROM base AS development

# Install ALL dependencies (including dev tools)
COPY apps/api/pyproject.toml apps/api/poetry.lock ./
RUN poetry install --no-root --no-directory

# Copy application code (will be overridden by volume mount in dev)
COPY apps/api/ ./

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command (can be overridden in docker-compose)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ═══════════════════════════════════════════════════════════
# Stage 4: Production image (optimized)
# ═══════════════════════════════════════════════════════════
FROM python:3.12-slim AS production

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/poetry/bin:$PATH"

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

WORKDIR /app

# Copy Python dependencies from dependencies stage
COPY --from=dependencies /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Copy application code
COPY apps/api/ ./

# Copy prestart script
COPY apps/api/prestart.sh ./
RUN chmod +x prestart.sh

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Add build metadata
ARG BUILD_DATE
ARG GIT_COMMIT
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.revision=$GIT_COMMIT \
      org.opencontainers.image.title="Unicorn API" \
      org.opencontainers.image.description="Task management and money tracking API"

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
