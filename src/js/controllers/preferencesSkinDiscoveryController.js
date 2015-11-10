'use strict';

angular.module('copayApp.controllers').controller('preferencesSkinDiscoveryController',
  function($rootScope, $state, $log, go, themeService) {

  	var self = this;

  	self.skinsFound = true;
  	self.inProgress = true;
  	
    themeService.discoverSkins(themeService.getPublishedTheme(), function(discoveredSkinHeaders) {
    	self.inProgress = false;
 			self.skinsFound = discoveredSkinHeaders.length > 0;
    });

    this.preview = function(discoveredSkinId) {
      $rootScope.discoveredSkinId = discoveredSkinId;
      $state.go('preferencesSkinDiscoveryPreview');
    }

});
