'use strict';

angular.module('copayApp.controllers').controller('preferencesBwsUrlController',
  function($scope, $log, configService, go, applicationService, profileService, storageService) {
    this.error = null;
    this.success = null;

    var fc = profileService.focusedClient;
    var walletId = fc.credentials.walletId;
    var defaults = configService.getDefaults();
    var config = configService.getSync();

    this.bwsurl = (config.bwsFor && config.bwsFor[walletId]) || defaults.bws.url;

    this.resetDefaultUrl = function() {
      this.bwsurl = defaults.bws.url;
    };

    this.save = function() {

      var bws;
      switch (this.bwsurl) {
        case 'prod':
        case 'production':
          bws = 'https://bws.bitpay.com/bws/api'
          break;
        case 'sta':
        case 'staging':
          bws = 'https://bws-staging.b-pay.net/bws/api'
          break;
        case 'loc':
        case 'local':
          bws = 'http://localhost:3232/bws/api'
          break;
      };
      if (bws) {
        $log.info('Using BWS URL Alias to ' + bws);
        this.bwsurl = bws;
      }

      var opts = {
        bwsFor: {}
      };
      opts.bwsFor[walletId] = this.bwsurl;

      configService.set(opts, function(err) {
        if (err) console.log(err);
        storageService.setCleanAndScanAddresses(walletId, function() {
          applicationService.restart();
        });
      });
    };
  });
