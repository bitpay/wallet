'use strict';

angular.module('copayApp.controllers').controller('inputAmountController', function($rootScope, $scope, $filter, $timeout, $ionicScrollDelegate, profileService, platformInfo, lodash, configService, go, rateService) {
  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var self = $scope.self;

  $scope.init = function() {
    var config = configService.getSync().wallet.settings;
    $scope.unitName = config.unitName;
    $scope.alternativeIsoCode = config.alternativeIsoCode;
    $scope.specificAmount = $scope.specificAlternativeAmount = '';
    $scope.isCordova = platformInfo.isCordova;
    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    unitDecimals = config.unitDecimals;
    $scope.resetAmount();
    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 100);
  };

  $scope.shareAddress = function(uri) {
    if ($scope.isCordova) {
      window.plugins.socialsharing.share(uri, null, null, null);
    }
  };

  $scope.toggleAlternative = function() {
    $scope.showAlternativeAmount = !$scope.showAlternativeAmount;

    if ($scope.amount && isExpression($scope.amount)) {
      var amount = evaluate(format($scope.amount));
      if ($scope.showAlternativeAmount)
        $scope.globalResult = '= ' + $filter('formatFiatAmount')(amount);
      else
        $scope.globalResult = '= ' + profileService.formatAmount(amount * unitToSatoshi, true);
    }
  };

  function checkFontSize() {
    if ($scope.amount && $scope.amount.length >= 13) $scope.smallFont = true;
    else $scope.smallFont = false;
  };

  $scope.pushDigit = function(digit) {
    checkFontSize();
    if ($scope.amount && $scope.amount.length >= 19) return;

    $scope.amount = ($scope.amount + digit).replace('..', '.');
    processAmount($scope.amount);
  };

  $scope.pushOperator = function(operator) {
    if (!$scope.amount || $scope.amount.length == 0) return;
    $scope.amount = _pushOperator($scope.amount);

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

  function isExpression(val) {
    var regex = /^\.?\d+(\.?\d+)?([\/\-\+\*x]\d?\.?\d+)+$/;
    var match = regex.exec(val);

    if (match) return true;
    return false;
  };

  $scope.removeDigit = function() {
    if ($scope.amount.toString().length == 1) {
      $scope.resetAmount();
      return;
    }

    $scope.amount = $scope.amount.slice(0, -1);
    processAmount($scope.amount);
    checkFontSize();
  };

  $scope.resetAmount = function() {
    $scope.amount = $scope.alternativeResult = $scope.amountResult = $scope.globalResult = '';
    checkFontSize();
  };

  function processAmount(val) {
    if (!val) {
      $scope.resetAmount();
      return;
    }

    var formatedValue = format(val);
    var result = evaluate(formatedValue);

    if (lodash.isNumber(result)) {
      if ($scope.showAlternativeAmount)
        $scope.globalResult = isExpression(val) ? '= ' + $filter('formatFiatAmount')(result) : '';
      else
        $scope.globalResult = isExpression(val) ? '= ' + profileService.formatAmount(result * unitToSatoshi, true) : '';

      $scope.amountResult = $filter('formatFiatAmount')(toFiat(result));
      $scope.alternativeResult = profileService.formatAmount(fromFiat(result) * unitToSatoshi, true);
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
      return 0;
    }
    if (result == 'Infinity' || lodash.isNaN(result)) return 0;
    return result;
  };

  function format(val) {
    var result = val.toString();

    if (isOperator(lodash.last(val)))
      result = result.slice(0, -1);

    return result.replace('x', '*');
  };

  $scope.finish = function() {
    var amount;
    var alternativeAmount;

    if ($scope.showAlternativeAmount) {
      amount = $scope.alternativeResult;
      alternativeAmount = evaluate(format($scope.amount));
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

      $scope.specificAmount = profileService.formatAmount(amount * unitToSatoshi, true);
      $scope.specificAlternativeAmount = $filter('formatFiatAmount')(alternativeAmount);
      $timeout(function() {
        $ionicScrollDelegate.resize();
      }, 100);
    } else {
      self.setAmount(amount, alternativeAmount, $scope.showAlternativeAmount);
      $scope.cancel();
    }
  };

  $scope.cancel = function() {
    $scope.inputAmountModal.hide();
  };
});
