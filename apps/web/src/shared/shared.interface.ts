export interface ApiErrorResponse {
  error: string;
  message: string;
  error_code: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
}

export enum ErrorCodes {
  ACCESS_TOKEN_EXPIRED = 'AccessTokenExpiredError',
  TOKEN_INVALID = 'TokenInvalidError',
  REFRESH_TOKEN_EXPIRED = 'RefreshTokenExpiredError'
}
