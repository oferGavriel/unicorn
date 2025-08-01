export interface ApiError {
  error: string;
  message: string;
  error_code: string;
}

export enum ErrorCodes {
  ACCESS_TOKEN_EXPIRED = 'AccessTokenExpiredError',
  TOKEN_INVALID = 'TokenInvalidError',
  REFRESH_TOKEN_EXPIRED = 'RefreshTokenExpiredError',
  NOT_FOUND = 'NotFoundError',
  FORBIDDEN = 'ForbiddenError',
  UNAUTHORIZED = 'UnauthorizedError'
}
