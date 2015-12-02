'use strict';

angular.module('copayApp.controllers').controller('preferencesThemeController',
  function($rootScope, $scope, $state, $log, go, themeService, configService) {

  	var self = this;
		var config = configService.getSync();
		this.themeGalleryLayout = config.view.themeGalleryLayout;
    this.themes = themeService.getPublishedThemes();

  	var nextLayout = {};
		nextLayout['grid'] = 'list';
		nextLayout['list'] = 'list-detail';
		nextLayout['list-detail'] = 'grid';

    this.preview = function(themeId) {
      $rootScope.previewThemeId = themeId;
      $state.go('preferencesThemePreview');
    };

    this.save = function(themeId) {
	    themeService.setTheme(themeId);
    };

	  // Listen for layout events from the topbar controller.
	  var deregisterChangeLayout = $rootScope.$on('themeLayout', function(event) {
			var config = configService.getSync();
			self.themeGalleryLayout = nextLayout[self.themeGalleryLayout];

			var config = configService.getSync();
	      var opts = {
        view: {
          themeGalleryLayout: {}
        }
      };

      opts.view.themeGalleryLayout = self.themeGalleryLayout;

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
