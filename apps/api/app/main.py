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
from sqlalchemy import text

from app.api.routes.main_router import add_routes
from app.common.errors.error_model import ErrorResponseModel
from app.common.errors.exceptions import AppExceptionError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.logger import logger
from app.db.database import async_engine


async def check_database_connection() -> None:
    try:
        async with async_engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        sys.exit(1)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting up...")

    try:
        await check_database_connection()
    except SystemExit:
        raise
    except Exception as e:
        logger.error(f"Application startup failed: {e}")
        sys.exit(1)

    yield

    logger.info("Shutting down...")
    await async_engine.dispose()
    logger.info("Application shutdown complete.")


app = FastAPI(
    title="Monday Lite API",
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


def _parse_origins(val: str) -> list[str]:
    return [o.strip() for o in val.split(",") if o.strip()]


CORS_ORIGINS = _parse_origins(os.getenv("CORS_ORIGINS", "http://localhost:5173"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

add_routes(app)


@app.exception_handler(AppExceptionError)
async def app_exception_handler(request: Request, exc: AppExceptionError) -> JSONResponse:
    logger.warning(f"[{exc.status_code}] {exc.error_code}: {exc.message}")
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
    logger.warning(f"[422] ValidationError: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "ValidationError",
            "message": "Invalid input",
            "details": exc.errors(),
        },
    )


@app.exception_handler(StarletteHTTPException)
async def starlette_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    logger.error(f"[{exc.status_code}] HTTPException: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "HTTPException", "message": exc.detail},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error occurred")
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An internal server error occurred",
        },
    )


if __name__ == "__main__":
    logger.info("Server started successfully")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)  # noqa: S104
