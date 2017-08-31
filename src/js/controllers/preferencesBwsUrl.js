'use strict';

angular.module('copayApp.controllers').controller('preferencesBwsUrlController',
  function($scope, $log, $stateParams, configService, applicationService, profileService, storageService, appConfigService, networkService) {
    $scope.success = null;

    var wallet = profileService.getWallet($stateParams.walletId);
    $scope.wallet = wallet;

    var walletId = wallet.credentials.walletId;
    var defaults = configService.getDefaults();
    var config = configService.getSync();
    $scope.appName = appConfigService.nameCase;
    $scope.bwsurl = {
      value: (config.bwsFor && config.bwsFor[walletId]) || defaults.currencyNetworks[wallet.network].bws.url
    };

    $scope.resetDefaultUrl = function() {
      $scope.bwsurl.value = defaults.currencyNetworks[wallet.network].bws.url;
    };

    $scope.save = function() {
      var bwsEnvs = networkService.getNetworkByURI(wallet.network).bws;
      var bws;
      switch ($scope.bwsurl.value) {
        case 'prod':
        case 'production':
          bws = bwsEnvs.production.url;
          break;
        case 'sta':
        case 'staging':
          bws = bwsEnvs.staging.url;
          break;
        case 'loc':
        case 'local':
          bws = bwsEnvs.local.url;
          break;
      };
      if (bws) {
        $log.info('Using BWS URL Alias to ' + bws);
        $scope.bwsurl.value = bws;
      }

      var opts = {
        bwsFor: {}
      };
      opts.bwsFor[walletId] = $scope.bwsurl.value;

      configService.set(opts, function(err) {
        if (err) $log.debug(err);
        storageService.setCleanAndScanAddresses(walletId, function() {
          applicationService.restart();
        });
      });
    };
  });
