'use strict';

angular.module('copayApp.controllers').controller('preferencesSkinDiscoveryController',
  function($rootScope, $scope, $state, $log, go, themeService, configService) {

  	var self = this;
    var config = configService.getSync();
    this.skinGalleryLayout = config.view.skinGalleryLayout;

    var nextLayout = {};
    nextLayout['grid'] = 'list';
    nextLayout['list'] = 'list-detail';
    nextLayout['list-detail'] = 'grid';

  	self.skinsFound = true;
  	self.inProgress = true;
    self.progressMessage = 'Searching for skins...';
  	
    themeService.discoverSkins(themeService.getPublishedTheme(), function(discoveredSkinHeaders) {
    	self.inProgress = false;
 			self.skinsFound = discoveredSkinHeaders.length > 0;
    });

    this.preview = function(discoveredSkinId) {
      $rootScope.discoveredSkinId = discoveredSkinId;
      $state.go('preferencesSkinDiscoveryPreview');
    };

    this.import = function(discoveredSkinId) {
      self.inProgress = true;
      self.progressMessage = 'Importing skin...';
      themeService.importSkin(discoveredSkinId, function() {
        self.inProgress = false;
      });
    };

    // Listen for layout events from the topbar controller.
    var deregisterChangeLayout = $rootScope.$on('skinLayout', function(event) {
      if (!self.skinsFound)
        return;

      var config = configService.getSync();
      self.skinGalleryLayout = nextLayout[self.skinGalleryLayout];

      var config = configService.getSync();
      var opts = {
        view: {
          skinGalleryLayout: {}
        }
      };

      opts.view.skinGalleryLayout = self.skinGalleryLayout;

      configService.set(opts, function(err) {
        if (err) {
          $rootScope.$emit('Local/DeviceError', err);
          return;
        }
      });
    });

    // Stop listening for change layout events when this page is destroyed.
    $scope.$on('$destroy', function() {
      deregisterChangeLayout();
    });

});
