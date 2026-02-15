package com.masarify.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import org.json.JSONException;
import org.json.JSONObject;

import java.lang.ref.WeakReference;

public class MainActivity extends BridgeActivity {
  private static final int SMS_PERMISSION_REQUEST_CODE = 2301;
  private static final int NOTIFICATION_PERMISSION_REQUEST_CODE = 2302;
  private static final String JS_INTERFACE_NAME = "MasarifyNativePermissions";
  private boolean permissionsBridgeAttached = false;

  @Override
  public void onStart() {
    super.onStart();
    if (this.bridge == null) {
      return;
    }

    NativeMessageBridge.setBridge(this.bridge);
    attachPermissionsBridge();
    emitPermissionsSnapshot();
  }

  @Override
  public void onRequestPermissionsResult(
    int requestCode,
    @NonNull String[] permissions,
    @NonNull int[] grantResults
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    if (requestCode == SMS_PERMISSION_REQUEST_CODE || requestCode == NOTIFICATION_PERMISSION_REQUEST_CODE) {
      emitPermissionsSnapshot();
    }
  }

  private void attachPermissionsBridge() {
    if (permissionsBridgeAttached || this.bridge == null) {
      return;
    }

    WebView webView = this.bridge.getWebView();
    if (webView == null) {
      return;
    }

    webView.addJavascriptInterface(new PermissionsJavascriptInterface(this), JS_INTERFACE_NAME);
    permissionsBridgeAttached = true;
  }

  private void requestSmsPermissionFromNative() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      emitPermissionsSnapshot();
      return;
    }

    if (isSmsPermissionGranted()) {
      emitPermissionsSnapshot();
      return;
    }

    requestPermissions(new String[]{Manifest.permission.RECEIVE_SMS}, SMS_PERMISSION_REQUEST_CODE);
  }

  private void requestNotificationPermissionFromNative() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      emitPermissionsSnapshot();
      return;
    }

    if (isNotificationPermissionGranted()) {
      emitPermissionsSnapshot();
      return;
    }

    requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION_REQUEST_CODE);
  }

  private void openNotificationListenerSettingsFromNative() {
    Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    startActivity(intent);
  }

  private boolean isSmsPermissionGranted() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return true;
    }
    return ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS)
      == PackageManager.PERMISSION_GRANTED;
  }

  private boolean isNotificationPermissionGranted() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
      return true;
    }
    return ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
      == PackageManager.PERMISSION_GRANTED;
  }

  private boolean isNotificationListenerEnabled() {
    String enabledListeners = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
    if (enabledListeners == null) {
      return false;
    }
    return enabledListeners.contains(getPackageName());
  }

  private JSONObject buildPermissionSnapshot() {
    JSONObject payload = new JSONObject();
    try {
      payload.put("smsGranted", isSmsPermissionGranted());
      payload.put("notificationsGranted", isNotificationPermissionGranted());
      payload.put("notificationListenerEnabled", isNotificationListenerEnabled());
      payload.put("platform", "android");
    } catch (JSONException ignored) {
      // Ignore and return best-effort payload.
    }
    return payload;
  }

  private String buildPermissionSnapshotString() {
    return buildPermissionSnapshot().toString();
  }

  private void emitPermissionsSnapshot() {
    NativeMessageBridge.emitPermissionSnapshot(
      isSmsPermissionGranted(),
      isNotificationPermissionGranted(),
      isNotificationListenerEnabled()
    );
  }

  public static class PermissionsJavascriptInterface {
    private final WeakReference<MainActivity> activityRef;

    PermissionsJavascriptInterface(MainActivity activity) {
      activityRef = new WeakReference<>(activity);
    }

    @JavascriptInterface
    public String getPermissionSnapshot() {
      MainActivity activity = activityRef.get();
      if (activity == null) {
        return "{}";
      }
      return activity.buildPermissionSnapshotString();
    }

    @JavascriptInterface
    public void requestSmsPermission() {
      MainActivity activity = activityRef.get();
      if (activity == null) {
        return;
      }
      activity.runOnUiThread(activity::requestSmsPermissionFromNative);
    }

    @JavascriptInterface
    public void requestNotificationPermission() {
      MainActivity activity = activityRef.get();
      if (activity == null) {
        return;
      }
      activity.runOnUiThread(activity::requestNotificationPermissionFromNative);
    }

    @JavascriptInterface
    public void openNotificationListenerSettings() {
      MainActivity activity = activityRef.get();
      if (activity == null) {
        return;
      }
      activity.runOnUiThread(activity::openNotificationListenerSettingsFromNative);
    }
  }
}
