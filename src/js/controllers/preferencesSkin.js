'use strict';

angular.module('copayApp.controllers').controller('preferencesSkinController',
  function($rootScope, $scope, $state, $log, $timeout, go, themeService, profileService) {

    $rootScope.skinGalleryLayout = $rootScope.skinGalleryLayout || $rootScope.theme.header.skinGalleryLayout;

    this.skins = themeService.getPublishedSkins();

    this.preview = function(skinId) {
      $rootScope.previewSkinId = skinId;
      $state.go('preferencesSkinPreview');
    }

	  this.save = function(skinId) {
	    var fc = profileService.focusedClient;
	    var walletId = fc.credentials.walletId;
	    themeService.setSkinForWallet(skinId, walletId);
	  };

	  var changeLayout = $rootScope.$on('changeLayout', function(event) {
$log.debug('CHANGE LAYOUT');
			if ($rootScope.skinGalleryLayout == 'grid') {
				$rootScope.skinGalleryLayout = 'list';
			} else if ($rootScope.skinGalleryLayout == 'list') {
				$rootScope.skinGalleryLayout = 'list-detail';
			} else if ($rootScope.skinGalleryLayout == 'list-detail') {
				$rootScope.skinGalleryLayout = 'grid';
			}
			$timeout(function() {
				$rootScope.$apply();
			});
		});

  });
