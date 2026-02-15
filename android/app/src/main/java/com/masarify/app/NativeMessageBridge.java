package com.masarify.app;

import android.webkit.WebView;

import com.getcapacitor.Bridge;

import org.json.JSONException;
import org.json.JSONObject;

public final class NativeMessageBridge {
  private static Bridge bridge;

  private NativeMessageBridge() {}

  public static void setBridge(Bridge nextBridge) {
    bridge = nextBridge;
  }

  public static void emitPaymentMessage(String rawMessage, String source) {
    if (bridge == null) {
      return;
    }

    WebView webView = bridge.getWebView();
    if (webView == null) {
      return;
    }

    String script =
      "window.masarifyNativePaymentMessage && window.masarifyNativePaymentMessage("
        + JSONObject.quote(rawMessage)
        + ","
        + JSONObject.quote(source)
        + ");";

    webView.post(() -> webView.evaluateJavascript(script, null));
  }

  public static void emitPermissionSnapshot(boolean smsGranted, boolean notificationsGranted, boolean listenerEnabled) {
    if (bridge == null) {
      return;
    }

    WebView webView = bridge.getWebView();
    if (webView == null) {
      return;
    }

    JSONObject payload = new JSONObject();
    try {
      payload.put("smsGranted", smsGranted);
      payload.put("notificationsGranted", notificationsGranted);
      payload.put("notificationListenerEnabled", listenerEnabled);
      payload.put("platform", "android");
    } catch (JSONException ignored) {
      return;
    }

    String script =
      "window.masarifyNativePermissionsUpdate && window.masarifyNativePermissionsUpdate("
        + payload
        + ");";

    webView.post(() -> webView.evaluateJavascript(script, null));
  }
}
