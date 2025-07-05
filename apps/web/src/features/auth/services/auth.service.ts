import { api } from '@/store/api';

import type { IAuthUser, ISignInPayload, ISignUpPayload } from '../types/auth.interface';

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    signUp: build.mutation<IAuthUser, ISignUpPayload>({
      query(body: ISignUpPayload) {
        return {
          url: '/auth/register',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['Auth']
    }),
    signIn: build.mutation<IAuthUser, ISignInPayload>({
      query(body: ISignInPayload) {
        return {
          url: '/auth/login',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['Auth']
    }),
    checkCurrentUser: build.query<IAuthUser, void>({
      query: () => '/users/me',
      providesTags: ['User']
    }),
    getUsers: build.query<IAuthUser[], void>({
      query: () => '/users/all',
      providesTags: ['User']
    })
  })
});

export const {
  useSignUpMutation,
  useSignInMutation,
  useCheckCurrentUserQuery,
  useGetUsersQuery
} = authApi;
