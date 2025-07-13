import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { Reducer } from 'redux';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  PURGE,
  REGISTER,
  REHYDRATE
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { authReducer } from '@/features/auth/reducers/auth.reducer';

import { api } from './api';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['authUser'],
  blacklist: ['clientApi', '_persist']
};

export const combineReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  authUser: authReducer
});

export const rootReducers: Reducer<RootState> = (state, action) => {
  if (action.type === 'auth/logout') {
    const newState = {
      ...state,
      authUser: undefined
    } as unknown as RootState;
    return combineReducer(newState, action);
  }
  return combineReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducers);

export const store = configureStore({
  devTools: import.meta.env.DEV,
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }).concat(api.middleware)
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof combineReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
