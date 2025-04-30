import { api } from '@/store/api';
import { IResponse, ISignInPayload, ISignUpPayload } from '../interfaces/auth.interface';

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    signUp: build.mutation<IResponse, ISignUpPayload>({
      query(body: ISignUpPayload) {
        return {
          url: '/auth/register',
          method: 'POST',
          body,
        };
      },
      invalidatesTags: ['Auth'],
    }),
    signIn: build.mutation<IResponse, ISignInPayload>({
      query(body: ISignInPayload) {
        return {
          url: '/auth/login',
          method: 'POST',
          body,
        };
      },
      invalidatesTags: ['Auth'],
    }),
    checkCurrentUser: build.query<IResponse, void>({
      query: () => '/auth/current-user',
      providesTags: ['User'],
    }),
  }),
});

export const { useSignUpMutation, useSignInMutation, useCheckCurrentUserQuery } = authApi;
