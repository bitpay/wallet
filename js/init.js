'use strict';

angular.element(document).ready(function() {
  var startAngular = function () {
    angular.bootstrap(document, ['copayApp']);
  };

  if (window.cordova !== undefined) {
    document.addEventListener('deviceready', function() {
      setTimeout(function(){ navigator.splashscreen.hide(); }, 2000);

      function handleBitcoinURI(url) {
        if (!url) return;
        window.location = '#!/uri-payment/' + url;
      }

      window.plugins.webintent.getUri(handleBitcoinURI);
      window.plugins.webintent.onNewIntent(handleBitcoinURI);
      window.handleOpenURL = handleBitcoinURI;

      startAngular();
    }, false);

    document.addEventListener('pause', function() {
      window.location = '#!';
    });
  } else {
    startAngular();
  }

});
