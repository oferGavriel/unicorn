from typing import Optional


class AppExceptionError(Exception):
    def __init__(self, message: str, status_code: int, error_code: Optional[str] = None) -> None:
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__


class NotFoundError(AppExceptionError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(message, status_code=404)


class ConflictError(AppExceptionError):
    def __init__(self, message: str = "Conflict occurred") -> None:
        super().__init__(message, status_code=409)


class PermissionDeniedError(AppExceptionError):
    def __init__(self, message: str = "Permission denied") -> None:
        super().__init__(message, status_code=403)


class InvalidCredentialsError(AppExceptionError):
    def __init__(self, message: str = "Invalid credentials") -> None:
        super().__init__(message, status_code=401)


class AccessTokenExpiredError(AppExceptionError):
    def __init__(self, message: str = "Token expired") -> None:
        super().__init__(message, status_code=401)


class RefreshTokenExpiredError(AppExceptionError):
    def __init__(self, message: str = "Refresh Token expired") -> None:
        super().__init__(message, status_code=401)


class TokenInvalidError(AppExceptionError):
    def __init__(self, message: str = "Token invalid") -> None:
        super().__init__(message, status_code=401)
