import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requestedProfile = (process.argv[2] || 'development').trim().toLowerCase();
const allowedProfiles = new Set(['development', 'mock', 'staging']);

if (!allowedProfiles.has(requestedProfile)) {
  console.error(`Invalid profile "${requestedProfile}". Use one of: development, mock, staging.`);
  process.exit(1);
}

const profile = requestedProfile;

const readEnv = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = fs.readFileSync(filePath, 'utf8');
  const result = {};
  data
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const index = line.indexOf('=');
      if (index <= 0) {
        return;
      }
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      result[key] = value;
    });
  return result;
};

const frontendEnvPath = path.join(root, `.env.${profile}`);
const backendEnvPath = path.join(root, 'backend', `.env.${profile}`);

const issues = [];
const warnings = [];
const notes = [];

const frontendEnv = readEnv(frontendEnvPath);
if (!frontendEnv) {
  issues.push(`Missing .env.${profile} (frontend).`);
} else {
  const apiUrl = frontendEnv.VITE_AUTH_API_BASE_URL;
  if (!apiUrl) {
    issues.push(`VITE_AUTH_API_BASE_URL is missing in .env.${profile}.`);
  } else {
    try {
      const parsed = new URL(apiUrl);
      notes.push(`Frontend API base URL: ${parsed.origin}${parsed.pathname}`);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        issues.push('VITE_AUTH_API_BASE_URL must use http or https.');
      }
      if (profile === 'staging' && ['localhost', '127.0.0.1'].includes(parsed.hostname)) {
        issues.push('Staging frontend cannot target localhost API routing.');
      }
    } catch {
      issues.push(`VITE_AUTH_API_BASE_URL is invalid: "${apiUrl}"`);
    }
  }
}

const backendEnv = readEnv(backendEnvPath);
if (!backendEnv) {
  issues.push(`Missing backend/.env.${profile}.`);
} else {
  const rawAuthStore = (backendEnv.AUTH_STORE || '').trim().toLowerCase();
  const authStore = rawAuthStore || (profile === 'mock' ? 'memory' : 'postgres');
  if (!['postgres', 'memory'].includes(authStore)) {
    issues.push('AUTH_STORE must be either "postgres" or "memory".');
  } else {
    notes.push(`Backend auth store: ${authStore}`);
  }

  if (authStore === 'postgres') {
    const databaseUrl = backendEnv.DATABASE_URL;
    if (!databaseUrl) {
      issues.push(`DATABASE_URL is missing in backend/.env.${profile}.`);
    } else {
      const lower = databaseUrl.toLowerCase();
      if (
        lower.includes('username:password') ||
        lower.includes('db_user:db_password') ||
        lower.includes('@host/') ||
        lower.includes('<') ||
        lower.includes('example')
      ) {
        issues.push('DATABASE_URL appears to contain placeholder credentials.');
      }
      try {
        const parsed = new URL(databaseUrl);
        if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
          issues.push('DATABASE_URL must use postgres:// or postgresql://');
        } else {
          notes.push(`Backend DB host: ${parsed.hostname || 'unknown'}:${parsed.port || '5432'}`);
        }
      } catch {
        issues.push('DATABASE_URL is invalid.');
      }
    }
  } else {
    if (profile === 'staging') {
      issues.push('Staging profile must use AUTH_STORE=postgres.');
    }
  }

  const jwtSecret = backendEnv.JWT_SECRET;
  if (!jwtSecret) {
    issues.push(`JWT_SECRET is missing in backend/.env.${profile}.`);
  } else {
    const lowerJwt = jwtSecret.toLowerCase();
    const weakSecrets = new Set([
      'dev-only-insecure-secret-change-me',
      'change-me-in-production',
      'replace-with-strong-random-secret',
      '<generate_at_least_24_char_secret>',
    ]);

    if (weakSecrets.has(lowerJwt)) {
      issues.push('JWT_SECRET appears to be a default/placeholder value.');
    }

    if (profile === 'staging' && jwtSecret.length < 24) {
      issues.push('JWT_SECRET is too short for staging (minimum 24 characters).');
    }
    if ((profile === 'development' || profile === 'mock') && jwtSecret.length < 16) {
      issues.push('JWT_SECRET is too short for development/mock (minimum 16 characters).');
    }
  }

  if (profile === 'mock') {
    const seedEnabled = (backendEnv.APP_SEED_TEST_USER || '').toLowerCase() === 'true';
    const testMobile = backendEnv.TEST_LOGIN_MOBILE;
    const testPassword = backendEnv.TEST_LOGIN_PASSWORD;
    const mobilePattern = /^(?:\+20|20|0)?1[0125]\d{8}$/;

    if (!seedEnabled) {
      issues.push('Mock profile requires APP_SEED_TEST_USER=true.');
    }
    if (!testMobile || !mobilePattern.test(testMobile)) {
      issues.push('Mock profile requires valid TEST_LOGIN_MOBILE.');
    }
    if (!testPassword || testPassword.length < 8) {
      issues.push('Mock profile requires TEST_LOGIN_PASSWORD with at least 8 characters.');
    }
  }

  if (profile === 'staging') {
    const seedEnabled = (backendEnv.APP_SEED_TEST_USER || '').toLowerCase() === 'true';
    if (seedEnabled) {
      issues.push('Staging profile cannot enable APP_SEED_TEST_USER.');
    }
  }

  const port = backendEnv.PORT || '4000';
  notes.push(`Backend configured port: ${port}`);
}

const frontendUrl = frontendEnv?.VITE_AUTH_API_BASE_URL;
const backendPort = backendEnv?.PORT || '4000';
if (frontendUrl) {
  try {
    const parsed = new URL(frontendUrl);
    if (parsed.port && parsed.port !== backendPort) {
      warnings.push(`Port mismatch: frontend targets ${parsed.port} but backend PORT is ${backendPort}.`);
    }
  } catch {
    // Already reported above.
  }
}

if (issues.length > 0) {
  console.error(`Masarify doctor (${profile}) found blocking issues:`);
  issues.forEach((issue) => console.error(`- ${issue}`));
  if (warnings.length) {
    console.error('Warnings:');
    warnings.forEach((warning) => console.error(`- ${warning}`));
  }
  if (notes.length) {
    console.error('Context:');
    notes.forEach((note) => console.error(`- ${note}`));
  }
  process.exit(1);
}

console.log(`Masarify doctor (${profile}) passed.`);
if (warnings.length) {
  console.log('Warnings:');
  warnings.forEach((warning) => console.log(`- ${warning}`));
}
if (notes.length) {
  console.log('Context:');
  notes.forEach((note) => console.log(`- ${note}`));
}
