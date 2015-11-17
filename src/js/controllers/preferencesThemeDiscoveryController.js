'use strict';

angular.module('copayApp.controllers').controller('preferencesThemeDiscoveryController',
  function($rootScope, $state, $log, go, themeService) {

  	var self = this;

  	self.themesFound = true;
  	self.inProgress = true;
  	
    themeService.discoverThemes(function(discoveredThemeHeaders) {
    	self.inProgress = false;
 			self.themesFound = discoveredThemeHeaders.length > 0;
    });


    this.preview = function(discoveredThemeId) {
      $rootScope.discoveredThemeId = discoveredThemeId;
      $state.go('preferencesThemeDiscoveryPreview');
    }

});
