/* eslint-disable @typescript-eslint/no-explicit-any */
import { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { toast } from 'sonner';

import { ApiError } from '@/types/error.types';
import { clearLoggedInUser } from '@/utils/utils.service';

export const isApiError = (error: unknown): error is FetchBaseQueryError => {
  return typeof error === 'object' && error !== null && 'status' in error;
};

export const isApiErrorResponse = (data: unknown): data is ApiError => {
  return (
    typeof data === 'object' && data !== null && 'error_code' in data && 'message' in data
  );
};

export const getErrorMessage = (error: unknown): string => {
  if (
    error &&
    typeof error === 'object' &&
    'error' in error &&
    typeof (error as any).error === 'object'
  ) {
    const actualError = (error as any).error;

    if (isApiError(actualError) && isApiErrorResponse(actualError.data)) {
      return actualError.data.message;
    }

    if (isApiError(actualError) && typeof actualError.data === 'string') {
      return actualError.data;
    }
  }

  if (isApiError(error) && isApiErrorResponse(error.data)) {
    return error.data.message;
  }

  if (isApiError(error) && typeof error.data === 'string') {
    return error.data;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const showErrorToast = (error: unknown, operation?: string) => {
  const message = getErrorMessage(error);
  const toastMessage = operation ? `Failed to ${operation}: ${message}` : message;
  toast.error(toastMessage);
};

export const showSuccessToast = (message: string) => {
  toast.success(message);
};

export const logoutAndRedirectToLogin = (): void => {
  clearLoggedInUser();
  window.location.href = '/login';
};
