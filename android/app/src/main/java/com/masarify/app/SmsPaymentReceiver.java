package com.masarify.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;

import java.util.Locale;

public class SmsPaymentReceiver extends BroadcastReceiver {
  @Override
  public void onReceive(Context context, Intent intent) {
    if (intent == null || !"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
      return;
    }

    Bundle bundle = intent.getExtras();
    if (bundle == null) {
      return;
    }

    Object[] pdus = (Object[]) bundle.get("pdus");
    String format = bundle.getString("format");
    if (pdus == null || pdus.length == 0) {
      return;
    }

    StringBuilder fullMessage = new StringBuilder();
    for (Object pdu : pdus) {
      SmsMessage sms = SmsMessage.createFromPdu((byte[]) pdu, format);
      if (sms != null && sms.getMessageBody() != null) {
        fullMessage.append(sms.getMessageBody());
      }
    }

    String text = fullMessage.toString().trim();
    if (text.isEmpty() || !looksLikePaymentMessage(text)) {
      return;
    }

    NativeMessageBridge.emitPaymentMessage(text, "sms_inbox");
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
