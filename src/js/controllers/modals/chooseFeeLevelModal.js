'use strict';

angular.module('copayApp.controllers').controller('chooseFeeLevelModalController', function($scope, $timeout, $log, lodash, gettextCatalog, configService, feeService, ongoingProcess, popupService) {

  var FEE_MULTIPLIER = 10;
  var MINIMUM_FEE_ALLOWED = 0;
  var MINIMUM_FEE_RECOMMENDED = 'superEconomy';
  var MAXIMUM_FEE_RECOMMENDED = 'urgent';

  var getMinRecommended = function() {
    var value = lodash.find($scope.feeLevels[$scope.network], {
      level: MINIMUM_FEE_RECOMMENDED
    });
    return parseInt((value.feePerKb / 1000).toFixed());
  };

  var getMaxRecommended = function() {
    var value = lodash.find($scope.feeLevels[$scope.network], {
      level: MAXIMUM_FEE_RECOMMENDED
    });
    return parseInt((value.feePerKb / 1000).toFixed());
  };

  var showErrorAndClose = function(title, msg) {
    title = title || gettextCatalog.getString('Error');
    $log.error(msg);
    popupService.showAlert(title, msg, function() {
      $scope.chooseFeeLevelModal.hide();
    });
  };

  var setRecommendedFees = function() {
    $scope.maxFeeRecommended = getMaxRecommended();
    $scope.minFeeRecommended = getMinRecommended();
    $scope.minFeeAllowed = MINIMUM_FEE_ALLOWED;
    $scope.maxFeeAllowed = $scope.maxFeeRecommended * FEE_MULTIPLIER;
  };

  $scope.checkRecommendedLimits = function(fee) {
    var fee = Number(fee);

    if (fee <= $scope.minFeeAllowed) $scope.showError = true;
    else $scope.showError = false;

    if (fee > $scope.minFeeAllowed && fee < $scope.minFeeRecommended) $scope.showMinWarning = true;
    else $scope.showMinWarning = false;

    if (fee < $scope.maxFeeAllowed && fee > $scope.maxFeeRecommended) $scope.showMaxWarning = true;
    else $scope.showMaxWarning = false;
  };

  var updateFeeRate = function(newFeeLevel) {
    var level = newFeeLevel || $scope.currentFeeLevel;

    var feeLevelFound = lodash.find($scope.feeLevels[$scope.network], {
      level: level
    });

    // If no custom fee
    if (feeLevelFound) {
      $scope.fee = (feeLevelFound.feePerKb / 1000).toFixed();
      $scope.avgConfirmationTime = feeLevelFound.nbBlocks * 10;
    } else {
      $scope.avgConfirmationTime = null;
      $scope.customFee = {
        value: $scope.customFee ? $scope.customFee.value : Number($scope.fee)
      };
    }

    // Warnings
    setRecommendedFees();
    $scope.checkRecommendedLimits($scope.fee);

    $timeout(function() {
      $scope.$apply();
    });
  };

  // Set fee level options
  $scope.feeOpts = feeService.feeOpts;
  $scope.selectedFee = {
    value: $scope.currentFeeLevel
  };
  $scope.loadingFee = true;

  feeService.getFeeLevels($scope.coin, function(err, levels) {
    $scope.loadingFee = false;
    if (err || lodash.isEmpty(levels)) {
      showErrorAndClose(null, err || gettextCatalog.getString('Could not get fee levels'));
      return;
    }

    $scope.feeLevels = levels;
    updateFeeRate();
  });

  $scope.ok = function() {
    $scope.customFeePerKB = $scope.selectedFee.value == 'custom' ? ($scope.customFee.value * 1000).toFixed() : null;
    $scope.hideModal($scope.selectedFee.value, $scope.customFeePerKB);
  };

  $scope.changeFeeLevel = function() {
    $log.debug('New fee level: ' + $scope.selectedFee.value);
    updateFeeRate($scope.selectedFee.value);
  };
});
