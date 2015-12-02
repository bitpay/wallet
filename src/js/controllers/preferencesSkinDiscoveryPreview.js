'use strict';

angular.module('copayApp.controllers').controller('preferencesSkinDiscoveryPreviewController',
  function($rootScope, $state, $log, go, themeService) {

  	var self = this;

    this.import = function(discoveredSkinId) {
      self.inProgress = true;
	    self.progressMessage = 'Importing skin...';
      themeService.importSkin(discoveredSkinId, function() {
	      self.inProgress = false;
        $state.go('preferencesSkinDiscovery');
      });
    };

});
