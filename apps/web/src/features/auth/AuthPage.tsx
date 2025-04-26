import { useState } from 'react';
import { useLoginMutation, useRegisterMutation } from '@/store/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setToken } from '@/store/authSlice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLoginRequest, AuthRegisterRequest } from '@/types/interfaces';

const schema = z.object({
    name: z.string().min(2, 'Too short').optional(),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Min 6 characters'),
});
type FormValues = z.infer<typeof schema>;

enum AuthMode {
    Login = 'login',
    Register = 'register',
}

export default function AuthPage() {
    const [authMode, setAuthMode] = useState<AuthMode>(AuthMode.Login);
    const dispatch = useAppDispatch();
    const [login] = useLoginMutation();
    const [register] = useRegisterMutation();

    const {
        register: rf,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    const onSubmit = handleSubmit(async (data: AuthRegisterRequest | AuthLoginRequest) => {
        if (authMode === AuthMode.Login) {
            const { access_token } = await login({ email: data.email, password: data.password }).unwrap();
            dispatch(setToken(access_token));
            reset();
        } else {
            await register(data as AuthRegisterRequest).unwrap();
            setAuthMode(AuthMode.Login);
            reset();
        }

        // if (authMode === AuthMode.Login) {
        //     const { access_token } = await login({ email: data.email, password: data.password }).unwrap();
        //     d(setToken(access_token));
        //     reset();
        // } else {
        //     await register(data).unwrap();
        //     setMode(true);
        //     reset();
        // }
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardContent className="space-y-4">
                    <h1 className="text-2xl font-semibold text-center">
                        {authMode === AuthMode.Login ? 'Login' : 'Register'}
                    </h1>

                    {authMode === AuthMode.Register && (
                        <>
                            <Input placeholder="Name" {...rf('name')} />
                            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                        </>
                    )}

                    <Input type="email" placeholder="Email" {...rf('email')} />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

                    <Input type="password" placeholder="Password" {...rf('password')} />
                    {errors.password && (
                        <p className="text-red-500 text-sm">{errors.password.message}</p>
                    )}

                    <Button className="w-full" onClick={onSubmit} disabled={isSubmitting}>
                        {authMode === AuthMode.Login ? 'Sign in' : 'Sign up'}
                    </Button>

                    <button
                        type="button"
                        className="text-sm text-blue-500 w-full"
                        onClick={() => setAuthMode((prev) => (prev === AuthMode.Login ? AuthMode.Register : AuthMode.Login))}
                    >
                        {authMode === AuthMode.Login ? 'Need an account? Register' : 'Have an account? Login'}
                    </button>
                </CardContent>
            </Card>
        </div>
    );
}
