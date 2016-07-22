'use strict';

angular.module('copayApp.controllers').controller('customAmountController', function($scope, $timeout, $filter, platformInfo, rateService) {
  var self = $scope.self;

  $scope.unitName = self.unitName;
  $scope.alternativeAmount = self.alternativeAmount;
  $scope.alternativeName = self.alternativeName;
  $scope.alternativeIsoCode = self.alternativeIsoCode;
  $scope.isRateAvailable = self.isRateAvailable;
  $scope.unitToSatoshi = self.unitToSatoshi;
  $scope.unitDecimals = self.unitDecimals;
  var satToUnit = 1 / self.unitToSatoshi;
  $scope.showAlternative = false;
  $scope.isCordova = platformInfo.isCordova;

  Object.defineProperty($scope,
    "_customAlternative", {
      get: function() {
        return $scope.customAlternative;
      },
      set: function(newValue) {
        $scope.customAlternative = newValue;
        if (typeof(newValue) === 'number' && $scope.isRateAvailable) {
          $scope.customAmount = parseFloat((rateService.fromFiat(newValue, $scope.alternativeIsoCode) * satToUnit).toFixed($scope.unitDecimals), 10);
        } else {
          $scope.customAmount = null;
        }
      },
      enumerable: true,
      configurable: true
    });

  Object.defineProperty($scope,
    "_customAmount", {
      get: function() {
        return $scope.customAmount;
      },
      set: function(newValue) {
        $scope.customAmount = newValue;
        if (typeof(newValue) === 'number' && $scope.isRateAvailable) {
          $scope.customAlternative = parseFloat((rateService.toFiat(newValue * $scope.unitToSatoshi, $scope.alternativeIsoCode)).toFixed(2), 10);
        } else {
          $scope.customAlternative = null;
        }
        $scope.alternativeAmount = $scope.customAlternative;
      },
      enumerable: true,
      configurable: true
    });

  $scope.submitForm = function(form) {
    var satToBtc = 1 / 100000000;
    var amount = form.amount.$modelValue;
    var amountSat = parseInt((amount * $scope.unitToSatoshi).toFixed(0));
    $timeout(function() {
      $scope.customizedAmountUnit = amount + ' ' + $scope.unitName;
      $scope.customizedAlternativeUnit = $filter('formatFiatAmount')(form.alternative.$modelValue) + ' ' + $scope.alternativeIsoCode;
      if ($scope.unitName == 'bits') {
        amount = (amountSat * satToBtc).toFixed(8);
      }
      $scope.customizedAmountBtc = amount;
    }, 1);
  };

  $scope.toggleAlternative = function() {
    $scope.showAlternative = !$scope.showAlternative;
  };

  $scope.shareAddress = function(uri) {
    if (platformInfo.isCordova) {
      window.plugins.socialsharing.share(uri, null, null, null);
    }
  };

  $scope.cancel = function() {
    $scope.customAmountModal.hide();
  };
});
