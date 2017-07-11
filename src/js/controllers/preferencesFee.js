'use strict';

angular.module('copayApp.controllers').controller('preferencesFeeController', function($scope, $timeout, $ionicHistory, lodash, gettextCatalog, configService, feeService, ongoingProcess, popupService) {

  $scope.save = function(newFee) {

    $scope.currentFeeLevel = newFee;

    if ($scope.currentFeeLevel != 'custom') updateCurrentValues();
    else showCustomFeePrompt();

    if ($scope.noSave) return;

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
      $scope.feePerSatByte = $scope.currentFeeLevel == 'custom' ? $scope.feePerSatByte : null;
      $scope.avgConfirmationTime = null;
      setMinWarning();
      setMaxWarning();
      return;
    }

    $scope.feePerSatByte = (value.feePerKB / 1000).toFixed();
    $scope.avgConfirmationTime = value.nbBlocks * 10;
    $scope.invalidCustomFeeEntered = false;
    setMinWarning();
    setMaxWarning();
  };

  $scope.chooseNewFee = function() {
    $scope.hideModal($scope.currentFeeLevel, $scope.customFeePerKB);
  };

  var showCustomFeePrompt = function() {
    $scope.invalidCustomFeeEntered = true;
    $scope.showMaxWarning = false;
    $scope.showMinWarning = false;
    popupService.showPrompt(gettextCatalog.getString('Custom Fee'), gettextCatalog.getString('Set your own fee in satoshis/byte'), null, function(text) {
      if (!text || !parseInt(text) || parseInt(text) <= 0) return;
      $scope.feePerSatByte = parseInt(text);
      $scope.customFeePerKB = ($scope.feePerSatByte * 1000).toFixed();
      setMaxWarning();
      setMinWarning();
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  $scope.getMinimumRecommeded = function() {
    var value = lodash.find($scope.feeLevels[$scope.network], {
      level: 'superEconomy'
    });
    return parseInt((value.feePerKB / 1000).toFixed());
  };

  var setMinWarning = function() {
    if (parseInt($scope.feePerSatByte) < $scope.getMinimumRecommeded()) $scope.showMinWarning = true;
    else $scope.showMinWarning = false;
  };

  var setMaxWarning = function() {
    if (parseInt($scope.feePerSatByte) > 1000) {
      $scope.showMaxWarning = true;
      $scope.invalidCustomFeeEntered = true;
    } else {
      $scope.showMaxWarning = false;
      $scope.invalidCustomFeeEntered = false;
    }
  };

});
