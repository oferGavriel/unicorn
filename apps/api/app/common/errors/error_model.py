from pydantic import BaseModel, Field
from typing import Optional


class ErrorResponseModel(BaseModel):
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
    error_code: Optional[str] = Field(None, description="Custom error code or identifier")
