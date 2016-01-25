'use strict';

angular.module('copayApp.controllers').controller('preferencesSkinController',
  function($rootScope, $scope, $state, $log, $timeout, lodash, go, themeService, profileService, configService) {

  	var self = this;
		var config = configService.getSync();
		this.skinGalleryLayout = config.view.skinGalleryLayout;

		// Return only vanity skins (no applets).
		this.skins = lodash.filter(themeService.getPublishedSkins(), function(skin) {
//			return lodash.isEmpty(skin.applet);
			return skin;
		});

  	var nextLayout = {};
		nextLayout['grid'] = 'list';
		nextLayout['list'] = 'list-detail';
		nextLayout['list-detail'] = 'grid';

    this.preview = function(skinId) {
      $rootScope.previewSkinId = skinId;
      $state.go('preferencesSkinPreview');
    };

	  this.save = function(skinId) {
	    var fc = profileService.focusedClient;
	    var walletId = fc.credentials.walletId;
	    themeService.setSkinForWallet(skinId, walletId, true);
	  };

	  // Listen for layout events from the topbar controller.
	  var deregisterChangeLayout = $rootScope.$on('skinLayout', function(event) {
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
