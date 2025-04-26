import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api/v1' }),
    endpoints: (builder) => ({
        register: builder.mutation<{ id: string; email: string; name: string }, { email: string; password: string; name: string; }>({
            query: (body) => ({ url: '/auth/register', method: 'POST', body }),
        }),
        login: builder.mutation<{ access_token: string; refresh_token: string }, { email: string; password: string }>({
            query: (body) => ({ url: '/auth/login', method: 'POST', body }),
        })
    }),
});

export const { useRegisterMutation, useLoginMutation } = authApi;
