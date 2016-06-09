'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController',
  function($scope, $rootScope, configService, feeService) {

    this.init = function() {
      var self = this;
      this.loading = true;
      feeService.getFeeLevels(function(levels) {
        self.loading = false;
        self.feeOpts = feeService.feeOpts;
        $scope.data = {
          currentFeeLevel: feeService.getCurrentFeeLevel()
        };
        self.feeLevels = levels;
        $scope.$apply();
      });
    };

    this.save = function(newFee) {
      var self = this;
      var opts = {
        wallet: {
          settings: {
            feeLevel: newFee.level
          }
        }
      };

      configService.set(opts, function(err) {
        if (err) $log.debug(err);
        $scope.currentFeeLevel = newFee.level;
      });

    };
  });
