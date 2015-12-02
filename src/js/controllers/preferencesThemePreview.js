'use strict';

angular.module('copayApp.controllers').controller('preferencesThemePreviewController',
  function($scope, $state, $log, profileService, go, themeService) {

  this.save = function(themeId) {
    themeService.setTheme(themeId, function() {
      $state.go('preferencesTheme');
    });
  };

  this.canDeleteTheme = function(themeId) {
		return (themeService.getPublishedThemeId() != themeId) && themeService.getCatalogThemeById(themeId).canDelete();
  };

  this.delete = function(themeId) {
    themeService.deleteTheme(themeId, function() {
      $state.go('preferencesTheme');
    });
  };
});
