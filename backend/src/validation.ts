import { z } from 'zod';

const mobilePattern = /^(?:\+20|20|0)?1[0125]\d{8}$/;

export const mobileSchema = z
  .string()
  .trim()
  .regex(mobilePattern, 'Invalid Egyptian mobile number format');

export const otpPurposeSchema = z.enum(['register', 'reset']);

export const requestOtpSchema = z.object({
  mobile: mobileSchema,
  purpose: otpPurposeSchema,
});

export const verifyOtpSchema = z.object({
  requestId: z.string().uuid(),
  mobile: mobileSchema,
  purpose: otpPurposeSchema,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const registerSchema = z.object({
  mobile: mobileSchema,
  verificationToken: z.string().uuid(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
});

export const loginSchema = z.object({
  mobile: mobileSchema,
  password: z.string().min(1, 'Password is required'),
});

export const resetPasswordSchema = z.object({
  mobile: mobileSchema,
  verificationToken: z.string().uuid(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
});
