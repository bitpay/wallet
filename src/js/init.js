'use strict';

angular.element(document).ready(function() {

  // Run copayApp after device is ready.
  var startAngular = function() {
    angular.bootstrap(document, ['copayApp']);
  };

  var handleBitcoinURI = function(url) {
    if (!url) return;
    console.log('Custom URL:'  + url); //TODO

    var glidera = 'copay://glidera';
    var coinbase = 'copay://coinbase';

    if (url.indexOf('bitcoin:') == 0) {
      url = '#/uri-payment/' + url;
    } else if (url.indexOf(glidera) != -1) {
      url = '#/uri-glidera' + url.replace(glidera, '');
    } else if (url.indexOf(coinbase) != -1) {
      url = '#/uri-coinbase' + url.replace(coinbase, '');
    } else {
      console.log('Unknown URL!')
    };

    setTimeout(function() {
      window.location = url;
    }, 1000);
  };


  /* Cordova specific Init */
  if (window.cordova !== undefined) {

    document.addEventListener('deviceready', function() {
      window.handleOpenURL = handleBitcoinURI;
      startAngular();
    }, false);

  } else {
    try {
      window.handleOpenURL = handleBitcoinURI;
    } catch (e) {}

    startAngular();
  }

});
