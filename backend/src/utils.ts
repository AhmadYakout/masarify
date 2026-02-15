import { randomInt, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

export const createOtpCode = (): string => {
  const value = randomInt(0, 1000000);
  return value.toString().padStart(6, '0');
};

export const createOpaqueToken = (): string => randomUUID();

export const createAccessToken = (mobile: string): string => {
  return jwt.sign({ sub: mobile }, config.jwtSecret, {
    expiresIn: '7d',
    issuer: 'masarify-auth',
    audience: 'masarify-mobile-app',
  });
};

export const nowMs = (): number => Date.now();
