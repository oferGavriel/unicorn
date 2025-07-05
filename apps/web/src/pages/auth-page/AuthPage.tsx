import { zodResolver } from '@hookform/resolvers/zod';
import React, { ReactElement, useMemo, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button, Card, CardContent } from '@/components';
import {
  IAuthUser,
  LoginForm,
  LoginFormValues,
  loginUserSchema,
  RegisterForm,
  RegisterFormValues,
  setAuthUser,
  signUpUserSchema,
  useSignInMutation,
  useSignUpMutation
} from '@/features/auth';
import { useApiError } from '@/hooks/useApiError';
import ErrorMessage from '@/shared/components/ErrorMessage';
import { useAppDispatch } from '@/store';

import { UI_IDS, UI_TITLES } from './AuthPage.consts';

enum AuthMode {
  Login = 'login',
  Register = 'register'
}

export type FormValues = LoginFormValues | RegisterFormValues;

export type AuthPageProps = object;

const AuthPage: React.FC<AuthPageProps> = (): ReactElement => {
  const [authMode, setAuthMode] = useState<AuthMode>(AuthMode.Login);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [signIn, { isLoading: isSignInLoading }] = useSignInMutation();
  const [signUp, { isLoading: isSignUpLoading }] = useSignUpMutation();
  const handleApiError = useApiError(setAlertMessage);

  const isLoading = authMode === AuthMode.Login ? isSignInLoading : isSignUpLoading;
  const schema = useMemo(
    () => (authMode === AuthMode.Login ? loginUserSchema : signUpUserSchema),
    [authMode]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit: SubmitHandler<FormValues> = async (data: FormValues) => {
    try {
      let result: IAuthUser | undefined;

      if (authMode === AuthMode.Login) {
        result = await signIn(data as LoginFormValues).unwrap();
      } else {
        result = await signUp(data as RegisterFormValues).unwrap();
      }

      dispatch(setAuthUser(result));
      console.log('before navigate', result);
      navigate('/boards', { replace: true });
      reset();
    } catch (err) {
      console.error('Authentication error:', err);

      handleApiError(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="space-y-4">
          <h1 className="text-2xl font-semibold text-center" data-testid={UI_IDS.HEADER}>
            {authMode === AuthMode.Login ? UI_TITLES.LOGIN_BTN : UI_TITLES.REGISTER_BTN}
          </h1>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid={UI_IDS.FORM}
          >
            {authMode === AuthMode.Login ? (
              <LoginForm register={register} errors={errors} />
            ) : (
              <RegisterForm register={register} errors={errors} />
            )}

            {isLoading ? (
              <Button
                className="w-full"
                type="button"
                variant={'secondary'}
                disabled
                data-testid={UI_IDS.SUBMIT_BUTTON}
              >
                {authMode === AuthMode.Login
                  ? UI_TITLES.LOGIN_LOADING
                  : UI_TITLES.REGISTER_LOADING}
              </Button>
            ) : (
              <Button
                className="w-full"
                type="submit"
                variant={'secondary'}
                disabled={isSubmitting}
                data-testid={UI_IDS.SUBMIT_BUTTON}
              >
                {authMode === AuthMode.Login
                  ? UI_TITLES.SIGN_IN_BTN
                  : UI_TITLES.SIGN_UP_BTN}
              </Button>
            )}
          </form>
          {alertMessage && (
            <ErrorMessage
              type="error"
              message={alertMessage}
              data-testid={UI_IDS.ERROR_MESSAGE}
            />
          )}

          <button
            type="button"
            className="text-sm text-blue-500 w-full"
            data-testid={UI_IDS.AUTH_MODE_TOGGLE}
            onClick={() =>
              setAuthMode((prev) =>
                prev === AuthMode.Login ? AuthMode.Register : AuthMode.Login
              )
            }
          >
            {authMode === AuthMode.Login
              ? UI_TITLES.NEED_ACCOUNT
              : UI_TITLES.HAVE_ACCOUNT}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
