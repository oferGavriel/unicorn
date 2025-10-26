import os
import sys
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import text

from app.api.routes.main_router import add_routes
from app.common.errors.error_model import ErrorResponseModel
from app.common.errors.exceptions import AppExceptionError
from app.core.logger import logger, get_trace_id
from app.core.database import async_engine
from app.core.redis import close_redis_pool, init_redis_pool
from app.middleware.tracing import TracingMiddleware
from app.middleware.metrics import PrometheusMiddleware, metrics_endpoint


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting Unicorn API...")

    try:
        # Initialize Redis connection pool
        await init_redis_pool()
        logger.info("✅ Redis pool initialized")

        # Test database connection
        try:
            async with async_engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection verified")
        except Exception as db_error:
            logger.warning(f"⚠️ Database connection test failed: {db_error}")

        logger.info("🎉 Application startup complete")

    except SystemExit:
        raise
    except Exception as e:
        logger.error(f"❌ Application startup failed: {e}", exc_info=True)
        sys.exit(1)

    yield

    logger.info("🛑 Shutting down Unicorn API...")

    try:
        await async_engine.dispose()
        logger.info("✅ Database engine disposed")

        await close_redis_pool()
        logger.info("✅ Redis pool closed")

        logger.info("👋 Application shutdown complete")

    except Exception as e:
        logger.error(f"❌ Error during shutdown: {e}", exc_info=True)


def create_app() -> FastAPI:
    environment = os.getenv("ENVIRONMENT", "development")
    is_production = environment == "production"

    app = FastAPI(
        title="Unicorn API",
        description="Task management and collaboration platform",
        version="1.0.0",
        docs_url="/docs" if not is_production else None,
        redoc_url="/redoc" if not is_production else None,
        openapi_url="/openapi.json" if not is_production else None,
        swagger_ui_parameters={
            "docExpansion": "none",
            "defaultModelsExpandDepth": -1,
            "persistAuthorization": True,
            "tryItOutEnabled": True,
        },
        lifespan=lifespan,
        swagger_ui_init_oauth={
            "usePkceWithAuthorizationCodeGrant": True,
        }
        if not is_production
        else None,
    )

    # Setup middlewares (order matters!)
    setup_cors(app)

    # Add tracing middleware (must be before metrics)
    app.add_middleware(TracingMiddleware)

    # Add Prometheus metrics middleware
    app.add_middleware(PrometheusMiddleware)

    # Add routes
    add_routes(app)

    # Add metrics endpoint
    app.get("/metrics", include_in_schema=False)(metrics_endpoint)

    # Setup exception handlers
    setup_exception_handlers(app)

    logger.info(
        f"FastAPI app created (environment={environment}, "
        f"docs={'enabled' if not is_production else 'disabled'})"
    )

    return app


def setup_cors(app: FastAPI) -> None:
    def _parse_origins(val: str) -> list[str]:
        return [origin.strip() for origin in val.split(",") if origin.strip()]

    cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    cors_origins = _parse_origins(cors_origins_str)

    for origin in cors_origins:
        if not origin.startswith(("http://", "https://")):
            logger.warning(f"Invalid CORS origin format: {origin}")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=600,
    )

    logger.info(f"CORS configured with origins: {cors_origins}")


