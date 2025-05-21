import { useAppDispatch, useAppSelector } from '@/store';
import { IReduxState } from '@/store/store.interface';
import { FC, ReactElement, ReactNode, useCallback, useEffect } from 'react';
import { useCheckCurrentUserQuery } from './auth/services/auth.service';
import { setAuthUser } from './auth/reducers/auth.reducer';
import { applicationLogout } from '@/utils/utils.service';
import { Navigate, NavigateFunction, useNavigate } from 'react-router-dom';

export interface IProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: FC<IProtectedRouteProps> = ({ children }): ReactElement => {
  const authUser = useAppSelector((state: IReduxState) => state.authUser);
  const dispatch = useAppDispatch();
  const navigate: NavigateFunction = useNavigate();
  const { data, isError } = useCheckCurrentUserQuery();

  const checkUser = useCallback(async (): Promise<void> => {
    if (data && data.user) {
      dispatch(setAuthUser(data.user));
    }

    console.log('data', data);
    console.log('isError', isError);
    if (isError) {
      dispatch(setAuthUser(null));
      applicationLogout(navigate);
    }
  }, [data, isError, dispatch, navigate]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  if (data?.user || authUser) {
    return <>{children}</>;
  } else {
    return <>{<Navigate to="/login" />}</>;
  }
};

export default ProtectedRoute;
