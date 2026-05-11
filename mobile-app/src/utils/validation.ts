/**
 * Validation Schemas using Zod
 * Matches web application validation rules
 */

import { z } from 'zod';
import { VALIDATION } from './constants';

// Helper to check minimum age
const isMinimumAge = (dob: Date): boolean => {
  const today = new Date();
  const minDate = new Date(
    today.getFullYear() - VALIDATION.MIN_AGE,
    today.getMonth(),
    today.getDate()
  );
  return dob <= minDate;
};

// Email validation
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .regex(VALIDATION.EMAIL_REGEX, 'Invalid email format');

// Password validation
export const passwordSchema = z
  .string()
  .min(VALIDATION.MIN_PASSWORD_LENGTH, `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Confirm password validation
export const confirmPasswordSchema = (passwordField: string = 'password') =>
  z.string().min(1, 'Please confirm your password');

// Full name validation
export const fullNameSchema = z
  .string()
  .min(2, 'Full name must be at least 2 characters')
  .max(100, 'Full name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces');

// Date of birth validation
export const dobSchema = z
  .date({
    required_error: 'Date of birth is required',
    invalid_type_error: 'Invalid date format',
  })
  .refine(isMinimumAge, {
    message: `You must be at least ${VALIDATION.MIN_AGE} years old`,
  });

// Gender validation
export const genderSchema = z.enum(['Male', 'Female'], {
  required_error: 'Gender is required',
  invalid_type_error: 'Please select a valid gender',
});

// Phone number validation (optional)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
  .optional()
  .or(z.literal(''));

// Registration schema
export const registrationSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  dateOfBirth: dobSchema,
  gender: genderSchema,
  phoneNumber: phoneSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// Reset password schema
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Change password schema
export const password = z.string().min(8, 'Password must be at least 8 characters long');

export const changePasswordSchema = z.object({
  oldPassword: password,
  newPassword: password,
  confirmPassword: password,
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

// Personal info schema (for medical profile)
export const personalInfoSchema = z.object({
  height: z
    .number({
      required_error: 'Height is required',
      invalid_type_error: 'Height must be a number',
    })
    .positive('Height must be positive')
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Height must not exceed 300 cm'),
  weight: z
    .number({
      required_error: 'Weight is required',
      invalid_type_error: 'Weight must be a number',
    })
    .positive('Weight must be positive')
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight must not exceed 500 kg'),
  activityLevel: z.enum(
    ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extra Active'],
    {
      required_error: 'Activity level is required',
    }
  ),
  region: z.string().optional(),
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

// Medical info schema
export const medicalInfoSchema = z.object({
  diabetesType: z.enum(['Type 1', 'Type 2', 'Gestational', 'Prediabetes'], {
    required_error: 'Diabetes type is required',
  }),
  medication: z.string().optional(),
  a1cLevel: z
    .number()
    .positive('A1C level must be positive')
    .max(20, 'A1C level seems too high')
    .optional(),
  complications: z.string().optional(),
  allergies: z.string().optional(),
});

export type MedicalInfoFormData = z.infer<typeof medicalInfoSchema>;

// Feedback schema
export const feedbackSchema = z.object({
  rating: z
    .number()
    .min(1, 'Rating is required')
    .max(5, 'Rating must be between 1 and 5'),
  comment: z
    .string()
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment must not exceed 1000 characters'),
  categories: z.array(z.string()).optional(),
  isAnonymous: z.boolean().optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;

// Export all schemas
export default {
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
  dob: dobSchema,
  gender: genderSchema,
  phone: phoneSchema,
  registration: registrationSchema,
  login: loginSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  changePassword: changePasswordSchema,
  personalInfo: personalInfoSchema,
  medicalInfo: medicalInfoSchema,
  feedback: feedbackSchema,
};
