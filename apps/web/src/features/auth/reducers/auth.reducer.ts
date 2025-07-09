import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { IAuthUser } from '../types/auth.interface';

export interface AuthState {
  user: IAuthUser | null;
}

const initialState: AuthState = { user: null };

export const authSlice = createSlice({
  name: 'authUser',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<IAuthUser>) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    }
  }
});

export const { setUser, clearUser } = authSlice.actions;
export const authReducer = authSlice.reducer;
