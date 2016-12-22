'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController', function($scope, $timeout, $ionicHistory, gettextCatalog, configService, feeService, ongoingProcess, popupService) {

  ongoingProcess.set('gettingFeeLevels', true);
  feeService.getFeeLevels(function(err, levels) {
    ongoingProcess.set('gettingFeeLevels', false);
    if (err) {
      popupService.showAlert(gettextCatalog.getString('Error'), err);
      return;
    }
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
      });
    });
  };

  $scope.$on("$ionicView.enter", function(event, data) {
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
  });
});
