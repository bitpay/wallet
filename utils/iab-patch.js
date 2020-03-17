/*
 * Patches the default status bar height to 0 - needed for notched ios devices (iphonex etc)
 * */

const fs = require('fs');

try {
  const file = `${__dirname}/../platforms/ios/BitPay/Plugins/cordova-plugin-inappbrowser/CDVInAppBrowserNavigationController.m`;
  const content = fs.readFileSync(file, 'utf8');

  if (content.includes('20.0')) {
    const result = content.replace(/20.0/g, '0');
    fs.writeFileSync(file, result);
    console.log('successfully patched ios status bar height');
  }
} catch (err) {
  console.error(err);
}

try {
  const file = `${__dirname}/../platforms/ios/BitPay/Plugins/cordova-plugin-inappbrowser/CDVWKInAppBrowser.m`;
  const content = fs
    .readFileSync(file, 'utf8')
    .split('#define    LOCATIONBAR_HEIGHT 21.0');
  if (content.includes('20.0')) {
    const result =
      content[0].replace(/20.0/g, '0') +
      '#define    LOCATIONBAR_HEIGHT 21.0' +
      content[1];
    fs.writeFileSync(file, result);
    console.log('successfully patched WK status bar height');
  }
} catch (err) {
  console.error(err);
}

/*
 * Patches android to allow for onfido camera permissions
 * */

try {
  const file = `${__dirname}/../platforms/android/app/src/main/java/org/apache/cordova/inappbrowser/InAppBrowser.java`;
  let content = fs
    .readFileSync(file, 'utf8')
    .split(
      'inAppWebView.setWebChromeClient(new InAppChromeClient(thatWebView) {'
    );

  const head = content[0].split('package org.apache.cordova.inappbrowser;');

  if (!head[1].includes('import android.webkit.PermissionRequest;')) {
    content[0] =
      head[0] +
      'package org.apache.cordova.inappbrowser;' +
      '\n' +
      'import android.webkit.PermissionRequest;' +
      head[1];
  }

  if (
    !content[1].includes(
      'public void onPermissionRequest(final PermissionRequest request) {'
    )
  ) {
    const result =
      content[0] +
      `
      inAppWebView.setWebChromeClient(new InAppChromeClient(thatWebView) {
        @Override
          public void onPermissionRequest(final PermissionRequest request) {
            LOG.d(LOG_TAG, "onPermissionRequest");
            cordova.getActivity().runOnUiThread(new Runnable() {
              @TargetApi(Build.VERSION_CODES.LOLLIPOP)
              @Override
              public void run() {
                Uri mainOrigin = Uri.parse(url);
                Uri origin = request.getOrigin();
                LOG.d(LOG_TAG, mainOrigin.toString());
                LOG.d(LOG_TAG, origin.toString());
                // grant if request host matches the host of the original URL we opened in the IAB
                if (mainOrigin.getHost().equals(origin.getHost())) {
                  LOG.d(LOG_TAG, "GRANTED");
                  request.grant(request.getResources());
                } else {
                  LOG.d(LOG_TAG, "DENIED");
                  request.deny();
                }
              }
            });
          }
    ` +
      content[1];
    fs.writeFileSync(file, result);
    console.log('successfully patched inappbrowser.java');
  }
} catch (err) {
  console.error(err);
}

/*
 * Patches iab close method to just hide and preserve instance
 * */

try {
  const file = `${__dirname}/../platforms/android/app/src/main/java/org/apache/cordova/inappbrowser/InAppBrowserDialog.java`;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('this.inAppBrowser.closeDialog')) {
    const result = content.replace(
      /this.inAppBrowser.closeDialog/g,
      'this.hide'
    );
    fs.writeFileSync(file, result);
    console.log('successfully patched InAppBrowserDialog.java');
  }
} catch (err) {
  console.error(err);
}

/*
 * Android -Adds camera permission request for first time user - added this to enable camera permission before IAB is interacted with
 * */

try {
  const file = `${__dirname}/../platforms/android/app/src/main/java/com/bitpay/wallet/MainActivity.java`;
  let content = fs
    .readFileSync(file, 'utf8')
    .split('super.onCreate(savedInstanceState);');

  const head = content[0].split('import org.apache.cordova.*;');

  if (!head[1].includes('import android.support.v4.app.ActivityCompat;')) {
    content[0] =
      head[0] +
      'import org.apache.cordova.*;\n' +
      'import android.content.pm.PackageManager;\n' +
      'import android.Manifest;\n' +
      'import android.support.v4.app.ActivityCompat;\n' +
      head[1];
  }

  if (!content[1].includes('ActivityCompat.requestPermissions')) {
    const result =
      content[0] +
      `
      super.onCreate(savedInstanceState);
      if (ActivityCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
        ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, 3);
      }
      ` +
      content[1];
    fs.writeFileSync(file, result);
    console.log('successfully patched MainActivity.java');
  }
} catch (err) {
  console.error(err);
}
