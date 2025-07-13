import {
  BaseQueryApi,
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError
} from '@reduxjs/toolkit/query/react';

import { ApiErrorResponse, ErrorCodes } from '@/store/errorHandler';
import { clearLoggedInUser } from '@/utils/utils.service';

const BASE_ENDPOINT = import.meta.env.VITE_API_URL;
if (!BASE_ENDPOINT) {
  throw new Error(
    'VITE_API_URL is not defined. Please set it in your environment variables.'
  );
}

const isApiErrorResponse = (data: unknown): data is ApiErrorResponse => {
  console.log('typeof data:', typeof data);
  console.log('data is object:', typeof data === 'object' && data !== null);
  console.log('data', data);
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as ApiErrorResponse).error_code === 'string'
  );
};

const baseQuery = fetchBaseQuery({
  baseUrl: `${BASE_ENDPOINT}/api/v1/`,
  prepareHeaders: (headers) => {
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    return headers;
  },
  credentials: 'include',
  timeout: 10000
});

const baseQueryWithReAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error) {
    if (result.error.status === 401 && isApiErrorResponse(result.error.data)) {
      const errorCode = result.error.data.error_code;

      switch (errorCode) {
        case ErrorCodes.ACCESS_TOKEN_EXPIRED: {
          console.log('Access token expired, attempting to refresh...');
          const refreshResult = await handleTokenRefresh(api, extraOptions);
          if (refreshResult.success) {
            console.log('Token refreshed successfully, retrying original request...');
            result = await baseQuery(args, api, extraOptions);
          } else {
            console.error('Token refresh failed, redirecting to login...');
            logoutAndRedirectToLogin();
          }
          break;
        }
        case ErrorCodes.TOKEN_INVALID:
        case ErrorCodes.REFRESH_TOKEN_EXPIRED: {
          console.log(`Authentication error: ${errorCode}, redirecting to login...`);
          logoutAndRedirectToLogin();
          break;
        }
        default: {
          console.error(`API error: ${errorCode}: ${result.error}`);
          break;
        }
      }
    }
  }

  return result;
};

// Helper functions
const handleTokenRefresh = async (
  api: BaseQueryApi,
  extraOptions: Record<string, unknown>
): Promise<{ success: boolean }> => {
  try {
    const refreshResult = await baseQuery(
      {
        url: '/auth/refresh-token',
        method: 'POST'
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      return { success: true };
    }

    if (refreshResult.error && isApiErrorResponse(refreshResult.error.data)) {
      console.error('Token refresh failed:', refreshResult.error.data.message);
    }

    return { success: false };
  } catch (error) {
    console.error('Token refresh exception:', error);
    return { success: false };
  }
};

export const logoutAndRedirectToLogin = (): void => {
  clearLoggedInUser();
  window.location.href = '/login';
};

export const api = createApi({
  reducerPath: 'clientApi',
  baseQuery: baseQueryWithReAuth,
  endpoints: () => ({}),
  tagTypes: ['Auth', 'User', 'Board', 'Task', 'Table', 'Row', 'BoardMembers'],
  refetchOnReconnect: true
});

// utility functions for error handling
export const isApiError = (error: unknown): error is FetchBaseQueryError => {
  console.log('Checking if error is ApiError:', typeof error === 'object');
  return typeof error === 'object' && error !== null;
};

export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error) && isApiErrorResponse(error.data)) {
    return error.data.message;
  }

  if (isApiError(error) && typeof error.data === 'string') {
    return error.data;
  }

  return 'An unexpected error occurred';
};

export const getErrorCode = (error: unknown): string | null => {
  if (isApiError(error) && isApiErrorResponse(error.data)) {
    return error.data.error_code;
  }

  return null;
};
