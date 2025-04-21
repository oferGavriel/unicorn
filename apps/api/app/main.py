from fastapi import FastAPI

app = FastAPI(title="Monday Lite API", version="0.1.0")

@app.get("/health", tags=["meta"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
