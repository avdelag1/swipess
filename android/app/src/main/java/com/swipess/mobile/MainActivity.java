package com.swipess.mobile;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Make sure the OS-level microphone (and camera) permission is granted so the
        // WebView's getUserMedia() — used by the AI voice profile/listing builder —
        // can actually capture audio. Declaring RECORD_AUDIO in the manifest is NOT
        // enough on Android 6+; it must be granted at runtime.
        requestMediaPermissionsIfNeeded();

        // The first time getUserMedia() runs, the WebView raises a PermissionRequest.
        // Capacitor does not reliably grant audio capture, so the mic silently fails
        // even after the user taps "Allow". Grant the capture request explicitly
        // (the OS permission above is the real gate). We subclass Capacitor's own
        // BridgeWebChromeClient so every other WebView behaviour is preserved.
        final Bridge bridge = this.getBridge();
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(bridge) {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                request.grant(request.getResources());
                            } catch (Exception e) {
                                request.deny();
                            }
                        }
                    });
                }
            });
        }
    }

    private void requestMediaPermissionsIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
        List<String> needed = new ArrayList<>();
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.RECORD_AUDIO);
        }
        if (!needed.isEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toArray(new String[0]), 1001);
        }
    }
}
