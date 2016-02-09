'use strict';

angular.module('copayApp.controllers').controller('topbarController', function(go, $rootScope) {

  this.goHome = function() {
    $rootScope.$emit('Local/UpdateTxHistory');
    go.walletHome();
  };

  this.goPreferences = function() {
    $rootScope.$emit('Local/UpdateTxHistory');
    go.preferences();
  };

});
