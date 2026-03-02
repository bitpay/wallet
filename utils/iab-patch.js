/*
 * Patches the default status bar height to 0 - needed for notched ios devices (iphonex etc)
 * */

const fs = require('fs');

try {
  const file = `${__dirname}/../platforms/ios/BitPay/Plugins/cordova-plugin-inappbrowser/CDVWKInAppBrowser.m`;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('(float) getStatusBarOffset')) {
    const result = content.replace(
      /\(float\) IsAtLeastiOSVersion\(@"7.0"\) \? \[\[UIApplication sharedApplication] statusBarFrame].size.height : 0.0;/g,
      '0.0;'
    );
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

/**
 * Android - patches the IAB to allow overriding the User-Agent via the key 'OverrideUserAgent'
 */
try {
  const file = `${__dirname}/../platforms/android/app/src/main/java/org/apache/cordova/inappbrowser/InAppBrowser.java`;
  const content = fs.readFileSync(file, 'utf8');

  const result = content
    .replace(
      `private static final List customizableOptions = Arrays.asList(CLOSE_BUTTON_CAPTION, TOOLBAR_COLOR, NAVIGATION_COLOR, CLOSE_BUTTON_COLOR, FOOTER_COLOR);`,
      `private static final String OVERRIDE_USERAGENT = "OverrideUserAgent";
    private static final List customizableOptions = Arrays.asList(CLOSE_BUTTON_CAPTION, TOOLBAR_COLOR, NAVIGATION_COLOR, CLOSE_BUTTON_COLOR, FOOTER_COLOR, OVERRIDE_USERAGENT);`
    )
    .replace(
      `String overrideUserAgent = preferences.getString("OverrideUserAgent", null);`,
      `String overrideUserAgent = preferences.getString("OverrideUserAgent", features.get(OVERRIDE_USERAGENT));`
    );

  fs.writeFileSync(file, result);
  console.log(`successfully patched InAppBrowser.java`);
} catch (err) {
  console.error(err);
}
