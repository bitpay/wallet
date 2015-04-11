'use strict';

// Detect mobile devices
var isMobile = {
  Android: function() {
    return !!navigator.userAgent.match(/Android/i);
  },
  BlackBerry: function() {
    return !!navigator.userAgent.match(/BlackBerry/i);
  },
  iOS: function() {
    return !!navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Opera: function() {
    return !!navigator.userAgent.match(/Opera Mini/i);
  },
  Windows: function() {
    return !!navigator.userAgent.match(/IEMobile/i);
  },
  Safari: function() {
    return Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
  },
  any: function() {
    return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
  }
};


angular.module('copayApp.services').value('isMobile', isMobile);
