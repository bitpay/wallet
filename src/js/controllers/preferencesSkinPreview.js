'use strict';

angular.module('copayApp.controllers').controller('preferencesSkinPreviewController',
  function($scope, $state, $log, profileService, go, themeService) {

  this.save = function(skinId) {
    var fc = profileService.focusedClient;
    var walletId = fc.credentials.walletId;
    themeService.setSkinForWallet(skinId, walletId, true, function() {
      $state.go('preferencesSkin');
    });
  };

  this.canDeleteSkin = function(skinId) {
		return (themeService.getPublishedSkinId() != skinId) && themeService.getCatalogSkinById(skinId).canDelete();
  };

  this.delete = function(skinId) {
    themeService.deleteSkin(skinId, function() {
      $state.go('preferencesSkin');
    });
  };

  this.like = function(skinId) {
    themeService.likeSkin(skinId);
  };

});
