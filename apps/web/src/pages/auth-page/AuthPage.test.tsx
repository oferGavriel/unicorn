/* eslint-disable @typescript-eslint/no-explicit-any */
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import * as authHooks from '@/features/auth/services/auth.service';
import { mockUser } from '@/mocks/user.mock';
import { createUnauthenticatedStore, renderWithProviders } from '@/test/test-utils';

import AuthPage from './AuthPage';
import { UI_IDS, UI_TITLES } from './AuthPage.consts';

const AuthPageLoginElements = [
  UI_IDS.HEADER,
  UI_IDS.FORM,
  UI_IDS.LOGIN_EMAIL_INPUT,
  UI_IDS.LOGIN_PASSWORD_INPUT,
  UI_IDS.SUBMIT_BUTTON,
  UI_IDS.AUTH_MODE_TOGGLE
];

const AuthPageRegisterElements = [
  UI_IDS.HEADER,
  UI_IDS.FORM,
  UI_IDS.REGISTER_FIRST_NAME_INPUT,
  UI_IDS.REGISTER_LAST_NAME_INPUT,
  UI_IDS.REGISTER_EMAIL_INPUT,
  UI_IDS.REGISTER_PASSWORD_INPUT,
  UI_IDS.SUBMIT_BUTTON,
  UI_IDS.AUTH_MODE_TOGGLE
];

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('AuthPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render login form by default', () => {
    const store = createUnauthenticatedStore();
    renderWithProviders(<AuthPage />, { store });

    AuthPageLoginElements.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });

    expect(screen.getByTestId(UI_IDS.HEADER)).toHaveTextContent(UI_TITLES.LOGIN_BTN);
    expect(screen.getByTestId(UI_IDS.SUBMIT_BUTTON)).toHaveTextContent(
      UI_TITLES.SIGN_IN_BTN
    );
    expect(screen.getByTestId(UI_IDS.AUTH_MODE_TOGGLE)).toHaveTextContent(
      UI_TITLES.NEED_ACCOUNT
    );
  });

  it('should render register form when toggled', async () => {
    const store = createUnauthenticatedStore();
    const { user } = renderWithProviders(<AuthPage />, { store });

    // Toggle to register mode
    const toggleButton = screen.getByTestId(UI_IDS.AUTH_MODE_TOGGLE);
    await user.click(toggleButton);

    AuthPageRegisterElements.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });

    expect(screen.getByTestId(UI_IDS.HEADER)).toHaveTextContent(UI_TITLES.REGISTER_BTN);
    expect(screen.getByTestId(UI_IDS.SUBMIT_BUTTON)).toHaveTextContent(
      UI_TITLES.SIGN_UP_BTN
    );
    expect(screen.getByTestId(UI_IDS.AUTH_MODE_TOGGLE)).toHaveTextContent(
      UI_TITLES.HAVE_ACCOUNT
    );
  });

  it('should toggle back to login form from register form', async () => {
    const store = createUnauthenticatedStore();
    const { user } = renderWithProviders(<AuthPage />, { store });

    const toggleButton = screen.getByTestId(UI_IDS.AUTH_MODE_TOGGLE);

    // Toggle to register mode
    await user.click(toggleButton);
    expect(screen.getByTestId(UI_IDS.HEADER)).toHaveTextContent(UI_TITLES.REGISTER_BTN);
    AuthPageRegisterElements.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });

    // Toggle back to login mode
    await user.click(toggleButton);
    expect(screen.getByTestId(UI_IDS.HEADER)).toHaveTextContent(UI_TITLES.LOGIN_BTN);
    AuthPageLoginElements.forEach((id) => {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    });
    expect(screen.getByTestId(UI_IDS.SUBMIT_BUTTON)).toHaveTextContent(
      UI_TITLES.SIGN_IN_BTN
    );
    expect(screen.getByTestId(UI_IDS.AUTH_MODE_TOGGLE)).toHaveTextContent(
      UI_TITLES.NEED_ACCOUNT
    );
  });

  it('should successfully login a user', async () => {
    const store = createUnauthenticatedStore();
    const mockSignIn = vi.fn();
    const mockSignInUnwrap = vi.fn().mockResolvedValue(mockUser);

    mockSignIn.mockReturnValue({
      unwrap: mockSignInUnwrap
    });

    vi.spyOn(authHooks, 'useSignInMutation').mockReturnValue([
      mockSignIn,
      { isLoading: false, isSuccess: false, isError: false, error: null, data: undefined }
    ] as any);

    const { user } = renderWithProviders(<AuthPage />, { store });

    await user.type(screen.getByTestId(UI_IDS.LOGIN_EMAIL_INPUT), 'test@example.com');
    await user.type(screen.getByTestId(UI_IDS.LOGIN_PASSWORD_INPUT), 'password123');
    await user.click(screen.getByTestId(UI_IDS.SUBMIT_BUTTON));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    await waitFor(() => {
      expect(mockSignInUnwrap).toHaveBeenCalled();
    });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/boards', { replace: true })
    );
    await waitFor(() => expect(store.getState().authUser.user).toEqual(mockUser));
  });

  it('should successfully register a user', async () => {
    const store = createUnauthenticatedStore();
    const mockSignUp = vi.fn();
    const mockSignUpUnwrap = vi.fn().mockResolvedValue(mockUser);
    mockSignUp.mockReturnValue({
      unwrap: mockSignUpUnwrap
    });

    vi.spyOn(authHooks, 'useSignUpMutation').mockReturnValue([
      mockSignUp,
      { isLoading: false, isSuccess: false, isError: false, error: null, data: undefined }
    ] as any);

    const { user } = renderWithProviders(<AuthPage />, { store });

    // Toggle to register mode
    const toggleButton = screen.getByTestId(UI_IDS.AUTH_MODE_TOGGLE);
    await user.click(toggleButton);

    await user.type(screen.getByTestId(UI_IDS.REGISTER_FIRST_NAME_INPUT), 'Test');
    await user.type(screen.getByTestId(UI_IDS.REGISTER_LAST_NAME_INPUT), 'User');
    await user.type(
      screen.getByTestId(UI_IDS.REGISTER_EMAIL_INPUT),
      'newuser@example.com'
    );
    await user.type(screen.getByTestId(UI_IDS.REGISTER_PASSWORD_INPUT), 'newpassword123');
    await user.click(screen.getByTestId(UI_IDS.SUBMIT_BUTTON));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User',
        email: 'newuser@example.com',
        password: 'newpassword123'
      });
    });
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/boards', { replace: true })
    );
    await waitFor(() => expect(store.getState().authUser.user).toEqual(mockUser));
  });

  it('should display error message on login failure', async () => {
    const store = createUnauthenticatedStore();
    const errorMessage = 'Invalid email or password';
    const mockSignIn = vi.fn();
    const mockSignInUnwrap = vi.fn().mockRejectedValue({
      data: { message: errorMessage, error_code: 'InvalidCredentialsError' }
    });

    mockSignIn.mockReturnValue({
      unwrap: mockSignInUnwrap
    });

    vi.spyOn(authHooks, 'useSignInMutation').mockReturnValue([
      mockSignIn,
      { isLoading: false, isSuccess: false, isError: false, error: null, data: undefined }
    ] as any);
    const { user } = renderWithProviders(<AuthPage />, { store });

    await user.type(screen.getByTestId(UI_IDS.LOGIN_EMAIL_INPUT), 'test@example.com');
    await user.type(screen.getByTestId(UI_IDS.LOGIN_PASSWORD_INPUT), 'wrongpassword');
    await user.click(screen.getByTestId(UI_IDS.SUBMIT_BUTTON));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    });
    await waitFor(() => {
      expect(mockSignInUnwrap).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId(UI_IDS.ERROR_MESSAGE)).toBeInTheDocument();
      expect(screen.getByTestId(UI_IDS.ERROR_MESSAGE)).toHaveTextContent(errorMessage);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should display error message on registration failure', async () => {
    const store = createUnauthenticatedStore();
    const errorMessage = 'Email already registered';
    const mockSignUp = vi.fn();
    const mockSignUpUnwrap = vi.fn().mockRejectedValue({
      status: 409,
      data: { message: errorMessage, error_code: 'ConflictError' }
    });
    mockSignUp.mockReturnValue({
      unwrap: mockSignUpUnwrap
    });

    vi.spyOn(authHooks, 'useSignUpMutation').mockReturnValue([
      mockSignUp,
      { isLoading: false, isSuccess: false, isError: false, error: null, data: undefined }
    ] as any);

    const { user } = renderWithProviders(<AuthPage />, { store });

    const toggleButton = screen.getByTestId(UI_IDS.AUTH_MODE_TOGGLE);
    await user.click(toggleButton);

    await user.type(screen.getByTestId(UI_IDS.REGISTER_FIRST_NAME_INPUT), 'Test');
    await user.type(screen.getByTestId(UI_IDS.REGISTER_LAST_NAME_INPUT), 'User');
    await user.type(
      screen.getByTestId(UI_IDS.REGISTER_EMAIL_INPUT),
      'existing@example.com'
    );
    await user.type(screen.getByTestId(UI_IDS.REGISTER_PASSWORD_INPUT), 'password123');
    await user.click(screen.getByTestId(UI_IDS.SUBMIT_BUTTON));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        firstName: 'Test',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'password123'
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId(UI_IDS.ERROR_MESSAGE)).toBeInTheDocument();
      expect(screen.getByTestId(UI_IDS.ERROR_MESSAGE)).toHaveTextContent(errorMessage);
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
