'use strict';

angular.module('copayApp.controllers').controller('preferencesSkinController',
  function($rootScope, $scope, $state, $log, $timeout, lodash, go, themeService, profileService, configService) {

  	var self = this;
		var config = configService.getSync();
		this.skinGalleryLayout = config.view.skinGalleryLayout;
		this.skins = themeService.getVanitySkins();

  	var nextLayout = {};
		nextLayout['grid'] = 'list';
		nextLayout['list'] = 'list-detail';
		nextLayout['list-detail'] = 'grid';

    this.preview = function(skinName) {
      $rootScope.previewSkinId = themeService.getPublishedSkinIdByName(skinName);
      $state.go('preferencesSkinPreview');
    };

	  this.save = function(skinName) {
	    var fc = profileService.focusedClient;
	    var walletId = fc.credentials.walletId;
	    themeService.setSkinByNameForWallet(skinName, walletId, true);
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
