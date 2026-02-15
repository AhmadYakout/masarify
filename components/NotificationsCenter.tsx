import React from 'react';
import { AppNotification, PaymentCandidate } from '../types';

interface NotificationsCenterProps {
  candidates: PaymentCandidate[];
  notifications: AppNotification[];
  onConfirmCandidate: (candidateId: string) => void;
  onDismissCandidate: (candidateId: string) => void;
  onMarkNotificationRead: (notificationId: string) => void;
}

const formatDateTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  candidates,
  notifications,
  onConfirmCandidate,
  onDismissCandidate,
  onMarkNotificationRead,
}) => {
  const pendingCandidates = candidates.filter((candidate) => candidate.status === 'pending');

  return (
    <div className="p-4 pb-28 space-y-6 min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Pending Confirmations</h3>
          <span className="text-xs font-medium text-cib-blue bg-blue-50 px-2 py-1 rounded-full">
            {pendingCandidates.length} pending
          </span>
        </div>

        {pendingCandidates.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-4 text-sm text-gray-500">
            No pending payment confirmations.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingCandidates.map((candidate) => (
              <div key={candidate.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{candidate.merchant}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      EGP {candidate.amount.toFixed(2)} • {candidate.category} • {candidate.type}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Source: {candidate.source.replace('_', ' ')} • {formatDateTime(candidate.detectedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => onDismissCandidate(candidate.id)}
                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => onConfirmCandidate(candidate.id)}
                    className="flex-1 py-2.5 rounded-lg bg-cib-blue text-white text-sm font-semibold"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">In-App Notifications</h3>
        {notifications.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-4 text-sm text-gray-500">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => onMarkNotificationRead(notification.id)}
                className={`w-full text-left bg-white border rounded-xl p-4 ${
                  notification.isRead ? 'border-gray-100 opacity-80' : 'border-cib-blue/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                  </div>
                  {!notification.isRead && <span className="w-2 h-2 bg-cib-blue rounded-full mt-1" />}
                </div>
                <p className="text-xs text-gray-400 mt-2">{formatDateTime(notification.createdAt)}</p>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default NotificationsCenter;
