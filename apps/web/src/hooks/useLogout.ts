import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { clearUser, useLogoutMutation } from '@/features/auth';
import { useAppDispatch } from '@/store';
import { api } from '@/store/api';
import { clearLoggedInUser } from '@/utils/utils.service';

export const useLogout = () => {
  const [logoutMutation] = useLogoutMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    try {
      dispatch(clearUser());
      clearLoggedInUser();

      dispatch(api.util.resetApiState());

      await logoutMutation().unwrap();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigate('/login', { replace: true });
    }
  }, [logoutMutation, dispatch, navigate]);

  return {
    logout
  };
};
