'use strict';

angular.element(document).ready(function() {

  // Run copayApp after device is ready.
  var startAngular = function() {
    angular.bootstrap(document, ['copayApp']);
  };
  /* Cordova specific Init */
  if (window.cordova !== undefined) {

    document.addEventListener('deviceready', function() {

      document.addEventListener('pause', function() {
        if (!window.ignoreMobilePause) {
          window.location = '#/';
        }
      }, false);

      document.addEventListener('resume', function() {
        if (!window.ignoreMobilePause) {
          window.location = '#/cordova/resume';
        }
        setTimeout(function() {
          window.ignoreMobilePause = false;
        }, 100);
      }, false);

      // We are not emitting here, since when the BWS socket reconnects,
      // update will be triggered  
      document.addEventListener('offline', function() {
        window.location = '#/cordova/offline';
      }, false);

      // Back button event
      document.addEventListener('backbutton', function() {
        var loc = window.location;
        if (loc.toString().match(/index\.html#\/$/)) {
          navigator.app.exitApp();
        }
        else {
          window.location = '#/cordova/walletHome';
        }
      }, false);

      document.addEventListener('menubutton', function() {
        window.location = '#/preferences';
      }, false);



      setTimeout(function() {
        navigator.splashscreen.hide();
      }, 2000);

      function handleBitcoinURI(url) {
        if (!url) return;
        setTimeout(function() {
          window.location = '#/uri-payment/' + url;
        }, 1000);
      }

      window.plugins.webintent.getUri(handleBitcoinURI);
      window.plugins.webintent.onNewIntent(handleBitcoinURI);
      window.handleOpenURL = handleBitcoinURI;

      startAngular();
    }, false);
  } else {
    startAngular();
  }

});
