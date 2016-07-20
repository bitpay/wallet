'use strict';

angular.module('copayApp.controllers').controller('inputAmountController', function($rootScope, $scope, platformInfo, lodash, configService, go, rateService) {
  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var self = $scope.self;

  $scope.init = function() {
    var config = configService.getSync().wallet.settings;
    $scope.unitName = config.unitName;
    $scope.alternativeIsoCode = config.alternativeIsoCode;
    $scope.specificAmount = $scope.specificAlternativeAmount = null;
    $scope.isCordova = platformInfo.isCordova;
    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    unitDecimals = config.unitDecimals;
    resetAmount();
  };

  $scope.shareAddress = function(uri) {
    if ($scope.isCordova) {
      window.plugins.socialsharing.share(uri, null, null, null);
    }
  };

  $scope.toggleAlternative = function() {
    $scope.showAlternativeAmount = !$scope.showAlternativeAmount;
    var amount;

    if ($scope.showAlternativeAmount) {
      $scope.alternativeAmount = $scope.amountResult;
      amount = format($scope.amount);
      $scope.alternativeResult = isOperator(lodash.last(amount)) ? evaluate(amount.slice(0, -1)) : evaluate(amount);
    } else {
      $scope.amount = $scope.alternativeResult;
      amount = format($scope.alternativeAmount);
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

    var formatedValue = format(val);
    var result = evaluate(formatedValue);

    if (lodash.isNumber(result)) {
      $scope.amount = $scope.alternativeAmount = val;
      $scope.amountResult = toFiat(result);
      $scope.alternativeResult = fromFiat(result);
    }
  };

  function fromFiat(val) {
    return parseFloat((rateService.fromFiat(val, $scope.alternativeIsoCode) * satToUnit).toFixed(unitDecimals), 10);
  };

  function toFiat(val) {
    return parseFloat((rateService.toFiat(val * unitToSatoshi, $scope.alternativeIsoCode)).toFixed(2), 10);
  };

  function evaluate(val) {
    var result;
    try {
      result = $scope.$eval(val);
    } catch (e) {
      return null;
    }
    if (result == 'Infinity') return null;
    return result;
  };

  function format(val) {
    return val.toString().replace('x', '*');
  };

  $scope.finish = function() {
    var amount;
    var alternativeAmount;

    if ($scope.showAlternativeAmount) {
      amount = $scope.alternativeResult;
      alternativeAmount = evaluate(format($scope.alternativeAmount));
    } else {
      amount = evaluate(format($scope.amount));
      alternativeAmount = toFiat(amount);
    }

    if ($scope.address) {
      var satToBtc = 1 / 100000000;
      var amountSat = parseInt((amount * unitToSatoshi).toFixed(0));
      if ($scope.unitName == 'bits') {
        $scope.specificAmountBtc = (amountSat * satToBtc).toFixed(8);
      }

      $scope.specificAmount = amount;
      $scope.specificAlternativeAmount = alternativeAmount;
    } else {
      self.setAmount(amount, alternativeAmount, $scope.showAlternativeAmount);
      $scope.cancel();
    }
  };

  $scope.cancel = function() {
    $scope.inputAmountModal.hide();
  };
});
