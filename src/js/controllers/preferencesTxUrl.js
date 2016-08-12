'use strict';

angular.module('copayApp.controllers').controller('preferencesTxUrlController',
  function($scope, $log, configService, applicationService, profileService, storageService) {
    $scope.error = null;
    $scope.success = null;

    var fc = profileService.focusedClient;
    var walletId = fc.credentials.walletId;
    var defaults = configService.getDefaults();
    var config = configService.getSync();

    $scope.txurl = (config.txFor && config.txFor[walletId]) || defaults.tx.url;

    $scope.resetDefaultUrl = function() {
      $scope.txurl = defaults.tx.url;
    };

    $scope.save = function() {

      var tx;
      switch ($scope.txurl) {
        case 'prod':
        case 'production':
          tx = 'https://insight.bitpay.com/tx/${txid}'
          break;
        case 'sta':
        case 'staging':
          tx = 'https://test-insight.bitpay.com/tx/${txid}'
          break;
        case 'loc':
        case 'local':
          tx = 'http://localhost:3001/insight/tx/${txid}'
          break;
      };
      if (tx) {
        $log.info('Using transaction URL Alias to ' + tx);
        $scope.txurl = tx;
      }

      var opts = {
        txFor: {}
      };
      opts.txFor[walletId] = $scope.txurl;

      configService.set(opts, function(err) {
        if (err) $log.debug(err);
        storageService.setCleanAndScanAddresses(walletId, function() {
          applicationService.restart();
        });
      });
    };
  });
