'use strict';

angular.module('copayApp.controllers').controller('preferencesThemeDiscoveryPreviewController',
  function($rootScope, $state, $log, go, themeService) {

    this.import = function(discoveredThemeId) {
      themeService.importTheme(discoveredThemeId, function() {
	      $state.go('preferencesThemeDiscovery');
      });
    }

});
