import { createSlice } from '@reduxjs/toolkit';

interface AuthState { token?: string }
const initialState: AuthState = { token: localStorage.getItem('token') ?? undefined };

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setToken(state, { payload }) {
            state.token = payload;
            if (payload) {
                localStorage.setItem('token', payload);
            }
        },
        logout(state) {
            state.token = undefined;
            localStorage.removeItem('token');
        },
    },
});

export const { setToken, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
