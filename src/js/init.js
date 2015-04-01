'use strict';

angular.element(document).ready(function() {

  // this is now in HTML tab, witch is compatible with Windows Phone
  // var startAngular = function() {
  //   angular.bootstrap(document, ['copayApp']);
  // };
  /* Cordova specific Init */
  if (window.cordova !== undefined) {

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
        alert('No internet conection');
      }, false);

      document.addEventListener("online", function() {
        alert('Internet conection back');
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
