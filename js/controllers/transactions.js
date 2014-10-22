'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('TransactionsController',
  function($scope, $rootScope, $timeout, controllerUtils, notification, rateService) {
    controllerUtils.redirIfNotComplete();


    var w = $rootScope.wallet;

    $scope.title = 'Transactions';
    $scope.loading = false;
    $scope.lastShowed = false;

    $scope.txpCurrentPage = 1;
    $scope.txpItemsPerPage = 4;
    $scope.blockchain_txs = [];
    $scope.alternativeCurrency = [];

    var satToUnit = 1 / w.settings.unitToSatoshi;

    $scope.update = function() {
      $scope.loading = true;
      var from = ($scope.txpCurrentPage - 1) * $scope.txpItemsPerPage;
      var opts = {
        pending: false,
        skip: [from, from + $scope.txpItemsPerPage]
      };
      controllerUtils.updateTxs(opts);
      setTimeout(function() {
        $rootScope.$digest();
      }, 0);
    };

    $scope.show = function() {
      $scope.loading = true;
      setTimeout(function() {
        $scope.update();
      }, 10);
    };

    $scope.toogleLast = function() {
      $scope.lastShowed = !$scope.lastShowed;
      if ($scope.lastShowed) {
        $scope.getTransactions();
      }
    };

    $scope.getTransactions = function() {
      var self = this;
      var w = $rootScope.wallet;
      if (!w) return;

      $scope.blockchain_txs = w.cached_txs || [];
      $scope.loading = true;
      w.getTransactionHistory(function(err, res) {
        if (err) throw err;

        if (!res) {
          $scope.loading = false;
          $scope.lastShowed = false;
          return;
        }

        $scope.blockchain_txs = w.cached_txs = res;
        $scope.loading = false;
      });
    };


    $scope.hasAction = function(actions, action) {
      return actions.hasOwnProperty('create');
    }

    $scope.getShortNetworkName = function() {
      return w.getNetworkName().substring(0, 4);
    };

    // Autoload transactions on 1-of-1
    if ($rootScope.wallet && $rootScope.wallet.totalCopayers == 1) {
      $scope.lastShowed = true;
      $scope.getTransactions();
    }

    $scope.amountAlternative = function(amount, txIndex, cb) {
      var w = $rootScope.wallet;
      rateService.whenAvailable(function() {
        var valueSat = amount * w.settings.unitToSatoshi;
        $scope.alternativeCurrency[txIndex] = rateService.toFiat(valueSat, w.settings.alternativeIsoCode);
        return cb ? cb() : null;
      });
    };
  });
