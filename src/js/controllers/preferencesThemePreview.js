'use strict';

angular.module('copayApp.controllers').controller('preferencesThemePreviewController',
  function($scope, $state, $log, profileService, go, themeService) {

  this.save = function(themeId) {
    themeService.setTheme(themeId, function() {
      $state.go('preferencesTheme');
    });
  };

});
