'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController', function($scope, $timeout, $ionicHistory, $ionicNavBarDelegate, gettextCatalog, configService, feeService, ongoingProcess) {
  $ionicNavBarDelegate.title(gettextCatalog.getString('Bitcoin Network Fee Policy'));

  $scope.init = function() {
    ongoingProcess.set('gettingFeeLevels', true);
    feeService.getFeeLevels(function(levels) {
      ongoingProcess.set('gettingFeeLevels', false);
      $scope.feeOpts = feeService.feeOpts;
      $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
      $scope.feeLevels = levels;
      $scope.$apply();
    });
  }

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
      $ionicHistory.goBack();
      $timeout(function() {
        $scope.$apply();
      }, 100);
    });
  };
});
