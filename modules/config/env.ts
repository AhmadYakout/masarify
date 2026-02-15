type RuntimeEnvironment = 'development' | 'mock' | 'staging' | 'production';

const normalizeRuntimeEnvironment = (): RuntimeEnvironment => {
  const mode = import.meta.env.MODE?.toLowerCase();
  if (mode === 'mock' || mode === 'staging' || mode === 'production') {
    return mode;
  }
  return 'development';
};

const runtimeEnvironment = normalizeRuntimeEnvironment();
const isProductionLike = runtimeEnvironment === 'staging' || runtimeEnvironment === 'production';

const getRequiredEnv = (key: 'VITE_AUTH_API_BASE_URL'): string => {
  const value = import.meta.env[key];
  if (!value || typeof value !== 'string') {
    throw new Error(`${key} is required. Set it in your .env.${runtimeEnvironment} file.`);
  }
  return value.trim();
};

const normalizeApiBaseUrl = (rawUrl: string): string => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid VITE_AUTH_API_BASE_URL: "${rawUrl}"`);
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('VITE_AUTH_API_BASE_URL must use http or https');
  }

  const isLocalHost = ['localhost', '127.0.0.1'].includes(parsedUrl.hostname);
  if (isProductionLike && isLocalHost) {
    throw new Error('VITE_AUTH_API_BASE_URL cannot target localhost in staging/production modes');
  }

  return rawUrl.replace(/\/+$/, '');
};

export const appEnv = {
  mode: runtimeEnvironment,
  isProductionLike,
  authApiBaseUrl: normalizeApiBaseUrl(getRequiredEnv('VITE_AUTH_API_BASE_URL')),
  testLoginMobile: import.meta.env.VITE_TEST_LOGIN_MOBILE?.trim() || '',
  testLoginPassword: import.meta.env.VITE_TEST_LOGIN_PASSWORD?.trim() || '',
};
