import { AppNotification } from '../../types';
import { PERSISTENCE_KEYS, loadPersistedState, savePersistedState } from '../persistence';

export const loadAppNotifications = async (): Promise<AppNotification[]> => {
  const stored = await loadPersistedState<unknown>(PERSISTENCE_KEYS.notifications);
  if (!Array.isArray(stored)) {
    return [];
  }

  return stored.filter(
    (entry): entry is AppNotification =>
      !!entry &&
      typeof entry === 'object' &&
      typeof (entry as Partial<AppNotification>).id === 'string' &&
      typeof (entry as Partial<AppNotification>).title === 'string' &&
      typeof (entry as Partial<AppNotification>).body === 'string' &&
      typeof (entry as Partial<AppNotification>).createdAt === 'string' &&
      typeof (entry as Partial<AppNotification>).isRead === 'boolean'
  );
};

export const saveAppNotifications = async (notifications: AppNotification[]): Promise<void> => {
  await savePersistedState(PERSISTENCE_KEYS.notifications, notifications);
};
