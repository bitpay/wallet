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
        //Error is already formatted
        popupService.showAlert(err);
        return;
      }
      $scope.feeLevels = levels;
      updateCurrentValues();
      $scope.$apply();
    });
  });

  var updateCurrentValues = function() {
    if (lodash.isEmpty($scope.feeLevels) || lodash.isEmpty($scope.currentFeeLevel)) return;
    var feeLevelValue = lodash.find($scope.feeLevels['livenet'], {
      level: $scope.currentFeeLevel
    });
    if (lodash.isEmpty(feeLevelValue)) {
      $scope.feePerKBUnit = null;
      $scope.avgConfirmationTime = null; 
      return;
    }
    $scope.feePerKBUnit = feeLevelValue.feePerKBUnit;
    $scope.avgConfirmationTime = feeLevelValue.nbBlocks * 10;
  };
});
