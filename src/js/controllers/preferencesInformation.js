'use strict';

angular.module('copayApp.controllers').controller('preferencesInformation',
  function($scope, $log, $ionicHistory, platformInfo, lodash, profileService, configService, $stateParams, $state, walletService) {
    var wallet = profileService.getWallet($stateParams.walletId);
    $scope.wallet = wallet;

    var walletId = wallet.id;
    var config = configService.getSync();
    var colorCounter = 1;
    var BLACK_WALLET_COLOR = '#202020';
    $scope.isCordova = platformInfo.isCordova;
    config.colorFor = config.colorFor || {};

    $scope.saveBlack = function() {
      function save(color) {
        var opts = {
          colorFor: {}
        };
        opts.colorFor[walletId] = color;

        configService.set(opts, function(err) {
          $ionicHistory.removeBackView();
          $state.go('tabs.home');
          if (err) $log.warn(err);
        });
      };

      if (colorCounter != 5) return colorCounter++;
      save(BLACK_WALLET_COLOR);
    };

    $scope.$on("$ionicView.enter", function(event, data) {
      var c = wallet.credentials;
      var basePath = c.getBaseAddressDerivationPath();

      $scope.wallet = wallet;
      $scope.walletName = c.walletName;
      $scope.walletId = c.walletId;
      $scope.network = c.network;
      $scope.addressType = c.addressType || 'P2SH';
      $scope.derivationStrategy = c.derivationStrategy || 'BIP45';
      $scope.basePath = basePath;
      $scope.M = c.m;
      $scope.N = c.n;
      $scope.pubKeys = lodash.pluck(c.publicKeyRing, 'xPubKey');
      $scope.externalSource = null;
      $scope.canSign = wallet.canSign();

      if (wallet.isPrivKeyExternal()) {
        $scope.externalSource = lodash.find(walletService.externalSource, function(source) {
          return source.id == wallet.getPrivKeyExternalSourceName();
        }).name;
      }
    });

  });
