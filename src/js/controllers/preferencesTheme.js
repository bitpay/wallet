'use strict';

angular.module('copayApp.controllers').controller('preferencesThemeController',
  function($rootScope, $state, $log, go, themeService) {

    this.themes = themeService.getPublishedThemes();

    this.preview = function(themeId) {
      $rootScope.previewThemeId = themeId;
      $state.go('preferencesThemePreview');
    }

  });
