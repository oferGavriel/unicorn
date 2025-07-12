import { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { toast } from 'sonner';

export enum ErrorCodes {
  ACCESS_TOKEN_EXPIRED = 'AccessTokenExpiredError',
  TOKEN_INVALID = 'TokenInvalidError',
  REFRESH_TOKEN_EXPIRED = 'RefreshTokenExpiredError'
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  error_code: string;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

export interface ErrorHandlerOptions {
  operation: string;
  showToast?: boolean;
  retry?: () => unknown; // Changed from Promise<void> to unknown
  retryConfig?: RetryConfig;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true
};

export class ErrorHandler {
  private static retryAttempts = new Map<string, number>();

  static isApiError(error: unknown): error is FetchBaseQueryError {
    return (
      typeof error === 'object' && error !== null && 'status' in error && 'data' in error
    );
  }

  static isApiErrorResponse(data: unknown): data is ApiErrorResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof (data as ApiErrorResponse).error_code === 'string' &&
      typeof (data as ApiErrorResponse).message === 'string'
    );
  }

  static getErrorMessage(error: unknown): string {
    if (this.isApiError(error)) {
      if (this.isApiErrorResponse(error.data)) {
        return error.data.message;
      }
      if (typeof error.data === 'string') {
        return error.data;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred';
  }

  static getErrorCode(error: unknown): string | null {
    if (this.isApiError(error) && this.isApiErrorResponse(error.data)) {
      return error.data.error_code;
    }
    return null;
  }

  static isRetryableError(error: unknown): boolean {
    if (!this.isApiError(error)) {
      return false;
    }

    const status = error.status;

    // Don't retry client errors (4xx)
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return false;
    }

    // Retry network errors, timeouts, and server errors (5xx)
    return (
      status === 'FETCH_ERROR' ||
      status === 'TIMEOUT_ERROR' ||
      (typeof status === 'number' && status >= 500)
    );
  }

  static async handleMutationError(
    error: unknown,
    options: ErrorHandlerOptions
  ): Promise<void> {
    const {
      operation,
      showToast = true,
      retry,
      retryConfig = DEFAULT_RETRY_CONFIG
    } = options;
    const message = this.getErrorMessage(error);
    const operationKey = `${operation}-${Date.now()}`;

    console.error(`Failed to ${operation}:`, error);

    // Handle retryable errors
    if (retry && this.isRetryableError(error)) {
      const currentAttempts = this.retryAttempts.get(operation) || 0;

      if (currentAttempts < retryConfig.maxRetries) {
        this.retryAttempts.set(operation, currentAttempts + 1);

        const delay = retryConfig.exponentialBackoff
          ? retryConfig.retryDelay * Math.pow(2, currentAttempts)
          : retryConfig.retryDelay;

        if (showToast) {
          toast.error(`${message}. Retrying in ${delay / 1000}s...`, {
            id: operationKey,
            duration: delay,
            action: {
              label: 'Retry Now',
              onClick: () => {
                toast.dismiss(operationKey);
                this.executeRetry(retry, operation);
              }
            }
          });
        }

        setTimeout(() => {
          this.executeRetry(retry, operation);
        }, delay);

        return;
      } else {
        this.retryAttempts.delete(operation);
      }
    }

    // Handle non-retryable errors or max retries reached
    if (showToast) {
      const toastOptions = retry
        ? {
            action: {
              label: 'Retry',
              onClick: () => {
                this.retryAttempts.delete(operation);
                this.executeRetry(retry, operation);
              }
            }
          }
        : {};

      toast.error(message, {
        id: operationKey,
        ...toastOptions
      });
    }
  }

  private static executeRetry(retryFn: () => unknown, operation: string): void {
    try {
      const result = retryFn();

      // Handle promise if returned
      if (result && typeof result === 'object' && 'then' in result) {
        (result as Promise<unknown>)
          .then(() => {
            this.retryAttempts.delete(operation);
            toast.success(`${operation} succeeded after retry`);
          })
          .catch((error) => {
            console.error(`Retry failed for ${operation}:`, error);
          });
      } else {
        this.retryAttempts.delete(operation);
        toast.success(`${operation} succeeded after retry`);
      }
    } catch (error) {
      console.error(`Retry failed for ${operation}:`, error);
    }
  }

  static handleSuccess(operation: string, message?: string): void {
    const successMessage = message || `${operation} completed successfully`;
    toast.success(successMessage);
  }
}
