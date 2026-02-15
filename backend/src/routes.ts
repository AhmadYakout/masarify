import { NextFunction, Request, Response, Router } from 'express';
import { ZodError } from 'zod';
import {
  changePassword,
  createOtpRequest,
  enforceOtpRateLimit,
  loginUser,
  registerUser,
  resetPassword,
  verifyOtpRequest,
} from './authService.js';
import { config } from './config.js';
import { requireAuth, type AuthenticatedRequest } from './middleware.js';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  requestOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from './validation.js';
import { getBackendRuntimeState } from './runtimeState.js';

export const router = Router();

const handleError = (error: unknown, statusIfKnown = 400) => {
  if (error instanceof ZodError) {
    return {
      status: 400,
      payload: {
        error: 'Validation failed',
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    };
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  return {
    status: statusIfKnown,
    payload: { error: message },
  };
};

router.get('/health', (_req, res) => {
  const runtime = getBackendRuntimeState();
  res.json({
    status: 'ok',
    environment: config.environment,
    authStore: config.authStore.mode,
    ready: runtime.ready,
    degraded: !runtime.ready,
    startupError: runtime.startupError || undefined,
  });
});

router.get('/health/ready', async (_req, res) => {
  const runtime = getBackendRuntimeState();
  if (!runtime.ready) {
    res.status(503).json({
      error: runtime.startupError || 'Database unavailable',
      status: 'degraded',
    });
    return;
  }
  res.json({ status: 'ready' });
});

const requireBackendReady = (_req: Request, res: Response, next: NextFunction) => {
  const runtime = getBackendRuntimeState();
  if (!runtime.ready) {
    res.status(503).json({
      error: runtime.startupError || 'Backend is not ready yet',
      status: 'degraded',
    });
    return;
  }
  next();
};

router.use('/auth', requireBackendReady);

router.post('/auth/request-otp', async (req, res) => {
  try {
    const payload = requestOtpSchema.parse(req.body);
    await enforceOtpRateLimit(payload.mobile);
    const result = await createOtpRequest(payload.mobile, payload.purpose);
    res.status(201).json(result);
  } catch (error) {
    const response = handleError(error);
    res.status(response.status).json(response.payload);
  }
});

router.post('/auth/verify-otp', async (req, res) => {
  try {
    const payload = verifyOtpSchema.parse(req.body);
    const result = await verifyOtpRequest(
      payload.requestId,
      payload.mobile,
      payload.purpose,
      payload.otp
    );
    res.status(200).json(result);
  } catch (error) {
    const response = handleError(error);
    res.status(response.status).json(response.payload);
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(
      payload.mobile,
      payload.verificationToken,
      payload.password,
      payload.confirmPassword
    );
    res.status(201).json(result);
  } catch (error) {
    const response = handleError(error);
    res.status(response.status).json(response.payload);
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload.mobile, payload.password);
    res.status(200).json(result);
  } catch (error) {
    const response = handleError(error, 401);
    res.status(response.status).json(response.payload);
  }
});

router.post('/auth/reset-password', async (req, res) => {
  try {
    const payload = resetPasswordSchema.parse(req.body);
    const result = await resetPassword(
      payload.mobile,
      payload.verificationToken,
      payload.password,
      payload.confirmPassword
    );
    res.status(200).json(result);
  } catch (error) {
    const response = handleError(error);
    res.status(response.status).json(response.payload);
  }
});

router.post('/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const payload = changePasswordSchema.parse(req.body);
    if (!req.authMobile) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await changePassword(
      req.authMobile,
      payload.oldPassword,
      payload.newPassword,
      payload.confirmPassword
    );
    res.status(200).json(result);
  } catch (error) {
    const response = handleError(error);
    res.status(response.status).json(response.payload);
  }
});

router.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.authMobile) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  res.status(200).json({
    user: {
      mobile: req.authMobile,
    },
  });
});
