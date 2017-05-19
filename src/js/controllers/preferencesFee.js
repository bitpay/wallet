'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController', function($scope, $timeout, $ionicHistory, lodash, gettextCatalog, configService, feeService, ongoingProcess, popupService) {

  $scope.save = function(newFee) {

    if ($scope.customFeeLevel) {
      $scope.currentFeeLevel = newFee;
      updateCurrentValues();
      return;
    }

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
    $scope.init();
  });

  $scope.init = function() {
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = $scope.customFeeLevel ? $scope.customFeeLevel : feeService.getCurrentFeeLevel();
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
  };

  var updateCurrentValues = function() {
    if (lodash.isEmpty($scope.feeLevels) || lodash.isEmpty($scope.currentFeeLevel)) return;
    var feeLevelValue = lodash.find($scope.feeLevels['livenet'], {
      level: $scope.currentFeeLevel
    });
    if (lodash.isEmpty(feeLevelValue)) {
      $scope.feePerSatByte = null;
      $scope.avgConfirmationTime = null;
      return;
    }
    $scope.feePerSatByte = (feeLevelValue.feePerKB / 1000).toFixed();
    $scope.avgConfirmationTime = feeLevelValue.nbBlocks * 10;
  };

  $scope.chooseNewFee = function() {
    $scope.hideModal($scope.currentFeeLevel);
  };
});
