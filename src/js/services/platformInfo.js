'use strict';

angular.module('copayApp.services').factory('platformInfo', function($window) {

  var ua = navigator ? navigator.userAgent : null;

  if (!ua) {
    console.log('Could not determine navigator. Using a random string');
    ua = Math.floor(Math.random() * 100000);
  }

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


  // Detect mobile devices
  var ret = {
    isAndroid: function() {
      return !!ua.match(/Android/i);
    },
    isIOS: function() {
      return /iPad|iPhone|iPod/.test(ua) && !$window.MSStream;
    },
    isWP: function() {
      return !!ua.match(/IEMobile/i);
    },
    isSafari: function() {
      return Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    }
  };

  ret.ua = ua;
  ret.isMobile = ret.isAndroid() || ret.isIOS() || ret.isWP();
  ret.isCordova = !!$window.cordova;
  ret.isNW = isNodeWebkit();
  ret.isChromeApp = $window.chrome && chrome.runtime && chrome.runtime.id && !ret.isNW;
  ret.isDevel = !ret.isMobile && !ret.isChromeApp && !ret.isNW;

  return ret;
});
