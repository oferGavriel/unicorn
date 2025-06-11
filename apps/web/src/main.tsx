import '@/index.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Persistor, persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'sonner';

import AppRoutes from '@/AppRoutes';
import { store } from '@/store/index.ts';

const persistor: Persistor = persistStore(store);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" theme="system" closeButton richColors />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
