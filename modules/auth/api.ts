import { appEnv } from '../config/env';
import { AuthSession, OtpPurpose } from './types';

const API_BASE_URL = appEnv.authApiBaseUrl;
const jsonHeaders = { 'Content-Type': 'application/json' };

type AuthApiErrorKind = 'config' | 'network' | 'server';

export class AuthApiError extends Error {
  kind: AuthApiErrorKind;
  endpoint: string;
  retryable: boolean;
  statusCode?: number;

  constructor(
    message: string,
    kind: AuthApiErrorKind,
    endpoint: string,
    options?: {
      retryable?: boolean;
      statusCode?: number;
    }
  ) {
    super(message);
    this.name = 'AuthApiError';
    this.kind = kind;
    this.endpoint = endpoint;
    this.retryable = options?.retryable ?? false;
    this.statusCode = options?.statusCode;
  }
}

const buildEndpoint = (path: string): string => `${API_BASE_URL}${path}`;

const createNetworkError = (path: string): AuthApiError => {
  return new AuthApiError(
    `Cannot reach auth backend at ${API_BASE_URL}. Start backend with "npm run dev:backend" and verify backend DB credentials.`,
    'network',
    buildEndpoint(path),
    { retryable: true }
  );
};

const parseApiError = async (response: Response, path: string): Promise<AuthApiError> => {
  try {
    const payload = await response.json();
    const message = payload?.error || `Auth request failed (${response.status})`;
    return new AuthApiError(message, 'server', buildEndpoint(path), {
      retryable: response.status >= 500,
      statusCode: response.status,
    });
  } catch {
    return new AuthApiError(`Auth request failed (${response.status})`, 'server', buildEndpoint(path), {
      retryable: response.status >= 500,
      statusCode: response.status,
    });
  }
};

const postJson = async <T>(path: string, body: unknown, accessToken?: string): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(buildEndpoint(path), {
      method: 'POST',
      headers: {
        ...jsonHeaders,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw createNetworkError(path);
  }

  if (!response.ok) {
    throw await parseApiError(response, path);
  }

  return (await response.json()) as T;
};

const getJson = async <T>(path: string, accessToken?: string): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(buildEndpoint(path), {
      method: 'GET',
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });
  } catch {
    throw createNetworkError(path);
  }

  if (!response.ok) {
    throw await parseApiError(response, path);
  }

  return (await response.json()) as T;
};

export interface RequestOtpResponse {
  requestId: string;
  expiresInSeconds: number;
  debugOtp?: string;
}

export interface VerifyOtpResponse {
  verificationToken: string;
  expiresInSeconds: number;
}

export interface AuthHealthResponse {
  status: 'ready';
}

export const checkAuthHealth = async (): Promise<AuthHealthResponse> => {
  const health = await getJson<{
    status: 'ok';
    ready: boolean;
    degraded?: boolean;
    startupError?: string;
  }>('/health');

  if (!health.ready) {
    throw new AuthApiError(
      health.startupError || 'Auth backend is running but not ready yet.',
      'server',
      buildEndpoint('/health'),
      {
        retryable: true,
        statusCode: 503,
      }
    );
  }

  return { status: 'ready' };
};

export const requestOtp = (mobile: string, purpose: OtpPurpose): Promise<RequestOtpResponse> => {
  return postJson<RequestOtpResponse>('/auth/request-otp', { mobile, purpose });
};

export const verifyOtp = (
  mobile: string,
  purpose: OtpPurpose,
  requestId: string,
  otp: string
): Promise<VerifyOtpResponse> => {
  return postJson<VerifyOtpResponse>('/auth/verify-otp', { mobile, purpose, requestId, otp });
};

export const register = (
  mobile: string,
  verificationToken: string,
  password: string,
  confirmPassword: string
): Promise<AuthSession> => {
  return postJson<AuthSession>('/auth/register', {
    mobile,
    verificationToken,
    password,
    confirmPassword,
  });
};

export const login = (mobile: string, password: string): Promise<AuthSession> => {
  return postJson<AuthSession>('/auth/login', { mobile, password });
};

export const resetPassword = (
  mobile: string,
  verificationToken: string,
  password: string,
  confirmPassword: string
): Promise<AuthSession> => {
  return postJson<AuthSession>('/auth/reset-password', {
    mobile,
    verificationToken,
    password,
    confirmPassword,
  });
};

export const changePassword = (
  accessToken: string,
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean }> => {
  return postJson<{ success: boolean }>(
    '/auth/change-password',
    { oldPassword, newPassword, confirmPassword },
    accessToken
  );
};

export const getCurrentUser = (accessToken: string): Promise<{ user: { mobile: string } }> => {
  return getJson<{ user: { mobile: string } }>('/auth/me', accessToken);
};

export const isAuthApiNetworkError = (error: unknown): boolean => {
  return error instanceof AuthApiError && error.kind === 'network';
};

export const isAuthApiRetryableError = (error: unknown): boolean => {
  return error instanceof AuthApiError && error.retryable;
};
