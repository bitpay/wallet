'use strict';

angular.element(document).ready(function() {
  var startAngular = function () {
    angular.bootstrap(document, ['copayApp']);
  };

  if (window.cordova !== undefined) {
    document.addEventListener('deviceready', function() {
      setTimeout(function(){ navigator.splashscreen.hide(); }, 2000);
      
      startAngular();
    });
  } else {
    startAngular();
  }

});
