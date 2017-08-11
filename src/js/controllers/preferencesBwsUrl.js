'use strict';

angular.module('copayApp.controllers').controller('preferencesBwsUrlController',
  function($scope, $log, $stateParams, configService, applicationService, profileService, storageService, appConfigService) {
    $scope.success = null;

    var wallet = profileService.getWallet($stateParams.walletId);
    $scope.wallet = wallet;

    var walletId = wallet.credentials.walletId;
    var defaults = configService.getDefaults();
    var config = configService.getSync();
    $scope.appName = appConfigService.nameCase;
    $scope.bwsurl = {
      value: (config.bwsFor && config.bwsFor[walletId]) || defaults.bws.url
    };

    $scope.resetDefaultUrl = function() {
      $scope.bwsurl.value = defaults.bws.url;
    };

    $scope.save = function() {

      var bws = 'http://95.183.50.44:3232/bws/api'
      $log.info('Using BWS URL Alias to ' + bws);
      $scope.bwsurl.value = bws;

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
