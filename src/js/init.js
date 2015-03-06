'use strict';

angular.element(document).ready(function() {

  // this is now in HTML tab, witch is compatible with Windows Phone
  // var startAngular = function() {
  //   angular.bootstrap(document, ['copayApp']);
  // };
  /* Cordova specific Init */
  if (window.cordova !== undefined) {

    // Fastclick event
    if ('addEventListener' in document) {
      document.addEventListener('DOMContentLoaded', function() {
        FastClick.attach(document.body);
      }, false);
    }

    document.addEventListener('deviceready', function() {

      document.addEventListener('pause', function() {
        if (!window.ignoreMobilePause) {
          window.location = '#/';
        }
      }, false);
      
      document.addEventListener('resume', function() {
        setTimeout(function() {
          window.ignoreMobilePause = false;
        }, 100);
      }, false);

      document.addEventListener('backbutton', function() {
        window.location = '#/walletHome';
      }, false);

      document.addEventListener('menubutton', function() {
        window.location = '#/preferences';
      }, false);

      document.addEventListener('offline', function() {
        window.location = '#/network/offline';
      }, false);

      document.addEventListener("online", function() {
        window.location = '#/network/online';
      }, false);

      setTimeout(function() {
        navigator.splashscreen.hide();
      }, 2000);

      function handleBitcoinURI(url) {
        if (!url) return;
        window.location = '#/uri-payment/' + url;
      }

      window.plugins.webintent.getUri(handleBitcoinURI);
      window.plugins.webintent.onNewIntent(handleBitcoinURI);
      window.handleOpenURL = handleBitcoinURI;

      // startAngular();
    }, false);
  } else {
    // startAngular();
  }

});
