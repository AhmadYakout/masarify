import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { OtpPurpose } from './types.js';
import { createAccessToken, createOpaqueToken, createOtpCode, nowMs } from './utils.js';

interface MemoryUser {
  mobile: string;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
}

interface MemoryOtpRequest {
  requestId: string;
  mobile: string;
  purpose: OtpPurpose;
  code: string;
  expiresAt: number;
  verifyAttempts: number;
}

interface MemoryVerificationToken {
  token: string;
  mobile: string;
  purpose: OtpPurpose;
  expiresAt: number;
}

const memoryUsers = new Map<string, MemoryUser>();
const memoryOtpRequests = new Map<string, MemoryOtpRequest>();
const memoryVerificationTokens = new Map<string, MemoryVerificationToken>();
const memoryOtpRateEvents = new Map<string, number[]>();

const hashPassword = async (password: string): Promise<string> => bcrypt.hash(password, 10);
const comparePassword = async (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);

const toIso = (valueMs: number): string => new Date(valueMs).toISOString();

const requirePasswordMatch = (password: string, confirmPassword: string): void => {
  if (password !== confirmPassword) {
    throw new Error('Password and confirm password must match');
  }
};

export const enforceOtpRateLimit = async (mobile: string): Promise<void> => {
  const now = nowMs();
  const cutoff = now - config.otp.rateLimitWindowMs;
  const retained = (memoryOtpRateEvents.get(mobile) || []).filter((requestedAt) => requestedAt >= cutoff);

  if (retained.length >= config.otp.maxRequestsPerWindow) {
    throw new Error('OTP rate limit exceeded. Please retry later.');
  }

  retained.push(now);
  memoryOtpRateEvents.set(mobile, retained);
};

export const createOtpRequest = async (mobile: string, purpose: OtpPurpose) => {
  const requestId = createOpaqueToken();
  const code = createOtpCode();
  const expiresAt = nowMs() + config.otp.ttlMs;

  memoryOtpRequests.set(requestId, {
    requestId,
    mobile,
    purpose,
    code,
    expiresAt,
    verifyAttempts: 0,
  });

  return {
    requestId,
    expiresInSeconds: Math.floor(config.otp.ttlMs / 1000),
    debugOtp: config.isProductionLike ? undefined : code,
  };
};

export const verifyOtpRequest = async (
  requestId: string,
  mobile: string,
  purpose: OtpPurpose,
  otp: string
) => {
  const record = memoryOtpRequests.get(requestId);
  if (!record) {
    throw new Error('OTP request not found');
  }

  if (record.mobile !== mobile || record.purpose !== purpose) {
    throw new Error('OTP request does not match provided identity');
  }

  if (record.expiresAt < nowMs()) {
    memoryOtpRequests.delete(requestId);
    throw new Error('OTP has expired');
  }

  if (record.verifyAttempts >= config.otp.maxVerifyAttempts) {
    memoryOtpRequests.delete(requestId);
    throw new Error('OTP verification attempts exceeded');
  }

  if (record.code !== otp) {
    record.verifyAttempts += 1;
    memoryOtpRequests.set(requestId, record);
    throw new Error('Invalid OTP');
  }

  memoryOtpRequests.delete(requestId);

  const token = createOpaqueToken();
  const expiresAt = nowMs() + config.otp.verificationTokenTtlMs;
  memoryVerificationTokens.set(token, {
    token,
    mobile,
    purpose,
    expiresAt,
  });

  return {
    verificationToken: token,
    expiresInSeconds: Math.floor(config.otp.verificationTokenTtlMs / 1000),
  };
};

export const consumeVerificationToken = async (
  token: string,
  mobile: string,
  purpose: OtpPurpose
): Promise<void> => {
  const record = memoryVerificationTokens.get(token);
  if (!record) {
    throw new Error('Verification token not found');
  }

  if (record.expiresAt < nowMs()) {
    memoryVerificationTokens.delete(token);
    throw new Error('Verification token expired');
  }

  if (record.mobile !== mobile || record.purpose !== purpose) {
    throw new Error('Verification token mismatch');
  }

  memoryVerificationTokens.delete(token);
};

export const registerUser = async (
  mobile: string,
  verificationToken: string,
  password: string,
  confirmPassword: string
) => {
  requirePasswordMatch(password, confirmPassword);

  if (memoryUsers.has(mobile)) {
    throw new Error('User already exists');
  }

  await consumeVerificationToken(verificationToken, mobile, 'register');

  const now = nowMs();
  memoryUsers.set(mobile, {
    mobile,
    passwordHash: await hashPassword(password),
    createdAt: now,
    updatedAt: now,
  });

  return {
    accessToken: createAccessToken(mobile),
    user: {
      mobile,
      createdAt: toIso(now),
    },
  };
};

export const loginUser = async (mobile: string, password: string) => {
  const user = memoryUsers.get(mobile);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  return {
    accessToken: createAccessToken(mobile),
    user: {
      mobile,
      createdAt: toIso(user.createdAt),
    },
  };
};

export const resetPassword = async (
  mobile: string,
  verificationToken: string,
  password: string,
  confirmPassword: string
) => {
  requirePasswordMatch(password, confirmPassword);

  const user = memoryUsers.get(mobile);
  if (!user) {
    throw new Error('User not found');
  }

  await consumeVerificationToken(verificationToken, mobile, 'reset');

  const updatedAt = nowMs();
  memoryUsers.set(mobile, {
    ...user,
    passwordHash: await hashPassword(password),
    updatedAt,
  });

  return {
    accessToken: createAccessToken(mobile),
    user: {
      mobile,
      updatedAt: toIso(updatedAt),
    },
  };
};

export const changePassword = async (
  mobile: string,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
) => {
  requirePasswordMatch(newPassword, confirmPassword);

  const user = memoryUsers.get(mobile);
  if (!user) {
    throw new Error('User not found');
  }

  const oldMatches = await comparePassword(oldPassword, user.passwordHash);
  if (!oldMatches) {
    throw new Error('Old password is incorrect');
  }

  memoryUsers.set(mobile, {
    ...user,
    passwordHash: await hashPassword(newPassword),
    updatedAt: nowMs(),
  });

  return { success: true };
};

export const ensureSeedUser = async (
  mobile: string,
  password: string,
  overwrite = false
): Promise<'created' | 'updated' | 'existing'> => {
  const existing = memoryUsers.get(mobile);
  if (!existing) {
    const now = nowMs();
    memoryUsers.set(mobile, {
      mobile,
      passwordHash: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    });
    return 'created';
  }

  if (!overwrite) {
    return 'existing';
  }

  memoryUsers.set(mobile, {
    ...existing,
    passwordHash: await hashPassword(password),
    updatedAt: nowMs(),
  });
  return 'updated';
};
