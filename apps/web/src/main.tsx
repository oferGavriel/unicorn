import React from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';
import AppRoutes from '@/AppRoutes';
import { store } from '@/store/index.ts';
import { Provider } from 'react-redux';
import { Persistor, persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';

const persistor: Persistor = persistStore(store);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);
