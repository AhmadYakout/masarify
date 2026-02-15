export interface IngestionPermissionSnapshot {
  smsGranted: boolean;
  notificationsGranted: boolean;
  notificationListenerEnabled: boolean;
  platform: 'android' | 'web';
}

type PermissionUpdateHandler = (snapshot: IngestionPermissionSnapshot) => void;

declare global {
  interface Window {
    MasarifyNativePermissions?: {
      getPermissionSnapshot: () => string;
      requestSmsPermission: () => void;
      requestNotificationPermission: () => void;
      openNotificationListenerSettings: () => void;
    };
    masarifyNativePermissionsUpdate?: (snapshot: unknown) => void;
  }
}

const FALLBACK_SNAPSHOT: IngestionPermissionSnapshot = {
  smsGranted: false,
  notificationsGranted: false,
  notificationListenerEnabled: false,
  platform: 'web',
};

const parseSnapshot = (value: unknown): IngestionPermissionSnapshot | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const parsed = value as Partial<IngestionPermissionSnapshot>;
  if (
    typeof parsed.smsGranted !== 'boolean' ||
    typeof parsed.notificationsGranted !== 'boolean' ||
    typeof parsed.notificationListenerEnabled !== 'boolean'
  ) {
    return null;
  }

  return {
    smsGranted: parsed.smsGranted,
    notificationsGranted: parsed.notificationsGranted,
    notificationListenerEnabled: parsed.notificationListenerEnabled,
    platform: parsed.platform === 'android' ? 'android' : 'web',
  };
};

const getWebNotificationPermission = (): boolean => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
};

export const getCurrentIngestionPermissions = (): IngestionPermissionSnapshot => {
  if (typeof window === 'undefined') {
    return FALLBACK_SNAPSHOT;
  }

  const nativePermissions = window.MasarifyNativePermissions;
  if (nativePermissions?.getPermissionSnapshot) {
    try {
      const rawSnapshot = nativePermissions.getPermissionSnapshot();
      const parsed = JSON.parse(rawSnapshot) as unknown;
      const snapshot = parseSnapshot(parsed);
      if (snapshot) {
        return snapshot;
      }
    } catch {
      return FALLBACK_SNAPSHOT;
    }
  }

  return {
    smsGranted: false,
    notificationsGranted: getWebNotificationPermission(),
    notificationListenerEnabled: false,
    platform: 'web',
  };
};

export const requestSmsPermission = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.MasarifyNativePermissions?.requestSmsPermission?.();
};

export const requestNotificationPermission = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }

  const nativePermissions = window.MasarifyNativePermissions;
  if (nativePermissions?.requestNotificationPermission) {
    nativePermissions.requestNotificationPermission();
    return;
  }

  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

export const openNotificationListenerSettings = (): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.MasarifyNativePermissions?.openNotificationListenerSettings?.();
};

export const attachIngestionPermissionsBridge = (
  handler: PermissionUpdateHandler
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.masarifyNativePermissionsUpdate = (snapshot: unknown) => {
    const parsed = parseSnapshot(snapshot);
    if (!parsed) {
      return;
    }
    handler(parsed);
  };

  return () => {
    delete window.masarifyNativePermissionsUpdate;
  };
};
