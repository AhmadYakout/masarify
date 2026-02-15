import bcrypt from 'bcryptjs';
import { config } from './config.js';
import * as memoryAuthService from './authServiceMemory.js';
import { OtpPurpose } from './types.js';
import { createAccessToken, createOpaqueToken, createOtpCode, nowMs } from './utils.js';
import { sql } from './db.js';

const hashPassword = async (password: string): Promise<string> => bcrypt.hash(password, 10);
const comparePassword = async (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);

const toIso = (value: string | Date): string => new Date(value).toISOString();

export const enforceOtpRateLimit = async (mobile: string): Promise<void> => {
  if (config.authStore.mode === 'memory') {
    await memoryAuthService.enforceOtpRateLimit(mobile);
    return;
  }

  const cutoff = new Date(nowMs() - config.otp.rateLimitWindowMs);
  await sql`delete from otp_rate_events where mobile = ${mobile} and requested_at < ${cutoff}`;

  const rows = await sql<{ count: string }[]>`
    select count(*)::text as count
    from otp_rate_events
    where mobile = ${mobile}
  `;
  const requestCount = Number(rows[0]?.count ?? '0');

  if (requestCount >= config.otp.maxRequestsPerWindow) {
    throw new Error('OTP rate limit exceeded. Please retry later.');
  }

  await sql`insert into otp_rate_events (mobile, requested_at) values (${mobile}, ${new Date()})`;
};

export const createOtpRequest = async (mobile: string, purpose: OtpPurpose) => {
  if (config.authStore.mode === 'memory') {
    return memoryAuthService.createOtpRequest(mobile, purpose);
  }

  const requestId = createOpaqueToken();
  const record = {
    requestId,
    mobile,
    purpose,
    code: createOtpCode(),
    expiresAt: new Date(nowMs() + config.otp.ttlMs),
    verifyAttempts: 0,
  };

  await sql`
    insert into otp_requests (request_id, mobile, purpose, code, expires_at, verify_attempts)
    values (${record.requestId}, ${record.mobile}, ${record.purpose}, ${record.code}, ${record.expiresAt}, ${record.verifyAttempts})
  `;

  return {
    requestId,
    expiresInSeconds: Math.floor(config.otp.ttlMs / 1000),
    debugOtp: config.isProductionLike ? undefined : record.code,
  };
};

export const verifyOtpRequest = async (
  requestId: string,
  mobile: string,
  purpose: OtpPurpose,
  otp: string
) => {
  if (config.authStore.mode === 'memory') {
    return memoryAuthService.verifyOtpRequest(requestId, mobile, purpose, otp);
  }

  const records = await sql<{
    request_id: string;
    mobile: string;
    purpose: OtpPurpose;
    code: string;
    expires_at: Date;
    verify_attempts: number;
  }[]>`
    select request_id, mobile, purpose, code, expires_at, verify_attempts
    from otp_requests
    where request_id = ${requestId}
    limit 1
  `;
  const record = records[0];

  if (!record) {
    throw new Error('OTP request not found');
  }

  if (record.mobile !== mobile || record.purpose !== purpose) {
    throw new Error('OTP request does not match provided identity');
  }

  if (new Date(record.expires_at).getTime() < nowMs()) {
    await sql`delete from otp_requests where request_id = ${requestId}`;
    throw new Error('OTP has expired');
  }

  if (record.verify_attempts >= config.otp.maxVerifyAttempts) {
    await sql`delete from otp_requests where request_id = ${requestId}`;
    throw new Error('OTP verification attempts exceeded');
  }

  if (record.code !== otp) {
    await sql`
      update otp_requests
      set verify_attempts = verify_attempts + 1
      where request_id = ${requestId}
    `;
    throw new Error('Invalid OTP');
  }

  await sql`delete from otp_requests where request_id = ${requestId}`;
  const token = createOpaqueToken();
  const expiresAt = new Date(nowMs() + config.otp.verificationTokenTtlMs);
  await sql`
    insert into verification_tokens (token, mobile, purpose, expires_at)
    values (${token}, ${mobile}, ${purpose}, ${expiresAt})
  `;

  return {
    verificationToken: token,
    expiresInSeconds: Math.floor(config.otp.verificationTokenTtlMs / 1000),
  };
};

const consumeVerificationToken = async (
  token: string,
  mobile: string,
  purpose: OtpPurpose
): Promise<void> => {
  if (config.authStore.mode === 'memory') {
    await memoryAuthService.consumeVerificationToken(token, mobile, purpose);
    return;
  }

  const records = await sql<{
    token: string;
    mobile: string;
    purpose: OtpPurpose;
    expires_at: Date;
  }[]>`
    select token, mobile, purpose, expires_at
    from verification_tokens
    where token = ${token}
    limit 1
  `;
  const record = records[0];

  if (!record) {
    throw new Error('Verification token not found');
  }

  if (new Date(record.expires_at).getTime() < nowMs()) {
    await sql`delete from verification_tokens where token = ${token}`;
    throw new Error('Verification token expired');
  }

  if (record.mobile !== mobile || record.purpose !== purpose) {
    throw new Error('Verification token mismatch');
  }

  await sql`delete from verification_tokens where token = ${token}`;
};

