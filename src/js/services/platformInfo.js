'use strict';

angular.module('copayApp.services').factory('platformInfo', function($window, platformService) {

  var ua = navigator ? navigator.userAgent : null;

  if (!ua) {
    console.log('Could not determine navigator. Using fixed string');
    ua = 'dummy user-agent';
  }

  // Fixes IOS WebKit UA
  ua = ua.replace(/\(\d+\)$/, '');

  function getDesktopOsType(){
    var osType = 'unknown';
    if(platformService.electron){
      var os = require('os');
      osType = os.type();
    }
    switch(osType){
      case 'Darwin':
        return 'macOS';
        break;
      case 'Linux':
        return 'Linux';
        break;
      case 'Windows_NT':
        return 'Windows'
        break;
      default:
        return 'unknown';
    }
  }

  function isMac(){
    return getDesktopOsType === 'macOS';
  }
  function isLinux(){
    return getDesktopOsType === 'Linux';
  }
  function isWindows(){
    return getDesktopOsType === 'Windows';
  }

  // Detect mobile devices
  var ret = {
    isAndroid: !!ua.match(/Android/i),
    isIOS: /iPad|iPhone|iPod/.test(ua) && !$window.MSStream,
    isWP: !!ua.match(/IEMobile/i),
    isSafari: Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0,
    ua: ua,
    isCordova: !!$window.cordova,
    isNW: false,
    isDesktop: platformService.electron !== false,
    isMac: isMac(),
    isLinux: isLinux(),
    isWindows: isWindows()
  };

  ret.isMobile = ret.isAndroid || ret.isIOS || ret.isWP;
  ret.isChromeApp = $window.chrome && chrome.runtime && chrome.runtime.id && !ret.isNW;
  ret.isDevel = !ret.isMobile && !ret.isChromeApp && !ret.isNW;

  ret.hasClick = false;

  if ($window.sessionStorage.getItem('hasClick')) {
    ret.hasClick = true;
  }

  $window.addEventListener('mousedown', function() {
    ret.hasClick = true;
    $window.sessionStorage.setItem('hasClick', 'true');
  });

  $window.addEventListener('touchstart', function() {
    ret.hasClick = false;
    $window.sessionStorage.removeItem('hasClick');
  });

  return ret;
});
