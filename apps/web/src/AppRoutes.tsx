import { FC, Suspense } from 'react';
import AuthPage from './features/auth/components/AuthPage';
import { RouteObject, useRoutes } from 'react-router-dom';
import Error from './features/error/Error';
import ProtectedRoute from './features/ProtectedRoute';
import WorkSpace from './features/workspace/components/Workspace';

const AppRoutes: FC = () => {
  const routes: RouteObject[] = [
    {
      path: '/login',
      element: (
        <Suspense>
          <AuthPage />,
        </Suspense>
      ),
    },
    {
      path: '/',
      element: (
        <Suspense>
          <ProtectedRoute>
            <WorkSpace />
          </ProtectedRoute>
        </Suspense>
      ),
    },
    {
      path: '*',
      element: (
        <Suspense>
          <Error />
        </Suspense>
      ),
    },
  ];

  return useRoutes(routes);
};

export default AppRoutes;
