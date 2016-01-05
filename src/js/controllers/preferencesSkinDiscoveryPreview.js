'use strict';

angular.module('copayApp.controllers').controller('preferencesSkinDiscoveryPreviewController',
  function($rootScope, $state, $log, go, themeService) {

  	var self = this;

    this.import = function(discoveredSkinId) {
      self.inProgress = true;
	    self.progressMessage = 'Importing skin...';
      var discoveredSkinName = $rootScope.discoveredSkinHeaders[discoveredSkinId].name;
      themeService.importSkin(themeService.getPublishedTheme().header.name, discoveredSkinName, true, function() {
	      self.inProgress = false;
        $state.go('preferencesSkinDiscovery');
      });
    };

});
