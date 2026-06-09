/**
 * Auth form schemas.
 *
 * These delegate to the canonical field validators in `validations.ts` so the
 * email/password rules have a single source of truth (avoiding the duplicate,
 * conflicting rules this file previously defined). The shapes here match the
 * auth forms in LegendaryLandingPage (`name`-based signup + forgot password).
 */
import { z } from 'zod';
import { emailSchema, passwordSchema, nameSchema, loginSchema as canonicalLoginSchema } from '@/schemas/validations';

export const loginSchema = canonicalLoginSchema;

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
