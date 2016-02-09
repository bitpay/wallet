'use strict';

angular.module('copayApp.controllers').controller('topbarController', function(go) { 

  this.goHome = function() {
    go.walletHome();
  };

  this.goPreferences = function() {
    go.preferences();
  };

});
