'use strict';

angular.module('copayApp.controllers').controller('topbarController', function($scope, $rootScope, go) {

  this.onQrCodeScanned = function(data) {
    $rootScope.$emit('dataScanned', data);
  };

  this.openSendScreen = function() {
    go.send();
  };

  this.goHome = function() {
    go.walletHome();
  };

});
