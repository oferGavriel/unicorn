from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.v1 import auth as auth_router


def create_app() -> FastAPI:
    app = FastAPI(title="Monday Lite API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth_router.router, prefix="/api/v1")

    @app.get("/health", tags=["meta"])
    async def health_check():
        """Health check endpoint."""
        return {"status": "ok"}

    return app
