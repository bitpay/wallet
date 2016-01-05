'use strict';

angular.module('copayApp.controllers').controller('topbarController', function($rootScope, go) { 

  this.goHome = function() {
    go.walletHome();
  };

  this.changeLayout = function(layoutEvent) {
    $rootScope.$emit(layoutEvent);
  };
  
  this.goPreferences = function() {
    go.preferences();
  };

});
