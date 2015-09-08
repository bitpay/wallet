'use strict';

angular.module('copayApp.controllers').controller('preferencesBwsUrlController',
  function($scope,$log, configService, isMobile, isCordova, go,  applicationService ) {
    this.isSafari = isMobile.Safari();
    this.isCordova = isCordova;
    this.error = null;
    this.success = null;

    var config = configService.getSync();

    this.bwsurl = config.bws.url;

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
        bws: {
          url: this.bwsurl,
        }
      };

      configService.set(opts, function(err) {
        if (err) console.log(err);
        $scope.$emit('Local/BWSUpdated');
        applicationService.restart();
      });
    };


  });
