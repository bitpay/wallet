'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController',
  function($rootScope, configService) {

    this.save = function(newFee) {
      var opts = {
        wallet: {
          settings: {
            feeLevel: newFee
          }
        }
      };
      $rootScope.$emit('Local/FeeLevelUpdated', newFee);

      configService.set(opts, function(err) {
        if (err) $log.debug(err);
      });

    };
  });
