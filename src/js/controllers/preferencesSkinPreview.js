'use strict';

angular.module('copayApp.controllers').controller('preferencesSkinPreviewController',
  function($scope, $state, $log, profileService, go, themeService) {

  this.save = function(skinId) {
    var fc = profileService.focusedClient;
    var walletId = fc.credentials.walletId;
    themeService.setSkinForWallet(skinId, walletId, function() {
      $state.go('preferencesSkin');
    });
  };

});
