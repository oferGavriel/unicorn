// In test-utils.tsx - Ultra-simplified version
import { configureStore } from '@reduxjs/toolkit';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { JSX, PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { authReducer } from '@/features/auth/reducers/auth.reducer';
import { mockUser } from '@/mocks/user.mock';
import { api } from '@/store/api';

export const createTestStore = () => {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      authUser: authReducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false
      }).concat(api.middleware)
  });
};

// 🔧 Create store and manually dispatch actions for auth state
export const createAuthenticatedStore = (user = mockUser) => {
  const store = createTestStore();

  // Dispatch login action to set authenticated state
  store.dispatch({
    type: 'authUser/setAuthUser',
    payload: user
  });

  return store;
};

export const createUnauthenticatedStore = () => {
  const store = createTestStore();

  // Dispatch logout action to ensure unauthenticated state
  store.dispatch({
    type: 'authUser/logout'
  });

  return store;
};

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: ReturnType<typeof createTestStore>;
  withRouter?: boolean;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    store = createTestStore(),
    withRouter = true,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren): JSX.Element {
    const content = <Provider store={store}>{children}</Provider>;
    return withRouter ? <BrowserRouter>{content}</BrowserRouter> : content;
  }

  return {
    store,
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
}

export const renderWithStore = (
  element: React.ReactElement,
  store: ReturnType<typeof createTestStore>
) => {
  return <Provider store={store}>{element}</Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
export { userEvent };
