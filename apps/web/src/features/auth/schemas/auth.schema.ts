import { z } from 'zod';

export const loginUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters')
});

export const signUpUserSchema = z.object({
  name: z.string().min(2, 'Too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters')
});

export type LoginFormValues = z.infer<typeof loginUserSchema>;
export type RegisterFormValues = z.infer<typeof signUpUserSchema>;
