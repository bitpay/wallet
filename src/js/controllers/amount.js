'use strict';

angular.module('copayApp.controllers').controller('amountController', function($scope, $filter, $timeout, $ionicScrollDelegate, $ionicHistory, gettextCatalog, platformInfo, lodash, configService, rateService, $stateParams, $window, $state, $log, txFormatService, ongoingProcess, popupService, bwcError, payproService, profileService, bitcore, amazonService, nodeWebkitService) {
  var _id;
  var unitToSatoshi;
  var satToUnit;
  var unitDecimals;
  var satToBtc;
  var SMALL_FONT_SIZE_LIMIT = 10;
  var LENGTH_EXPRESSION_LIMIT = 19;
  var isNW = platformInfo.isNW;
  $scope.isChromeApp = platformInfo.isChromeApp;

  $scope.$on('$ionicView.leave', function() {
    angular.element($window).off('keydown');
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    console.log('amountController beforeEnter', data);
    // Go to...
    _id = data.stateParams.id; // Optional (BitPay Card ID or Wallet ID)
    $scope.nextStep = data.stateParams.nextStep;
    $scope.currency = data.stateParams.currency;
    $scope.forceCurrency = data.stateParams.forceCurrency;

    $scope.showMenu = $ionicHistory.backView() && ($ionicHistory.backView().stateName == 'tabs.send' ||
      $ionicHistory.backView().stateName == 'tabs.bitpayCard');
    $scope.recipientType = data.stateParams.recipientType || null;
    $scope.toAddress = data.stateParams.toAddress;
    $scope.toName = data.stateParams.toName;
    $scope.toEmail = data.stateParams.toEmail;
    $scope.showAlternativeAmount = !!$scope.nextStep;
    $scope.toColor = data.stateParams.toColor;
    $scope.showSendMax = false;
    $scope.privatePayment = data.stateParams.privatePayment || false;

    if (!$scope.nextStep && !data.stateParams.toAddress) {
      $log.error('Bad params at amount')
      throw ('bad params');
    }

    var reNr = /^[1234567890\.]$/;
    var reOp = /^[\*\+\-\/]$/;

    var disableKeys = angular.element($window).on('keydown', function(e) {
      if (!e.key) return;
      if (e.which === 8) { // you can add others here inside brackets.
        e.preventDefault();
        $scope.removeDigit();
      }

      if (e.key.match(reNr)) {
        $scope.pushDigit(e.key);
      } else if (e.key.match(reOp)) {
        $scope.pushOperator(e.key);
      } else if (e.keyCode === 86) {
        if (e.ctrlKey || e.metaKey)
          processClipboard();
      } else if (e.keyCode === 13)
        $scope.finish();

      $timeout(function() {
        $scope.$apply();
      });
    });

    var config = configService.getSync().wallet.settings;
    $scope.unitName = config.unitName;
    if (data.stateParams.currency) {
      $scope.alternativeIsoCode = data.stateParams.currency;
    } else {
      $scope.alternativeIsoCode = config.alternativeIsoCode || 'USD';
    }
    $scope.specificAmount = $scope.specificAlternativeAmount = '';
    $scope.isCordova = platformInfo.isCordova;
    unitToSatoshi = config.unitToSatoshi;
    satToUnit = 1 / unitToSatoshi;
    satToBtc = 1 / 100000000;
    unitDecimals = config.unitDecimals;

    $scope.resetAmount();

    // in SAT ALWAYS
    if ($stateParams.toAmount) {
      $scope.amount = (($stateParams.toAmount) * satToUnit).toFixed(unitDecimals);
    }

    processAmount();

    $timeout(function() {
      $ionicScrollDelegate.resize();
    }, 10);
  });

  function paste(value) {
    $scope.amount = value;
    processAmount();
    $timeout(function() {
      $scope.$apply();
    });
  };

  function processClipboard() {
    if (!isNW) return;
    var value = nodeWebkitService.readFromClipboard();
    if (value && evaluate(value) > 0) paste(evaluate(value));
  };

  $scope.showSendMaxMenu = function() {
    $scope.showSendMax = true;
  };

  $scope.sendMax = function() {
    $scope.showSendMax = false;
    $scope.useSendMax = true;
    $scope.finish();
  };

  $scope.toggleAlternative = function() {
    if ($scope.forceCurrency) return;
    $scope.showAlternativeAmount = !$scope.showAlternativeAmount;

    if ($scope.amount && isExpression($scope.amount)) {
      var amount = evaluate(format($scope.amount));
      $scope.globalResult = '= ' + processResult(amount);
    }
  };

  function checkFontSize() {
    if ($scope.amount && $scope.amount.length >= SMALL_FONT_SIZE_LIMIT) $scope.smallFont = true;
    else $scope.smallFont = false;
  };

  $scope.pushDigit = function(digit) {
    if ($scope.amount && $scope.amount.length >= LENGTH_EXPRESSION_LIMIT) return;
    if ($scope.amount.indexOf('.') > -1 && digit == '.') return;
    if ($scope.showAlternativeAmount && $scope.amount.indexOf('.') > -1 && $scope.amount[$scope.amount.indexOf('.') + 2]) return;

    $scope.amount = ($scope.amount + digit).replace('..', '.');
    checkFontSize();
    processAmount();
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
    return regex.test(val);
  };

  function isExpression(val) {
    var regex = /^\.?\d+(\.?\d+)?([\/\-\+\*x]\d?\.?\d+)+$/;
    return regex.test(val);
  };

  $scope.removeDigit = function() {
    $scope.amount = ($scope.amount).toString().slice(0, -1);
    processAmount();
    checkFontSize();
  };

  $scope.resetAmount = function() {
    $scope.amount = $scope.alternativeResult = $scope.amountResult = $scope.globalResult = '';
    $scope.allowSend = false;
    checkFontSize();
  };

  function processAmount() {
    var formatedValue = format($scope.amount);
    var result = evaluate(formatedValue);
    $scope.allowSend = lodash.isNumber(result) && +result > 0;
    if (lodash.isNumber(result)) {
      $scope.globalResult = isExpression($scope.amount) ? '= ' + processResult(result) : '';
      $scope.amountResult = $filter('formatFiatAmount')(toFiat(result));
      $scope.alternativeResult = txFormatService.formatAmount(fromFiat(result) * unitToSatoshi, true);
    }
  };

  function processResult(val) {
    if ($scope.showAlternativeAmount)
      return $filter('formatFiatAmount')(val);
    else
      return txFormatService.formatAmount(val.toFixed(unitDecimals) * unitToSatoshi, true);
  };

  function fromFiat(val) {
    return parseFloat((rateService.fromFiat(val, $scope.alternativeIsoCode) * satToUnit).toFixed(unitDecimals));
  };

  function toFiat(val) {
    return parseFloat((rateService.toFiat(val * unitToSatoshi, $scope.alternativeIsoCode)).toFixed(2));
  };

  function evaluate(val) {
    var result;
    try {
      result = $scope.$eval(val);
    } catch (e) {
      return 0;
    }
    if (!lodash.isFinite(result)) return 0;
    return result;
  };

  function format(val) {
    var result = val.toString();

    if (isOperator(lodash.last(val)))
      result = result.slice(0, -1);

    return result.replace('x', '*');
  };

  $scope.finish = function() {
    var _amount = evaluate(format($scope.amount));

    if ($scope.nextStep) {
      $state.transitionTo($scope.nextStep, {
        id: _id,
        amount: $scope.useSendMax ? null : _amount,
        currency: $scope.showAlternativeAmount ? $scope.alternativeIsoCode : $scope.unitName,
        useSendMax: $scope.useSendMax
      });
    } else {
      var amount = $scope.showAlternativeAmount ? fromFiat(_amount) : _amount;
      var confirmState = $scope.privatePayment === 'true' ? 'tabs.send.confirm-private' : 'tabs.send.confirm';
      $state.transitionTo(confirmState, {
        recipientType: $scope.recipientType,
        toAmount: $scope.useSendMax ? null : (amount * unitToSatoshi).toFixed(0),
        toAddress: $scope.toAddress,
        toName: $scope.toName,
        toEmail: $scope.toEmail,
        toColor: $scope.toColor,
        useSendMax: $scope.useSendMax,
        privatePayment: $scope.privatePayment
      });
    }
    $scope.useSendMax = null;
  };
});
