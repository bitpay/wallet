'use strict';

angular.module('copayApp.controllers').controller('send2Controller',
  function($scope, lodash, configService, go) {
    var config = configService.getSync().wallet.settings;
    $scope.unitName = config.unitName;
    $scope.alternativeIsoCode = config.alternativeIsoCode;
    $scope.amount = $scope.result = 0;
    $scope.showAlternative = false;

    $scope.toggleAlternative = function() {
      $scope.showAlternative = !$scope.showAlternative;
    };

    $scope.close = function() {
      go.walletHome();
    };

    $scope.pushDigit = function(digit) {
      if ($scope.amount.length >= 10) return;
      var amount;
      if ($scope.amount == 0 && digit == 0) return;
      amount = $scope.amount ? $scope.amount + digit : digit;
      evaluate(amount);
    };

    $scope.pushOperator = function(operator) {
      if (!$scope.amount || $scope.amount.length == 0) return;
      if (!isOperator(lodash.last($scope.amount))) {
        $scope.amount = $scope.amount + operator;
      } else
        $scope.amount = $scope.amount.slice(0, -1) + operator;
    };

    $scope.removeDigit = function() {
      if (!$scope.amount || $scope.amount.length == 0) {
        resetAmount();
        return;
      }

      var amount;
      $scope.amount = amount = $scope.amount.slice(0, -1);
      evaluate(amount);
    };

    function isOperator(val) {
      var regex = /[\/\-\+\*]/;
      var match = regex.exec(val);
      if (match) return true;
      return false;
    };

    function resetAmount() {
      $scope.amount = $scope.result = 0;
    };

    function evaluate(val) {
      if (!val) {
        resetAmount();
        return;
      }

      if ($scope.amount == 0 && val == '.') {
        $scope.amount += val;
        return;
      }

      var result;
      try {
        result = eval(val);
      } catch (e) {
        return;
      }

      if (lodash.isNumber(result)) {
        $scope.result = result;
        $scope.amount = val;
      }
    };
  });
