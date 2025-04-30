import { FunctionComponent, useMemo, useState } from 'react';
import { useSignInMutation, useSignUpMutation } from '../services/auth.service';
import { useAppDispatch, useAppSelector } from '@/store/index';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IAuthUser, ISignInPayload, ISignUpPayload } from '../interfaces/auth.interface';
import {
  LoginFormValues,
  loginUserSchema,
  RegisterFormValues,
  signUpUserSchema,
} from '../schemas/auth.schema';
import { setAuthUser } from '../reducers/auth.reducer';

type FormValues = LoginFormValues | RegisterFormValues;

enum AuthMode {
  Login = 'login',
  Register = 'register',
}

export type AuthPageProps = {};

const AuthPage: FunctionComponent<AuthPageProps> = () => {
  const [authMode, setAuthMode] = useState<AuthMode>(AuthMode.Login);
  const user = useAppSelector((state) => state.authUser.user);
  const dispatch = useAppDispatch();
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
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  console.log('user', user);

  const onSubmit = async (data: FormValues) => {
    try {
      let response;
      if (authMode === AuthMode.Login) {
        const payload: ISignInPayload = { email: data.email, password: data.password };
        response = await signIn(payload).unwrap();
      } else {
        const payload: ISignUpPayload = {
          email: data.email,
          password: data.password,
          name: data.name!,
        };
        response = await signUp(payload).unwrap();
      }
      const user: IAuthUser = response.user!;
      console.log('response', response);
      console.log('user', user);

      dispatch(setAuthUser(user));
      reset();
    } catch (error) {
      console.error('Error during authentication:', error);
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
            {authMode === AuthMode.Register && (
              <>
                <Input placeholder="Name" autoComplete="name" {...register('name')} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </>
            )}

            <Input type="email" placeholder="Email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

            <Input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}

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
