'use strict';

angular.module('copayApp.controllers').controller('preferencesBwsUrlController',
  function($scope, $rootScope, $filter, $timeout, $modal, balanceService, notification, backupService, profileService, configService, isMobile, isCordova, go, rateService, applicationService, bwcService) {
    this.isSafari = isMobile.Safari();
    this.isCordova = isCordova;
    this.hideAdv = true;
    this.hidePriv = true;
    this.hideSecret = true;
    this.error = null;
    this.success = null;

    var config = configService.getSync();

    this.bwsurl = config.bws.url;

    this.save = function() {
      var opts = {
        bws: {
          url: this.bwsurl,
        }
      };

      configService.set(opts, function(err) {
        if (err) console.log(err);
        applicationService.restart(true);
        go.walletHome();
        $scope.$emit('Local/ConfigurationUpdated');
      });
    };


  });
