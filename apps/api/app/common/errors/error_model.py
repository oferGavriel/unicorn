from pydantic import BaseModel, Field
from typing import Optional


class ErrorResponseModel(BaseModel):
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
    error_code: str = Field(..., description="Specific error code")
    trace_id: Optional[str] = Field(None, description="Request trace ID")
    details: Optional[dict | list | str] = Field(None, description="Additional details")
