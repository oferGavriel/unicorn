import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import React, { ReactElement, useMemo, useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components';
import {
  IAuthUser,
  LoginForm,
  LoginFormValues,
  loginUserSchema,
  RegisterForm,
  RegisterFormValues,
  setUser,
  signUpUserSchema,
  useSignInMutation,
  useSignUpMutation
} from '@/features/auth';
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
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [signIn, { isLoading: isSignInLoading }] = useSignInMutation();
  const [signUp, { isLoading: isSignUpLoading }] = useSignUpMutation();

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
    let result: IAuthUser | undefined;

    if (authMode === AuthMode.Login) {
      result = await signIn(data as LoginFormValues).unwrap();
    } else {
      result = await signUp(data as RegisterFormValues).unwrap();
    }

    dispatch(setUser(result));
    navigate('/boards', { replace: true });
    reset();
  };

  return (
    <main className="h-screen w-screen">
      <section className="home-page-hero h-full">
        <div className="flex items-center justify-center p-4 h-full">
          <div className="w-full max-w-md shadow-xl glass-bg px-6 py-8">
            <div className="space-y-4">
              <div className="flex items-center justify-center rounded-2xl shadow-lg w-14 h-14 mx-auto bg-gray-100/30">
                <LogIn size={26} />
              </div>

              <h1
                className="text-2xl font-semibold text-center"
                data-testid={UI_IDS.HEADER}
              >
                {authMode === AuthMode.Login
                  ? UI_TITLES.LOGIN_HEADER
                  : UI_TITLES.REGISTER_HEADER}
              </h1>

              <p className="text-center font-semibold text-sm text-gray-300 mt-2 mb-1">
                {authMode === AuthMode.Login
                  ? UI_TITLES.LOGIN_SUBTITLE
                  : UI_TITLES.REGISTER_SUBTITLE}
              </p>

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
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
