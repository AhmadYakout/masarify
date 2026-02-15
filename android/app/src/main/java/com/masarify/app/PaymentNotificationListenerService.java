package com.masarify.app;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import java.util.Locale;

public class PaymentNotificationListenerService extends NotificationListenerService {
  @Override
  public void onNotificationPosted(StatusBarNotification sbn) {
    if (sbn == null || sbn.getNotification() == null) {
      return;
    }

    Notification notification = sbn.getNotification();
    Bundle extras = notification.extras;
    if (extras == null) {
      return;
    }

    CharSequence title = extras.getCharSequence(Notification.EXTRA_TITLE);
    CharSequence text = extras.getCharSequence(Notification.EXTRA_TEXT);
    String message = ((title == null ? "" : title.toString()) + " " + (text == null ? "" : text.toString())).trim();

    if (message.isEmpty() || !looksLikePaymentMessage(message)) {
      return;
    }

    NativeMessageBridge.emitPaymentMessage(message, "notification_listener");
  }

  private boolean looksLikePaymentMessage(String text) {
    String lower = text.toLowerCase(Locale.ROOT);
    return lower.contains("egp")
      || lower.contains("purchase")
      || lower.contains("paid")
      || lower.contains("transfer")
      || lower.contains("instapay")
      || lower.contains("payment");
  }
}
