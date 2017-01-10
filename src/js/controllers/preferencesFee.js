'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController', function($scope, $timeout, $ionicHistory, lodash, gettextCatalog, configService, feeService, ongoingProcess, popupService) { 

  $scope.save = function(newFee) {
    var opts = {
      wallet: {
        settings: {
          feeLevel: newFee
        }
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      $scope.currentFeeLevel = newFee;
      updateCurrentValues();
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = feeService.getCurrentFeeLevel();
    $scope.loadingFee = true;
    feeService.getFeeLevels(function(err, levels) {
      $scope.loadingFee = false;
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), err);
        return;
      }
      $scope.feeLevels = levels;
      updateCurrentValues();
      $scope.$apply();
    });
  });

  var updateCurrentValues = function() {
    var feeLevelValue = lodash.find($scope.feeLevels['livenet'], {
      level: $scope.currentFeeLevel
    });
    $scope.feePerKBUnit = feeLevelValue.feePerKBUnit;
    $scope.avgConfirmationTime = feeLevelValue.nbBlocks * 10;
  };
});
