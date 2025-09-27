import uvicorn
import os
import sys

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from pydantic import ValidationError
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.main_router import add_routes
from app.common.errors.error_model import ErrorResponseModel
from app.common.errors.exceptions import AppExceptionError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.logger import logger
from app.db.database import async_engine
from app.notification.redis_client import init_redis_pool, close_redis_pool


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting up...")

    try:
        await init_redis_pool()
    except SystemExit:
        raise
    except Exception as e:
        logger.error(f"Application startup failed: {e}")
        sys.exit(1)

    yield

    logger.info("Shutting down...")
    await async_engine.dispose()
    await close_redis_pool()
    logger.info("Application shutdown complete.")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Unicorn API",
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi_specs/openapi.yaml",
        swagger_ui_parameters={
            "docExpansion": "none",
            "defaultModelsExpandDepth": -1,
            "persistAuthorization": True,
        },
        lifespan=lifespan,
    )

    setup_cors(app)

    add_routes(app)

    setup_exception_handlers(app)

    return app


def setup_cors(app: FastAPI) -> None:
    def _parse_origins(val: str) -> list[str]:
        return [o.strip() for o in val.split(",") if o.strip()]

    cors_origins = _parse_origins(os.getenv("CORS_ORIGINS", "http://localhost:5173"))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
    )


def setup_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppExceptionError)
    async def app_exception_handler(
        request: Request, exc: AppExceptionError
    ) -> JSONResponse:
        logger.warning(
            f"[{exc.status_code}] {exc.error_code}: {exc.message}",
            extra={"path": request.url.path, "method": request.method},
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
            f"[422] ValidationError: {exc.errors()}",
            extra={"path": request.url.path, "method": request.method},
        )
        return JSONResponse(
            status_code=422,
            content={
                "error": "ValidationError",
                "message": "Invalid input data",
                "details": exc.errors(),
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        logger.error(
            f"[{exc.status_code}] HTTPException: {exc.detail}",
            extra={"path": request.url.path, "method": request.method},
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": "HTTPException",
                "message": exc.detail,
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(
            "Unhandled exception occurred",
            extra={"path": request.url.path, "method": request.method},
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "InternalServerError",
                "message": "An internal server error occurred",
            },
        )


app = create_app()

if __name__ == "__main__":
    logger.info("Server started successfully")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")  # noqa: S104
