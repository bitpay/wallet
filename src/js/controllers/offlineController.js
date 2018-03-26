'use strict';

angular.module('copayApp.controllers').controller('offlineController',
  function($rootScope, $timeout, $scope, $state, $stateParams, $ionicModal, $ionicScrollDelegate, $window, gettextCatalog, lodash, popupService, ongoingProcess, externalLinkService, latestReleaseService, profileService, walletService, configService, $log, platformInfo, storageService, txpModalService, appConfigService, startupService, addressbookService, feedbackService, bwcError, nextStepsService, buyAndSellService, homeIntegrationsService, bitpayCardService, pushNotificationsService, timeService) {
    var wallet;
    var listeners = [];
    var notifications = [];
    var backOnline = {}
    $scope.externalServices = {};
    $scope.version = $window.version;
    $scope.name = appConfigService.nameCase;
    $scope.isCordova = platformInfo.isCordova;
    $scope.isAndroid = platformInfo.isAndroid;
    $scope.isWindowsPhoneApp = platformInfo.isCordova && platformInfo.isWP;
    $scope.isNW = platformInfo.isNW;

    $scope.$on("$ionicView.afterEnter", function() {
      startupService.ready();
    });

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      backOnline = function() {
        $state.go('tabs.home');
        // Show a different icon based on offline/online
      }
     window.addEventListener('online',  backOnline)
    });

    $scope.$on("$ionicView.enter", function(event, data) {
      updateAllWallets();
    });

    $scope.$on("$ionicView.leave", function(event, data) {
      lodash.each(listeners, function(x) {
        x();
      });
      window.removeEventListener('online', backOnline)
    });


    var updateAllWallets = function() {
      $scope.wallets = profileService.getWallets();
      if (lodash.isEmpty($scope.wallets)) return;

      var i = $scope.wallets.length;
      var j = 0;
      var timeSpan = 60 * 60 * 24 * 7;

      lodash.each($scope.wallets, function(wallet) {
        profileService.setLastKnownBalance(wallet.id, wallet.cachedBalance, function() {});
      });
    };
  });
