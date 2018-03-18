'use strict';

angular.module('copayApp.services').factory('platformInfo', function($window) {

  var ua = navigator ? navigator.userAgent : null;

  if (!ua) {
    ua = 'dummy user-agent';
  }

  // Fixes IOS WebKit UA
  ua = ua.replace(/\(\d+\)$/, '');

  var isNodeWebkit = function() {
    var isNode = (typeof process !== "undefined" && typeof require !== "undefined");
    if (isNode) {
      try {
        return (typeof require('nw.gui') !== "undefined");
      } catch (e) {
        return false;
      }
    }
  };

  var getVersionIntelTee = function() {
    var v = '';
    var isWindows = navigator.platform.indexOf('Win') > -1;

    if (!isNodeWebkit() || !isWindows) {
      return v;
    }

    try {
      var IntelWallet = require('intelWalletCon');
      if (IntelWallet.getVersion) {
        v = IntelWallet.getVersion();
      } else {
        v = 'Alpha';
      }
      if (v.length > 0) {
        $log.info('Intel TEE library ' + v);
      }
    } catch (e) {}
    return v;
  };

  // Detect mobile devices
  var ret = {
    isAndroid: ionic.Platform.isAndroid(),
    isIOS: ionic.Platform.isIOS(),
    isWP: ionic.Platform.isWindowsPhone() || ionic.Platform.platform() == 'edge',
    // isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
    ua: ua,
    isCordova: !!$window.cordova,
    isNW: isNodeWebkit(),
  };

  ret.isMobile = ret.isAndroid || ret.isIOS || ret.isWP;
  ret.isChromeApp = $window.chrome && chrome.runtime && chrome.runtime.id && !ret.isNW;
  ret.isDevel = !ret.isMobile && !ret.isChromeApp && !ret.isNW;

  ret.supportsLedger = ret.isChromeApp;
  ret.supportsTrezor = ret.isChromeApp || ret.isDevel;

  ret.versionIntelTEE = getVersionIntelTee();
  ret.supportsIntelTEE = ret.versionIntelTEE.length > 0;

  // Safari / iOS
  ret.isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1
  var iOSVesionExtracted = navigator.userAgent.match(/(iPhone OS )(\d+)_(\d+)_?(\d+)?/) // ['iphone', 'iphone', 'major', 'minor', 'fix'] ['', '', '11', '2', '1']
  ret.iOSVersion = iOSVesionExtracted ? [parseInt(iOSVesionExtracted[2], 10), parseInt(iOSVesionExtracted[3], 10), parseInt(iOSVesionExtracted[4], 10)] : []
  ret.iOSPWASupport = ret.iOSVersion.length ? ret.iOSVersion[0] >= 11 && ret.iOSVersion[1] >= 3 : false
  ret.isPWA = navigator.standalone || false

  // Choose camera types
  // Supported  'unsupported', 'native', 'webrtc', 'photo'
  ret.cameraType = 'unsupported'
  ret.cameraSupported = false

  if (ret.isCordova) {
    ret.cameraType = 'native'
    ret.cameraSupported = true
  } else if (checkWebRtcSupport()) {
    ret.cameraType = 'webrtc'
    ret.cameraSupported = true
  } else if (checkPhotoSupport()) {
    ret.cameraType = 'photo'
    ret.cameraSupported = true
  }

  // Check PWA support
  ret.supportPWA = false
  if (ret.isSafari && ret.cameraType !== 'unsupported') {
    ret.supportPWA = true
  }

  function checkWebRtcSupport() {
    // Update encase its an older browser
    if (!navigator.getUserMedia && navigator.webkitGetUserMedia) {
      navigator.getUserMedia = navigator.webkitGetUserMedia;
    }
    // If we dont have access to these, then no RTC support
    if (!navigator.mediaDevices || !navigator.getUserMedia) {
      return false
    }
    return true
  }

  // PWA on iOS 10.3 started supporting button click photos
  function checkPhotoSupport() {
    return ret.iOSVersion.length ? ret.iOSVersion[0] >= 11 && ret.iOSVersion[1] >= 3 : false
  }

  return ret;
});
