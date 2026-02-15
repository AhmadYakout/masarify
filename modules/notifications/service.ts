import { AppNotification, PaymentCandidate } from '../../types';

const createId = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export const buildCandidateDetectedNotification = (candidate: PaymentCandidate): AppNotification => {
  return {
    id: createId(),
    type: 'payment_candidate',
    title: 'Payment detected',
    body: `${candidate.merchant} - EGP ${candidate.amount.toFixed(2)}. Confirm or dismiss.`,
    createdAt: new Date().toISOString(),
    isRead: false,
    candidateId: candidate.id,
  };
};

export const buildSystemNotification = (title: string, body: string, candidateId?: string): AppNotification => {
  return {
    id: createId(),
    type: 'system',
    title,
    body,
    createdAt: new Date().toISOString(),
    isRead: false,
    candidateId,
  };
};

export const sendLocalPushNotification = async (notification: AppNotification): Promise<void> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    // Browser Notification API used as a web fallback until native channels are added.
    new Notification(notification.title, { body: notification.body });
    return;
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(notification.title, { body: notification.body });
    }
  }
};

export const markNotificationRead = (
  notifications: AppNotification[],
  notificationId: string
): AppNotification[] => {
  return notifications.map((notification) =>
    notification.id === notificationId ? { ...notification, isRead: true } : notification
  );
};
