import { AuthSession } from './types';
import { PERSISTENCE_KEYS, loadPersistedState, removePersistedState, savePersistedState } from '../persistence';

const sanitizeAuthSession = (value: unknown): AuthSession | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const parsed = value as Partial<AuthSession>;
  if (!parsed.accessToken || typeof parsed.accessToken !== 'string') {
    return null;
  }

  if (!parsed.user || typeof parsed.user !== 'object') {
    return null;
  }

  if (typeof parsed.user.mobile !== 'string' || !parsed.user.mobile.trim()) {
    return null;
  }

  return {
    accessToken: parsed.accessToken,
    user: {
      mobile: parsed.user.mobile,
      createdAt: parsed.user.createdAt,
      updatedAt: parsed.user.updatedAt,
    },
  };
};

export const loadAuthSession = async (): Promise<AuthSession | null> => {
  const stored = await loadPersistedState<unknown>(PERSISTENCE_KEYS.authSession);
  return sanitizeAuthSession(stored);
};

export const saveAuthSession = async (session: AuthSession | null): Promise<void> => {
  if (!session) {
    await removePersistedState(PERSISTENCE_KEYS.authSession);
    return;
  }
  await savePersistedState(PERSISTENCE_KEYS.authSession, session);
};
