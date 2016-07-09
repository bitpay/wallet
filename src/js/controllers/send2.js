'use strict';

angular.module('copayApp.controllers').controller('send2Controller', function($scope, lodash, configService, go, rateService) {
  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;

  $scope.init = function() {
    var config = configService.getSync().wallet.settings;
    $scope.unitName = config.unitName;
    $scope.alternativeIsoCode = config.alternativeIsoCode;
    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    unitDecimals = config.unitDecimals;
    $scope.showAlternative = false;
    resetAmount();
  };

  $scope.toggleAlternative = function() {
    $scope.showAlternative = !$scope.showAlternative;

    if ($scope.showAlternative) {
      $scope.alternativeAmount = $scope.amountResult;
      $scope.alternativeResult = isOperator(lodash.last($scope.amount)) ? evaluate($scope.amount.slice(0, -1)) : evaluate($scope.amount);
    } else {
      $scope.amount = $scope.alternativeResult;
      $scope.amountResult = isOperator(lodash.last($scope.alternativeAmount)) ? evaluate($scope.alternativeAmount.slice(0, -1)) : evaluate($scope.alternativeAmount);
    }
  };

  $scope.pushDigit = function(digit) {
    var amount = $scope.showAlternative ? $scope.alternativeAmount : $scope.amount;

    if (amount.toString().length >= 10) return;
    if (amount == 0 && digit == 0) return;

    var val = amount ? amount + digit : digit;
    processAmount(val);
  };

  $scope.pushOperator = function(operator) {
    if ($scope.showAlternative) {
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
    var regex = /[\/\-\+\*]/;
    var match = regex.exec(val);
    if (match) return true;
    return false;
  };

  $scope.removeDigit = function() {
    var amount = $scope.showAlternative ? $scope.alternativeAmount.toString() : $scope.amount.toString();

    if (amount && amount.length == 0) {
      resetAmount();
      return;
    }

    amount = amount.slice(0, -1);

    if ($scope.showAlternative)
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

    if ($scope.showAlternative) {
      if ($scope.alternativeAmount == 0 && val == '.') {
        $scope.alternativeAmount += val;
      }
    } else {
      if ($scope.amount == 0 && val == '.') {
        $scope.amount += val;
      }
    }

    var result = evaluate(val);

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

  $scope.close = function() {
    go.walletHome();
  };
});
