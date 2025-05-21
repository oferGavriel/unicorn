import { FC, Suspense } from 'react';
import { RouteObject, useRoutes } from 'react-router-dom';
import Error from './features/error/Error';
import ProtectedRoute from './features/ProtectedRoute';
import WorkSpacePage from './pages/WorkspacePage';
import AuthPage from './pages/AuthPage';

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
            <WorkSpacePage />
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
