'use strict';

angular.module('copayApp.services').factory('platformInfo', function( $navigator, $window) {

  var ua= $navigator.userAgent;

  var isNodeWebkit = function() {
    var isNode = (typeof process !== "undefined" && typeof require !== "undefined");
    if(isNode) {
      try {
        return (typeof require('nw.gui') !== "undefined");
      } catch(e) {
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
    Safari: function() {
      return Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    }
  };

  ret.isMobile = ret.isAndroid() || ret.isIOS() || ret.isWP();
  ret.isChromeApp = !!($window.chrome && chrome.runtime && chrome.runtime.id && !nodeWebkit.isDefined());
  ret.isCordova = !!$window.cordova;
  ret.isNW = isNodeWebkit();
  ret.isDevel =!ret.isMobile() && !ret.isChromeApp && !ret.isNW();

  return ret;
});
