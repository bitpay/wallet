'use strict';

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
  setTimeout(function(){ navigator.splashscreen.hide(); }, 2000);

  document.addEventListener("menubutton", function() {
    var nav = document.getElementsByTagName('nav')[0];
    if (!nav) return;

    var menu = nav.getElementsByTagName('section')[0].getElementsByTagName('a')[0];
    if (menu.offsetParent) menu.click();

  }, false);


  function handleBitcoinURI(url) {
    if (!url) return;

    var body = document.getElementsByTagName('nav')[0];
    var $rootScope = angular.element(body).scope();
    $rootScope.pendingPayment = copay.HDPath.parseBitcoinURI(url);

    // Redirect or reload controller (if already there)
    window.location = ($rootScope.wallet ? '#!/send' : '#!/open') + '?r=' + Math.random();
  }

  window.plugins.webintent.getUri(handleBitcoinURI);
  window.plugins.webintent.onNewIntent(handleBitcoinURI);
}