import {
  BaseQueryApi,
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError
} from '@reduxjs/toolkit/query/react';

import { isApiErrorResponse } from '@/store/errorHandler';
import { ErrorCodes } from '@/types/error.types';
import { clearLoggedInUser } from '@/utils/utils.service';

const BASE_ENDPOINT = import.meta.env.VITE_API_URL;
if (!BASE_ENDPOINT) {
  throw new Error(
    'VITE_API_URL is not defined. Please set it in your environment variables.'
  );
}

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

  if (result.error?.status === 401 && isApiErrorResponse(result.error.data)) {
    const errorCode = result.error.data.error_code;

    if (errorCode === ErrorCodes.ACCESS_TOKEN_EXPIRED) {
      const refreshSuccess = await tryRefreshToken(api, extraOptions);
      if (refreshSuccess) {
        result = await baseQuery(args, api, extraOptions);
      } else {
        logoutUser();
      }
    } else if (
      [ErrorCodes.TOKEN_INVALID, ErrorCodes.REFRESH_TOKEN_EXPIRED].includes(
        errorCode as ErrorCodes
      )
    ) {
      logoutUser();
    }
  }

  return result;
};

const tryRefreshToken = async (
  api: BaseQueryApi,
  extraOptions: Record<string, unknown>
): Promise<boolean> => {
  try {
    const refreshResult = await baseQuery(
      { url: '/auth/refresh-token', method: 'POST' },
      api,
      extraOptions
    );
    return !refreshResult.error;
  } catch {
    return false;
  }
};

const logoutUser = (): void => {
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
