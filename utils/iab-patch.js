/*
 * Patches the default status bar height to 0 - needed for notched ios devices (iphonex etc)
 * */

const fs = require('fs');

try {
  const file = `${__dirname}/../platforms/ios/BitPay/Plugins/cordova-plugin-inappbrowser/CDVInAppBrowserNavigationController.m`;
  const content = fs.readFileSync(file, 'utf8');
  const result = content.replace(/STATUS_BAR_HEIGHT 20.0/g, 'STATUS_BAR_HEIGHT 0');
  fs.writeFileSync(file, result);
  console.log('successfully patched ios status bar height');
} catch(err) {
  console.error(err);
}

/*
 * Patches android to allow for onfido camera permissions
 * */

const override = `
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
 `;

try {
  const file = `${__dirname}/../platforms/android/app/src/main/java/org/apache/cordova/inappbrowser/InAppBrowser.java`;
  let content = fs.readFileSync(file, 'utf8').split('inAppWebView.setWebChromeClient(new InAppChromeClient(thatWebView) {');

  if (content[1].includes('public void onPermissionRequest(final PermissionRequest request) {')) {
    return;
  }

  const result = content[0] + override + content[1];
  fs.writeFileSync(file, result);
  console.log('successfully patched inappbrowser.java');
} catch(err) {
  console.error(err);
}