def setup_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(AppExceptionError)
    async def app_exception_handler(
        request: Request, exc: AppExceptionError
    ) -> JSONResponse:
        trace_id = get_trace_id()

        logger.warning(
            f"[{exc.status_code}] {exc.error_code}: {exc.message}",
            extra={
                "extra_fields": {
                    "trace_id": trace_id,
                    "path": request.url.path,
                    "method": request.method,
                    "error_code": exc.error_code,
                    "status_code": exc.status_code,
                }
            },
        )

        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponseModel(
                error=exc.__class__.__name__,
                message=exc.message,
                error_code=exc.error_code,
                details=None,
                trace_id=trace_id,
            ).model_dump(exclude_none=True),
        )

    @app.exception_handler(ValidationError)
    async def validation_exception_handler(
        request: Request, exc: ValidationError
    ) -> JSONResponse:
        trace_id = get_trace_id()
        environment = os.getenv("ENVIRONMENT", "development")
        is_production = environment == "production"

        # Format validation errors for better readability
        error_details = []
        for error in exc.errors():
            error_details.append({
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"],
            })

        logger.warning(
            f"[{status.HTTP_422_UNPROCESSABLE_ENTITY}] ValidationError: {exc.error_count()} errors",
            extra={
                "extra_fields": {
                    "trace_id": trace_id,
                    "path": request.url.path,
                    "method": request.method,
                    "error_count": exc.error_count(),
                    "errors": error_details,
                }
            },
        )

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ErrorResponseModel(
                error="ValidationError",
                message="Invalid input data",
                error_code="VALIDATION_ERROR",
                details=error_details if not is_production else None,
                trace_id=trace_id,
            ).model_dump(exclude_none=True),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        trace_id = get_trace_id()

        log_level = (
            logger.error
            if exc.status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR
            else logger.warning
        )

        log_level(
            f"[{exc.status_code}] HTTPException: {exc.detail}",
            extra={
                "extra_fields": {
                    "trace_id": trace_id,
                    "path": request.url.path,
                    "method": request.method,
                    "status_code": exc.status_code,
                }
            },
        )

        # Map status codes to error codes
        error_code_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "CONFLICT",
            422: "UNPROCESSABLE_ENTITY",
            429: "RATE_LIMIT_EXCEEDED",
            500: "INTERNAL_SERVER_ERROR",
            502: "BAD_GATEWAY",
            503: "SERVICE_UNAVAILABLE",
            504: "GATEWAY_TIMEOUT",
        }

        error_code = error_code_map.get(exc.status_code, "HTTP_ERROR")

        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponseModel(
                error="HTTPException",
                message=str(exc.detail),
                error_code=error_code,
                details=None,
                trace_id=trace_id,
            ).model_dump(exclude_none=True),
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(
        request: Request, exc: ValueError
    ) -> JSONResponse:
        """
        Handle ValueError exceptions (e.g., from business logic validation).
        """
        trace_id = get_trace_id()
        environment = os.getenv("ENVIRONMENT", "development")
        is_production = environment == "production"

        logger.warning(
            f"[{status.HTTP_400_BAD_REQUEST}] ValueError: {str(exc)}",
            extra={
                "extra_fields": {
                    "trace_id": trace_id,
                    "path": request.url.path,
                    "method": request.method,
                    "exception_type": "ValueError",
                }
            },
        )

        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ErrorResponseModel(
                error="ValueError",
                message=str(exc),
                error_code="INVALID_VALUE",
                details={"exception": str(exc)} if not is_production else None,
                trace_id=trace_id,
            ).model_dump(exclude_none=True),
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """
        Catch-all handler for unhandled exceptions.
        Logs full stack trace and returns safe error to client.
        """
        trace_id = get_trace_id()
        environment = os.getenv("ENVIRONMENT", "development")
        is_production = environment == "production"

        logger.exception(
            "❌ Unhandled exception occurred",
            extra={
                "extra_fields": {
                    "trace_id": trace_id,
                    "path": request.url.path,
                    "method": request.method,
                    "exception_type": type(exc).__name__,
                }
            },
            exc_info=exc,
        )

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponseModel(
                error="InternalServerError",
                message="An internal server error occurred",
                error_code="INTERNAL_SERVER_ERROR",
                details={"exception": str(exc)} if not is_production else None,
                trace_id=trace_id,
            ).model_dump(exclude_none=True),
        )


app = create_app()


if __name__ == "__main__":
    logger.info("Starting development server...")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",  # noqa: S104
        port=8000,
        reload=True,
        log_level="info",
        access_log=True,
        reload_dirs=["app"],
        reload_excludes=["*.pyc", "__pycache__"],
    )
