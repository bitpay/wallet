'use strict';

angular.module('copayApp.controllers').controller('preferencesAliasController',
  function($scope, $timeout, $stateParams, $ionicHistory, configService, profileService, walletService) {
    var wallet = profileService.getWallet($stateParams.walletId);
    var walletId = wallet.credentials.walletId;
    var config = configService.getSync();

    $scope.walletName = wallet.credentials.walletName;
    $scope.walletAlias = config.aliasFor && config.aliasFor[walletId] ? config.aliasFor[walletId] : wallet.credentials.walletName;
    $scope.alias = {
      value: $scope.walletAlias
    };

    $scope.save = function() {
      var opts = {
        aliasFor: {}
      };

      opts.aliasFor[walletId] = $scope.alias.value;

      configService.set(opts, function(err) {
        if (err) $log.warn(err);
        $ionicHistory.goBack();
      });
    };
  });
