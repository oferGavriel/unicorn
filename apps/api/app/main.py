import os
import sys
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Awaitable, Callable

import uvicorn
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import text

from app.api.routes.main_router import add_routes
from app.common.errors.error_model import ErrorResponseModel
from app.common.errors.exceptions import AppExceptionError
from app.core.logger import logger
from app.core.database import async_engine
from app.core.redis import close_redis_pool, init_redis_pool


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
        } if not is_production else None,
    )

    setup_cors(app)

    if not is_production:
        setup_request_logging(app)

    add_routes(app)

    setup_exception_handlers(app)

    logger.info(
        f"FastAPI app created (environment={environment}, \
         docs={'enabled' if not is_production else 'disabled'})"
    )

    return app


def setup_cors(app: FastAPI) -> None:
    def _parse_origins(val: str) -> list[str]:
        """Parse comma-separated origins string into list."""
        return [origin.strip() for origin in val.split(",") if origin.strip()]

    cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    cors_origins = _parse_origins(cors_origins_str)

    for origin in cors_origins:
        if not origin.startswith(("http://", "https://")):
            logger.warning(f"⚠️ Invalid CORS origin format: {origin}")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=600,
    )

    logger.info(f"✅ CORS configured with origins: {cors_origins}")


def setup_request_logging(app: FastAPI) -> None:
    @app.middleware("http")
    async def log_requests(
      request: Request,
      call_next: Callable[[Request],
      Awaitable[Response]]
    ) -> Response:
        logger.debug(
            f"→ {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "client": request.client.host if request.client else None,
            },
        )
        response = await call_next(request)
        logger.debug(
            f"← {request.method} {request.url.path} - {response.status_code}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
            },
        )
        return response


def setup_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppExceptionError)
    async def app_exception_handler(
        request: Request, exc: AppExceptionError
    ) -> JSONResponse:
        logger.warning(
            f"[{exc.status_code}] {exc.error_code}: {exc.message}",
            extra={
                "path": request.url.path,
                "method": request.method,
                "error_code": exc.error_code,
            },
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponseModel(
                error=exc.__class__.__name__,
                message=exc.message,
                error_code=exc.error_code,
            ).model_dump(),
        )

    @app.exception_handler(ValidationError)
    async def validation_exception_handler(
        request: Request, exc: ValidationError
    ) -> JSONResponse:
        logger.warning(
            f"[{status.HTTP_422_UNPROCESSABLE_ENTITY}] \
            ValidationError: {exc.error_count()} \
            \nErrors: {exc.errors()}",
            extra={
                "path": request.url.path,
                "method": request.method,
                "errors": exc.errors(),
            },
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "ValidationError",
                "message": "Invalid input data",
                "details": exc.errors(),
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        log_level = (
            logger.error
            if exc.status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR
            else logger.warning
        )

        log_level(
            f"[{exc.status_code}] HTTPException: {exc.detail}",
            extra={
                "path": request.url.path,
                "method": request.method,
                "status_code": exc.status_code,
            },
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": "HTTPException",
                "message": exc.detail,
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.exception(
            "❌ Unhandled exception occurred",
            extra={
                "path": request.url.path,
                "method": request.method,
                "exception_type": type(exc).__name__,
            },
            exc_info=exc,
        )

        environment = os.getenv("ENVIRONMENT", "development")
        is_production = environment == "production"

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "InternalServerError",
                "message": "An internal server error occurred",
                **({"details": str(exc)} if not is_production else {}),
            },
        )


app = create_app()


if __name__ == "__main__":
    logger.info("🔧 Starting development server...")
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
