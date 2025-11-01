import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
  role: z.enum(['job_seeker', 'job_provider'], {
    message: 'Role must be either job_seeker or job_provider',
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;