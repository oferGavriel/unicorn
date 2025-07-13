import React, { lazy, Suspense } from 'react';
import { type RouteObject, useRoutes } from 'react-router-dom';

import { Spinner } from '@/shared/components/Spinner';

import ProtectedRoute from './ProtectedRoute';

const AuthPage = lazy(() => import('./pages/auth-page/AuthPage'));
const BoardPage = lazy(() => import('./pages/board-page/BoardPage'));
const HomePage = lazy(() => import('./pages/home-page/HomePage'));
const NotFoundPage = lazy(() => import('./pages/not-found-page/NotFoundPage'));

const AppRoutes: React.FC = () => {
  const routes: RouteObject[] = [
    {
      path: '/login',
      element: (
        <Suspense fallback={<Spinner fullScreen text="Loading..." size="xl" />}>
          <AuthPage />
        </Suspense>
      )
    },
    {
      path: '/boards',
      element: (
        <Suspense fallback={<Spinner fullScreen text="Loading..." size="xl" />}>
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        </Suspense>
      )
    },
    {
      path: '/boards/:boardId',
      element: (
        <Suspense fallback={<Spinner fullScreen text="Loading..." size="xl" />}>
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        </Suspense>
      )
    },
    {
      path: '/',
      element: (
        <Suspense fallback={<Spinner fullScreen text="Loading..." size="xl" />}>
          <HomePage />
        </Suspense>
      )
    },
    {
      path: '*',
      element: (
        <Suspense fallback={<Spinner fullScreen text="Loading..." size="xl" />}>
          <NotFoundPage />
        </Suspense>
      )
    }
  ];

  return useRoutes(routes);
};

export default AppRoutes;
