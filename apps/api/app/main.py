from fastapi import FastAPI
from app.routes.v1 import auth as auth_router

app = FastAPI(title="Monday Lite API", version="0.1.0")

@app.include_router(auth_router.router, prefix="/api/v1")

@app.get("/health", tags=["meta"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

