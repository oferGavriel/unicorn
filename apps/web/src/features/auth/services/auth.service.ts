import { api } from '@/store/api';
import { showErrorToast, showSuccessToast } from '@/store/errorHandler';

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
      invalidatesTags: ['Auth'],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data: user } = await queryFulfilled;
          showSuccessToast(
            `Welcome ${user.firstName}! Your account has been created successfully.`
          );
        } catch (error) {
          showErrorToast(error, 'create account');
        }
      }
    }),

    signIn: build.mutation<IAuthUser, ISignInPayload>({
      query(body: ISignInPayload) {
        return {
          url: '/auth/login',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['Auth'],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data: user } = await queryFulfilled;
          showSuccessToast(`Welcome back, ${user.firstName}!`);
        } catch (error) {
          showErrorToast(error, 'sign in');
        }
      }
    }),

    logout: build.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST'
      }),
      invalidatesTags: ['Auth', 'User'],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error('Logout error:', error);
        }
      }
    }),

    checkCurrentUser: build.query<IAuthUser, void>({
      query: () => '/users/me',
      providesTags: ['User'],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error('Current user check failed:', error);
        }
      }
    }),

    getUsers: build.query<IAuthUser[], void>({
      query: () => '/users/all',
      providesTags: ['User'],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          showErrorToast(error, 'fetch users');
        }
      }
    })
  })
});

export const {
  useSignUpMutation,
  useSignInMutation,
  useLogoutMutation,
  useCheckCurrentUserQuery,
  useGetUsersQuery
} = authApi;
