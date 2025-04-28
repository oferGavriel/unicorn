import { getDataFromSessionStorage } from '@/utils/utils.service';
import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

const BASE_ENDPOINT = import.meta.env.VITE_API_URL;

const baseQuery = fetchBaseQuery({
  baseUrl: `${BASE_ENDPOINT}/api/v1/`,
  prepareHeaders: (headers) => {
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    return headers;
  },
  credentials: 'include',
});

const baseQueryWithReAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const loggedInUsername: string = getDataFromSessionStorage('loggedInUser');
    await baseQuery(`/auth/refresh-token/${loggedInUsername}`, api, extraOptions);
  }
  return result;
};

export const api = createApi({
  reducerPath: 'clientApi',
  baseQuery: baseQueryWithReAuth,
  endpoints: () => ({}),
  tagTypes: ['Auth', 'User'],
});
