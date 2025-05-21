import { setAuthUser } from '@/features/auth/reducers/auth.reducer';
import {
  LoginFormValues,
  loginUserSchema,
  RegisterFormValues,
  signUpUserSchema,
} from '@/features/auth/schemas/auth.schema';
import { useSignInMutation, useSignUpMutation } from '@/features/auth/services/auth.service';
import { useAppDispatch } from '@/store';
import { zodResolver } from '@hookform/resolvers/zod';
import { FC, ReactElement, useMemo, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { Card, CardContent, Button } from '@/components';
import RegisterForm from '@/features/auth/components/RegisterForm';
import LoginForm from '@/features/auth/components/LoginForm';
import { useNavigate } from 'react-router-dom';

enum AuthMode {
  Login = 'login',
  Register = 'register',
}

export type FormValues = LoginFormValues | RegisterFormValues;

export type AuthPageProps = {};

const AuthPage: FC<AuthPageProps> = (): ReactElement => {
  const [authMode, setAuthMode] = useState<AuthMode>(AuthMode.Login);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [signIn] = useSignInMutation();
  const [signUp] = useSignUpMutation();

  const schema = useMemo(
    () => (authMode === AuthMode.Login ? loginUserSchema : signUpUserSchema),
    [authMode],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormValues> = async (data: FormValues) => {
    try {
      let result;
      if (authMode === AuthMode.Login) {
        result = await signIn(data as LoginFormValues).unwrap();
      } else {
        result = await signUp(data as RegisterFormValues).unwrap();
      }
      dispatch(setAuthUser(result.user));
      console.log('before navigate', result);
      navigate('/');
      reset();
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="space-y-4">
          <h1 className="text-2xl font-semibold text-center">
            {authMode === AuthMode.Login ? 'Login' : 'Register'}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {authMode === AuthMode.Login ? (
              <LoginForm register={register} errors={errors} />
            ) : (
              <RegisterForm register={register} errors={errors} />
            )}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {authMode === AuthMode.Login ? 'Sign in' : 'Sign up'}
            </Button>
          </form>

          <button
            type="button"
            className="text-sm text-blue-500 w-full"
            onClick={() =>
              setAuthMode((prev) => (prev === AuthMode.Login ? AuthMode.Register : AuthMode.Login))
            }
          >
            {authMode === AuthMode.Login ? 'Need an account? Register' : 'Have an account? Login'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
