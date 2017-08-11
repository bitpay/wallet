'use strict';

angular.module('copayApp.controllers').controller('feeLevelsController', function($scope, $timeout, $log, lodash, gettextCatalog, configService, feeService, ongoingProcess, popupService, networkService) {

  var FEE_MULTIPLIER = 10;
  var FEE_MIN = 0;

  var showErrorAndClose = function(title, msg) {
    title = title || gettextCatalog.getString('Error');
    $log.error(msg);
    popupService.showAlert(title, msg, function() {
      $scope.chooseFeeLevelModal.hide();
    });

  };

  var getMinRecommended = function() {
    var value = lodash.find($scope.feeLevels[$scope.network], {
      level: 'superEconomy'
    });
    return parseInt((value.feePerKB / 1000).toFixed());
  };

  var getMaxRecommended = function() {
    var value = lodash.find($scope.feeLevels[$scope.network], {
      level: 'urgent'
    });
    return parseInt((value.feePerKB / 1000).toFixed());
  };

  $scope.isTestnet = function(networkURI) {
    return networkService.isTestnet(networkURI);
  };

  $scope.ok = function() {
    $scope.customFeePerKB = $scope.customFeePerKB ? ($scope.customAtomicPerByte.value * 1000).toFixed() : null;
    $scope.hideModal($scope.feeLevel, $scope.customFeePerKB);
  };

  $scope.setFeesRecommended = function() {
    $scope.maxFeeRecommended = getMaxRecommended();
    $scope.minFeeRecommended = getMinRecommended();
    $scope.minFeeAllowed = FEE_MIN;
    $scope.maxFeeAllowed = $scope.maxFeeRecommended * FEE_MULTIPLIER;
  };

  $scope.checkFees = function(feePerAtomicByte) {
    var fee = Number(feePerAtomicByte);

    if (fee <= $scope.minFeeAllowed) $scope.showError = true;
    else $scope.showError = false;

    if (fee > $scope.minFeeAllowed && fee < $scope.minFeeRecommended) $scope.showMinWarning = true;
    else $scope.showMinWarning = false;

    if (fee < $scope.maxFeeAllowed && fee > $scope.maxFeeRecommended) $scope.showMaxWarning = true;
    else $scope.showMaxWarning = false;
  };

  $scope.updateFeeRate = function() {
    var value = lodash.find($scope.feeLevels[$scope.network], {
      level: $scope.feeLevel
    });

    // If no custom fee
    if (value) {
      $scope.customFeePerKB = null;
      $scope.feePerAtomicByte = (value.feePerKB / 1000).toFixed();
      $scope.avgConfirmationTime = value.nbBlocks * 10;
    } else {
      $scope.avgConfirmationTime = null;
      $scope.customAtomicPerByte = { value: Number($scope.feePerAtomicByte) };
      $scope.customFeePerKB = ($scope.feePerAtomicByte * 1000).toFixed();
    }

    // Warnings
    $scope.setFeesRecommended();
    $scope.checkFees($scope.feePerAtomicByte);

    $timeout(function() {
      $scope.$apply();
    });
  };

  $scope.$watch(
    "selectedFee.value",
    function ( newValue, oldValue ) {
      if (newValue != oldValue) {
        $log.debug('New fee level: ' + newValue);
        $scope.feeLevel = $scope.selectedFee.value;
        $scope.updateFeeRate();
      }
    }
  );

  // From parent controller
  // $scope.network
  // $scope.feeLevel
  //
  // IF usingCustomFee
  // $scope.customFeePerKB
  // $scope.feePerAtomicByte

  $scope.atomicUnit = networkService.getAtomicUnit($scope.network);

  if (lodash.isEmpty($scope.feeLevel)) showErrorAndClose(null, gettextCatalog.getString('Fee level is not defined') );
  $scope.selectedFee = { value: $scope.feeLevel };

  $scope.feeOpts = feeService.getFeeOpts($scope.network);
  $scope.loadingFee = true;
  feeService.getFeeLevels($scope.network, function(err, levels) {
    $scope.loadingFee = false;
    if (err || lodash.isEmpty(levels)) {
      showErrorAndClose(null, err);
      return;
    }
    if (lodash.isEmpty(levels)) {
      showErrorAndClose(null, gettextCatalog.getString('Could not get fee levels'));
      return;
    }
    $scope.feeLevels = levels;
    $scope.updateFeeRate();
  });

});
