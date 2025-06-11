import React, { Suspense } from 'react';
import { type RouteObject, useRoutes } from 'react-router-dom';

import { AuthPage, BoardPage, HomePage, NotFoundPage } from './pages';
import ProtectedRoute from './ProtectedRoute';

const AppRoutes: React.FC = () => {
  const routes: RouteObject[] = [
    {
      path: '/login',
      element: (
        <Suspense>
          <AuthPage />,
        </Suspense>
      )
    },
    {
      path: '/boards',
      element: (
        <Suspense>
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        </Suspense>
      )
    },
    {
      path: '/boards/:boardId',
      element: (
        <Suspense>
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        </Suspense>
      )
    },
    {
      path: '/',
      element: (
        <Suspense>
          <HomePage />
        </Suspense>
      )
    },
    {
      path: '*',
      element: (
        <Suspense>
          <NotFoundPage />
        </Suspense>
      )
    }
  ];

  return useRoutes(routes);
};

export default AppRoutes;
