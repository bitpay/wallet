'use strict';

angular.module('copayApp.controllers').controller('preferencesSkinDiscoveryPreviewController',
  function($rootScope, $state, $log, go, themeService) {

    this.import = function(discoveredSkinId) {
      themeService.importSkin(discoveredSkinId, function() {
        $state.go('preferencesSkinDiscovery');
      });
    }

});
