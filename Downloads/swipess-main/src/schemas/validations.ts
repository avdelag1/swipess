/**
 * Zod validation schemas for form inputs
 * Centralized validation logic for consistency and reusability
 */

import { z } from 'zod';
import { LIMITS, VALIDATION } from '@/constants/app';

// Common field validators
export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .email('Invalid email address')
  .min(1, 'Email is required');

export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(LIMITS.MIN_PASSWORD_LENGTH, `Password must be at least ${LIMITS.MIN_PASSWORD_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const phoneSchema = z
  .string()
  .regex(VALIDATION.PHONE_REGEX, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

export const urlSchema = z
  .string()
  .regex(VALIDATION.URL_REGEX, 'Invalid URL format')
  .optional()
  .or(z.literal(''));

export const bioSchema = z
  .string()
  .max(LIMITS.MAX_BIO_LENGTH, `Bio cannot exceed ${LIMITS.MAX_BIO_LENGTH} characters`)
  .optional()
  .or(z.literal(''));

export const nameSchema = z
  .string({ required_error: 'Name is required' })
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name cannot exceed 100 characters');

// Common schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string({ required_error: 'Please confirm your password' }),
  firstName: z.string({ required_error: 'First name is required' }).min(1, 'First name is required'),
  lastName: z.string({ required_error: 'Last name is required' }).min(1, 'Last name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const profileSchema = z.object({
  full_name: nameSchema,
  bio: bioSchema,
  phone: phoneSchema,
  avatar_url: urlSchema,
});

export const propertyListingSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
  price: z
    .number({ required_error: 'Price is required', invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0'),
  country: z
    .string({ required_error: 'Country is required' })
    .min(2, 'Please select a country'),
  city: z
    .string({ required_error: 'City is required' })
    .min(2, 'Please select a city'),
  neighborhood: z
    .string()
    .optional(),
  bedrooms: z
    .number({ invalid_type_error: 'Bedrooms must be a number' })
    .int('Bedrooms must be a whole number')
    .min(0, 'Bedrooms cannot be negative'),
  bathrooms: z
    .number({ invalid_type_error: 'Bathrooms must be a number' })
    .int('Bathrooms must be a whole number')
    .min(0, 'Bathrooms cannot be negative'),
});

export const messageSchema = z.object({
  message_text: z
    .string({ required_error: 'Message is required' })
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters'),
});

export const reviewSchema = z.object({
  rating: z
    .number({ required_error: 'Rating is required', invalid_type_error: 'Rating must be a number' })
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z
    .string()
    .max(1000, 'Review cannot exceed 1000 characters')
    .optional()
    .or(z.literal('')),
});

export const searchFiltersSchema = z.object({
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  location: z.string().optional(),
  categories: z.array(z.string()).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
});

// Export types for TypeScript
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type PropertyListingInput = z.infer<typeof propertyListingSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>;
