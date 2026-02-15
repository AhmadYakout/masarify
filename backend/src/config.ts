import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotEnv } from 'dotenv';

type RuntimeEnvironment = 'development' | 'mock' | 'staging' | 'production';
type AuthStoreMode = 'postgres' | 'memory';

const supportedEnvironments = new Set<RuntimeEnvironment>([
  'development',
  'mock',
  'staging',
  'production',
]);
const supportedAuthStoreModes = new Set<AuthStoreMode>(['postgres', 'memory']);

const normalizeRuntimeEnvironment = (): RuntimeEnvironment => {
  const appEnvironment = (process.env.APP_ENV || '').trim().toLowerCase();
  if (supportedEnvironments.has(appEnvironment as RuntimeEnvironment)) {
    return appEnvironment as RuntimeEnvironment;
  }
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

const runtimeEnvironment = normalizeRuntimeEnvironment();
const backendRootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const primaryEnvironmentFile = `.env.${runtimeEnvironment}`;
const loadedEnvironmentFiles: string[] = [];

const loadEnvironmentFile = (fileName: string): void => {
  const fullPath = path.resolve(backendRootDirectory, fileName);
  if (!fs.existsSync(fullPath)) {
    return;
  }
  loadDotEnv({ path: fullPath, override: false });
  loadedEnvironmentFiles.push(fileName);
};

const loadEnvironment = (): void => {
  // Load mode-specific values first, then fallbacks.
  loadEnvironmentFile(primaryEnvironmentFile);
  if (runtimeEnvironment === 'mock') {
    loadEnvironmentFile('.env.development');
  }
  if (runtimeEnvironment === 'staging') {
    loadEnvironmentFile('.env.production');
  }
  loadEnvironmentFile('.env');
};

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const booleanFromEnv = (value: string | undefined, fallback: boolean): boolean => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }
  return fallback;
};

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} is required for backend startup`);
  }
  return value;
};

const isProductionLike = runtimeEnvironment === 'staging' || runtimeEnvironment === 'production';

const normalizeAuthStoreMode = (): AuthStoreMode => {
  const rawValue = (process.env.AUTH_STORE || '').trim().toLowerCase();
  if (supportedAuthStoreModes.has(rawValue as AuthStoreMode)) {
    return rawValue as AuthStoreMode;
  }

  // Mock mode should run out-of-the-box without requiring local Postgres setup.
  return runtimeEnvironment === 'mock' ? 'memory' : 'postgres';
};

const validateDatabaseUrl = (value: string): string => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('DATABASE_URL is invalid. Expected a full postgres connection URL.');
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== 'postgres:' && protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must use postgres:// or postgresql://');
  }

  const username = decodeURIComponent(parsed.username || '').toLowerCase();
  const password = decodeURIComponent(parsed.password || '').toLowerCase();
  const host = (parsed.hostname || '').toLowerCase();
  const hasPlaceholderCredentials =
    username === 'username' ||
    username === 'db_user' ||
    password === 'password' ||
    password === 'db_password' ||
    host === 'host' ||
    value.includes('<');

  if (hasPlaceholderCredentials && isProductionLike) {
    throw new Error('DATABASE_URL contains placeholder values, which is not allowed in staging/production.');
  }

  return value;
};

const validateJwtSecret = (value: string): string => {
  const normalized = value.trim();
  const weakDefaults = new Set([
    'dev-only-insecure-secret-change-me',
    'change-me-in-production',
    'replace-with-strong-random-secret',
    '<generate_at_least_24_char_secret>',
  ]);

  if (weakDefaults.has(normalized.toLowerCase())) {
    throw new Error('JWT_SECRET is using a default/placeholder value. Set a strong unique secret.');
  }

  if (isProductionLike && normalized.length < 24) {
    throw new Error('JWT_SECRET is too weak for staging/production (minimum 24 characters).');
  }

  if (!isProductionLike && normalized.length < 16) {
    throw new Error('JWT_SECRET is too weak for development/mock (minimum 16 characters).');
  }

  return normalized;
};

const testMobilePattern = /^(?:\+20|20|0)?1[0125]\d{8}$/;

const validateSeedUser = (
  enabled: boolean,
  mobile: string | undefined,
  password: string | undefined
): { mobile: string; password: string } | null => {
  if (!enabled) {
    return null;
  }

  if (isProductionLike) {
    throw new Error('APP_SEED_TEST_USER cannot be enabled in staging/production.');
  }

  if (!mobile || !password) {
    throw new Error('TEST_LOGIN_MOBILE and TEST_LOGIN_PASSWORD are required when APP_SEED_TEST_USER=true.');
  }

  if (!testMobilePattern.test(mobile)) {
    throw new Error('TEST_LOGIN_MOBILE must be a valid Egyptian mobile number.');
  }

  if (password.length < 8) {
    throw new Error('TEST_LOGIN_PASSWORD must be at least 8 characters.');
  }

  return { mobile, password };
};

loadEnvironment();

const authStoreMode = normalizeAuthStoreMode();
const databaseUrl =
  authStoreMode === 'postgres' ? validateDatabaseUrl(getRequiredEnv('DATABASE_URL')) : null;
const jwtSecret = validateJwtSecret(getRequiredEnv('JWT_SECRET'));

const seedEnabled = booleanFromEnv(process.env.APP_SEED_TEST_USER, runtimeEnvironment === 'mock');
const validatedSeed = validateSeedUser(
  seedEnabled,
  process.env.TEST_LOGIN_MOBILE?.trim(),
  process.env.TEST_LOGIN_PASSWORD?.trim()
);

export const config = {
  environment: runtimeEnvironment,
  primaryEnvironmentFile,
  loadedEnvironmentFiles,
  isMock: runtimeEnvironment === 'mock',
  isStaging: runtimeEnvironment === 'staging',
  isProduction: runtimeEnvironment === 'production',
  isProductionLike,
  port: numberFromEnv(process.env.PORT, 4000),
  databaseUrl,
  jwtSecret,
  authStore: {
    mode: authStoreMode,
    usesDatabase: authStoreMode === 'postgres',
  },
  otp: {
    ttlMs: numberFromEnv(process.env.OTP_TTL_MS, 5 * 60 * 1000),
    verificationTokenTtlMs: numberFromEnv(process.env.OTP_VERIFICATION_TTL_MS, 10 * 60 * 1000),
    maxVerifyAttempts: numberFromEnv(process.env.OTP_MAX_VERIFY_ATTEMPTS, 5),
    maxRequestsPerWindow: numberFromEnv(process.env.OTP_MAX_REQUESTS_PER_WINDOW, 5),
    rateLimitWindowMs: numberFromEnv(process.env.OTP_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
  },
  seedUser: {
    enabled: !!validatedSeed,
    mobile: validatedSeed?.mobile,
    password: validatedSeed?.password,
    overwrite: booleanFromEnv(process.env.APP_SEED_TEST_USER_OVERWRITE, false),
  },
};
