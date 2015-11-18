'use strict';

angular.module('copayApp.controllers').controller('preferencesSkinController',
  function($rootScope, $state, $log, go, themeService) {

    this.skins = themeService.getPublishedSkins();

    this.preview = function(skinId) {
      $rootScope.previewSkinId = skinId;
      $state.go('preferencesSkinPreview');
    }

  });
