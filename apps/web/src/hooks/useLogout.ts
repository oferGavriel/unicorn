import { useCallback } from 'react';

import { clearUser, useLogoutMutation } from '@/features/auth';
import { useAppDispatch } from '@/store';
import { logoutAndRedirectToLogin } from '@/store/errorHandler';

export const useLogout = () => {
  const [logoutMutation] = useLogoutMutation();
  const dispatch = useAppDispatch();

  const logout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(clearUser());
      logoutAndRedirectToLogin();
    }
  }, [logoutMutation, dispatch]);

  return {
    logout
  };
};
