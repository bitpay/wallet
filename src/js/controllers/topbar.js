'use strict';

angular.module('copayApp.controllers').controller('topbarController', function($rootScope, $timeout, go) {

  this.openScanner = function() {
    window.ignoreMobilePause = true;
    cordova.plugins.barcodeScanner.scan(
      function onSuccess(result) {
        $timeout(function() {
          window.ignoreMobilePause = false;
        }, 100);
        if (result.cancelled) return;

        $timeout(function() {
          var data = result.text;
          this.$apply(function() {
            $rootScope.$emit('dataScanned', data); 
          });
        }, 1000);
      },
      function onError(error) {
        $timeout(function() {
          window.ignoreMobilePause = false;
        }, 100);
        alert('Scanning error');
      }
    );
    go.send();
  };

});
