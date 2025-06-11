import React, { ReactElement, ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { Spinner } from '@/shared/components/Spinner';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearLoggedInUser } from '@/utils/utils.service';

import { clearAuthUser, setAuthUser } from './features/auth/reducers/auth.reducer';
import { useCheckCurrentUserQuery } from './features/auth/services/auth.service';

export interface IProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<IProtectedRouteProps> = ({ children }): ReactElement => {
  const dispatch = useAppDispatch();
  const loggedInUser = useAppSelector((s) => s.authUser.user);
  const location = useLocation();

  const {
    data: fetchedUser,
    isLoading,
    isError,
    isUninitialized
  } = useCheckCurrentUserQuery(undefined, {
    skip: !!loggedInUser
  });

  useEffect(() => {
    if (fetchedUser) {
      dispatch(setAuthUser(fetchedUser));
    } else if (isError) {
      dispatch(clearAuthUser());
      clearLoggedInUser();
    }
  }, [fetchedUser, isError, dispatch]);

  if (isLoading || !isUninitialized) {
    return <Spinner />;
  }

  if (!loggedInUser && (isError || !fetchedUser)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
