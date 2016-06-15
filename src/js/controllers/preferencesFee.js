'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController', function($scope, $timeout, configService, feeService) {

  $scope.loading = true;
  feeService.getFeeLevels(function(levels) {
    $scope.loading = false;
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
    $scope.feeLevels = levels;
    $scope.$apply();
  });

  $scope.save = function(newFee) {
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
      $timeout(function() {
        $scope.$apply();
      }, 10);
    });
  };
});
