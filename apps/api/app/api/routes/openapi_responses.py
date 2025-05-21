from app.common.errors.error_model import ErrorResponseModel

common_errors = {
    "422": {
        "model": ErrorResponseModel,
        "description": "Validation error",
        "content": {"application/json": {"example": {"error": "Validation failed"}}},
    },
    "500": {
        "model": ErrorResponseModel,
        "description": "Internal server error",
        "content": {"application/json": {"example": {"error": "Unexpected error"}}},
    },
}

auth_errors = {
    "401": {
        "model": ErrorResponseModel,
        "description": "Unauthorized",
        "content": {
            "application/json": {
                "examples": {
                    "invalid_credentials": {
                        "summary": "Invalid credentials",
                        "value": {"error": "Invalid email or password"},
                    },
                    "expired_token": {
                        "summary": "Expired token",
                        "value": {"error": "Token expired"},
                    },
                    "missing_token": {
                        "summary": "Missing refresh token",
                        "value": {"error": "Missing refresh token"},
                    },
                }
            }
        },
    }
}

conflict_errors = {
    "409": {
        "model": ErrorResponseModel,
        "description": "Conflict with current resource state",
        "content": {
            "application/json": {"example": {"error": "Email already registered"}}
        },
    }
}