const requirePasswordMatch = (password: string, confirmPassword: string): void => {
  if (password !== confirmPassword) {
    throw new Error('Password and confirm password must match');
  }
};

export const registerUser = async (
  mobile: string,
  verificationToken: string,
  password: string,
  confirmPassword: string
) => {
  if (config.authStore.mode === 'memory') {
    return memoryAuthService.registerUser(mobile, verificationToken, password, confirmPassword);
  }

  requirePasswordMatch(password, confirmPassword);

  const existingRows = await sql<{ mobile: string }[]>`
    select mobile from users where mobile = ${mobile} limit 1
  `;
  if (existingRows.length > 0) {
    throw new Error('User already exists');
  }

  await consumeVerificationToken(verificationToken, mobile, 'register');

  const passwordHash = await hashPassword(password);
  const insertedRows = await sql<{ mobile: string; created_at: Date }[]>`
    insert into users (mobile, password_hash, created_at, updated_at)
    values (${mobile}, ${passwordHash}, ${new Date()}, ${new Date()})
    returning mobile, created_at
  `;
  const user = insertedRows[0];

  return {
    accessToken: createAccessToken(mobile),
    user: { mobile: user.mobile, createdAt: toIso(user.created_at) },
  };
};

export const loginUser = async (mobile: string, password: string) => {
  if (config.authStore.mode === 'memory') {
    return memoryAuthService.loginUser(mobile, password);
  }

  const rows = await sql<{ mobile: string; password_hash: string; created_at: Date }[]>`
    select mobile, password_hash, created_at
    from users
    where mobile = ${mobile}
    limit 1
  `;
  const user = rows[0];

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  return {
    accessToken: createAccessToken(mobile),
    user: { mobile: user.mobile, createdAt: toIso(user.created_at) },
  };
};

export const resetPassword = async (
  mobile: string,
  verificationToken: string,
  password: string,
  confirmPassword: string
) => {
  if (config.authStore.mode === 'memory') {
    return memoryAuthService.resetPassword(mobile, verificationToken, password, confirmPassword);
  }

  requirePasswordMatch(password, confirmPassword);

  const userRows = await sql<{ mobile: string }[]>`
    select mobile from users where mobile = ${mobile} limit 1
  `;
  const user = userRows[0];
  if (!user) {
    throw new Error('User not found');
  }

  await consumeVerificationToken(verificationToken, mobile, 'reset');
  const newHash = await hashPassword(password);
  const updatedRows = await sql<{ mobile: string; updated_at: Date }[]>`
    update users
    set password_hash = ${newHash}, updated_at = ${new Date()}
    where mobile = ${mobile}
    returning mobile, updated_at
  `;
  const updated = updatedRows[0];

  return {
    accessToken: createAccessToken(mobile),
    user: { mobile: updated.mobile, updatedAt: toIso(updated.updated_at) },
  };
};

export const changePassword = async (
  mobile: string,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
) => {
  if (config.authStore.mode === 'memory') {
    return memoryAuthService.changePassword(mobile, oldPassword, newPassword, confirmPassword);
  }

  requirePasswordMatch(newPassword, confirmPassword);

  const rows = await sql<{ mobile: string; password_hash: string }[]>`
    select mobile, password_hash from users where mobile = ${mobile} limit 1
  `;
  const user = rows[0];
  if (!user) {
    throw new Error('User not found');
  }

  const oldPasswordMatches = await comparePassword(oldPassword, user.password_hash);
  if (!oldPasswordMatches) {
    throw new Error('Old password is incorrect');
  }

  const newHash = await hashPassword(newPassword);
  await sql`
    update users
    set password_hash = ${newHash}, updated_at = ${new Date()}
    where mobile = ${mobile}
  `;

  return { success: true };
};

export const ensureSeedUser = async (
  mobile: string,
  password: string,
  overwrite = false
): Promise<'created' | 'updated' | 'existing'> => {
  if (config.authStore.mode === 'memory') {
    return memoryAuthService.ensureSeedUser(mobile, password, overwrite);
  }

  const existingRows = await sql<{ mobile: string }[]>`
    select mobile
    from users
    where mobile = ${mobile}
    limit 1
  `;
  const exists = existingRows.length > 0;
  const passwordHash = await hashPassword(password);

  if (!exists) {
    await sql`
      insert into users (mobile, password_hash, created_at, updated_at)
      values (${mobile}, ${passwordHash}, ${new Date()}, ${new Date()})
    `;
    return 'created';
  }

  if (!overwrite) {
    return 'existing';
  }

  await sql`
    update users
    set password_hash = ${passwordHash}, updated_at = ${new Date()}
    where mobile = ${mobile}
  `;
  return 'updated';
};
