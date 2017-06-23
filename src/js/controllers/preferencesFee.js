'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController', function($scope, $timeout, $ionicHistory, lodash, gettextCatalog, configService, feeService, ongoingProcess, popupService) {

  var network;

  $scope.save = function(newFee) {
    $scope.currentFeeLevel = newFee;
    updateCurrentValues();

    if ($scope.noSave) 
      return;

    var opts = {
      wallet: {
        settings: {
          feeLevel: newFee
        }
      }
    };

    configService.set(opts, function(err) {
      if (err) $log.debug(err);
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.init();
  });

  $scope.init = function() {

    $scope.network = $scope.network || 'livenet';
    $scope.feeOpts = feeService.feeOpts;
    $scope.currentFeeLevel = $scope.feeLevel || feeService.getCurrentFeeLevel();
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
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  var updateCurrentValues = function() {
    if (lodash.isEmpty($scope.feeLevels) || lodash.isEmpty($scope.currentFeeLevel)) return;

    var value = lodash.find($scope.feeLevels[$scope.network], {
      level: $scope.currentFeeLevel
    });

    if (lodash.isEmpty(value)) {
      $scope.feePerSatByte = null;
      $scope.avgConfirmationTime = null;
      return;
    }

    $scope.feePerSatByte = (value.feePerKB / 1000).toFixed();
    $scope.avgConfirmationTime = value.nbBlocks * 10;
  };

  $scope.chooseNewFee = function() {
    $scope.hideModal($scope.currentFeeLevel);
  };
});
