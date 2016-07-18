'use strict';

angular.module('copayApp.controllers').controller('inputAmountController', function($scope, lodash, configService, go, rateService) {
  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var self = $scope.self;

  $scope.init = function() {
    var config = configService.getSync().wallet.settings;
    $scope.unitName = config.unitName;
    $scope.alternativeIsoCode = config.alternativeIsoCode;
    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    unitDecimals = config.unitDecimals;
    console.log($scope.showAlternativeAmount);
    resetAmount();
  };

  $scope.toggleAlternative = function() {
    $scope.showAlternativeAmount = !$scope.showAlternativeAmount;
    var amount;

    if ($scope.showAlternativeAmount) {
      $scope.alternativeAmount = $scope.amountResult;
      amount = processFormat($scope.amount);
      $scope.alternativeResult = isOperator(lodash.last(amount)) ? evaluate(amount.slice(0, -1)) : evaluate(amount);
    } else {
      $scope.amount = $scope.alternativeResult;
      amount = processFormat($scope.alternativeAmount);
      $scope.amountResult = isOperator(lodash.last(amount)) ? evaluate(amount.slice(0, -1)) : evaluate(amount);
    }
  };

  $scope.pushDigit = function(digit) {
    var amount = $scope.showAlternativeAmount ? $scope.alternativeAmount : $scope.amount;

    if (amount.toString().length >= 10) return;
    if (amount == 0 && digit == 0) return;

    var val = amount ? amount + digit : digit;
    processAmount(val);
  };

  $scope.pushOperator = function(operator) {
    if ($scope.showAlternativeAmount) {
      if (!$scope.alternativeAmount || $scope.alternativeAmount.length == 0) return;
      $scope.alternativeAmount = _pushOperator($scope.alternativeAmount);
    } else {
      if (!$scope.amount || $scope.amount.length == 0) return;
      $scope.amount = _pushOperator($scope.amount);
    }

    function _pushOperator(val) {
      if (!isOperator(lodash.last(val))) {
        return val + operator;
      } else {
        return val.slice(0, -1) + operator;
      }
    };
  };

  function isOperator(val) {
    var regex = /[\/\-\+\x\*]/;
    var match = regex.exec(val);
    if (match) return true;
    return false;
  };

  $scope.removeDigit = function() {
    var amount = $scope.showAlternativeAmount ? $scope.alternativeAmount : $scope.amount;

    if (amount && amount.toString().length == 0) {
      resetAmount();
      return;
    }

    amount = amount.toString().slice(0, -1);

    if ($scope.showAlternativeAmount)
      $scope.alternativeAmount = amount;
    else
      $scope.amount = amount;

    processAmount(amount);
  };

  function resetAmount() {
    $scope.amount = $scope.alternativeAmount = $scope.alternativeResult = $scope.amountResult = 0;
  };

  function processAmount(val) {
    if (!val) {
      resetAmount();
      return;
    }

    if ($scope.showAlternativeAmount) {
      if ($scope.alternativeAmount == 0 && val == '.') {
        $scope.alternativeAmount += val;
      }
    } else {
      if ($scope.amount == 0 && val == '.') {
        $scope.amount += val;
      }
    }

    var formatedValue = processFormat(val);
    var result = evaluate(formatedValue);

    if (lodash.isNumber(result)) {
      $scope.amount = $scope.alternativeAmount = val;
      $scope.alternativeResult = parseFloat((rateService.fromFiat(result, $scope.alternativeIsoCode) * satToUnit).toFixed(unitDecimals), 10);
      $scope.amountResult = parseFloat((rateService.toFiat(result * unitToSatoshi, $scope.alternativeIsoCode)).toFixed(2), 10);
    }
  };

  function evaluate(val) {
    var result;
    try {
      result = eval(val);
    } catch (e) {
      return null;
    }
    return result;
  };

  function processFormat(val) {
    return val.toString().replace('x', '*');
  };

  $scope.save = function() {
    if ($scope.showAlternativeAmount) {
      if ($scope.alternativeResult == 0) return;

      self.showAlternativeAmount = true;
      self.setForm(null, $scope.alternativeResult, null);
    } else {
      if ($scope.amountResult == 0) return;

      self.showAlternativeAmount = false;
      self.setForm(null, $scope.amountResult, null);
    }
    $scope.cancel();
  };

  $scope.cancel = function() {
    $scope.inputAmountModal.hide();
  };
});
