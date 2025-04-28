import { initialAuthUserValues } from '@/shared/shared.interface';
import { IAuthUser } from '../interfaces/auth.interface';
import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit';

export interface AuthState {
  user: IAuthUser | null;
}

const initialValue: AuthState = {
  user: null,
};

const authSlice: Slice = createSlice({
  name: 'auth',
  initialState: initialValue,
  reducers: {
    setAuthUser: (state, action: PayloadAction<Partial<IAuthUser>>) => {
      state.user = action.payload;
    },
    clearAuthUser: (state) => {
      state.user = initialAuthUserValues;
    },
  },
});

export const { setAuthUser, clearAuthUser } = authSlice.actions;
export const authReducer = authSlice.reducer;
