import { FC, Suspense } from 'react';
import AuthPage from './features/auth/components/AuthPage';
import { RouteObject, useRoutes } from 'react-router-dom';

const AppRoutes: FC = () => {
  const routes: RouteObject[] = [
    {
      path: '/',
      element: (
        <Suspense>
          <AuthPage />,
        </Suspense>
      ),
    },
  ];

  return useRoutes(routes);
};

export default AppRoutes;
