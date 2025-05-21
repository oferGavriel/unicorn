from typing import Optional


class AppExceptionError(Exception):
    def __init__(
        self, message: str, status_code: int, error_code: Optional[str] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__


class NotFoundError(AppExceptionError):
    def __init__(self, message="Resource not found"):
        super().__init__(message, status_code=404)


class ConflictError(AppExceptionError):
    def __init__(self, message="Conflict occurred"):
        super().__init__(message, status_code=409)


class PermissionDeniedError(AppExceptionError):
    def __init__(self, message="Permission denied"):
        super().__init__(message, status_code=403)


class InvalidCredentialsError(AppExceptionError):
    def __init__(self, message="Invalid credentials"):
        super().__init__(message, status_code=401)


class TokenExpiredError(AppExceptionError):
    def __init__(self, message="Token expired"):
        super().__init__(message, status_code=401)


class TokenInvalidError(AppExceptionError):
    def __init__(self, message="Token invalid"):
        super().__init__(message, status_code=401)
