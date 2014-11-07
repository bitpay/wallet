'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('HistoryController',
  function($scope, $rootScope, $timeout, controllerUtils, notification, rateService) {
    controllerUtils.redirIfNotComplete();

    var w = $rootScope.wallet;

    $rootScope.title = 'History';
    $scope.loading = false;
    $scope.lastShowed = false;

    $scope.txpCurrentPage = 1;
    $scope.txpItemsPerPage = 4;
    $scope.blockchain_txs = [];
    $scope.alternativeCurrency = [];

    $scope.update = function() {
      $scope.getTransactions();
    };

    $scope.show = function() {
      $scope.loading = true;
      setTimeout(function() {
        $scope.update();
      }, 10);
    };


    $scope.getTransactions = function() {

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

        _.each(res, function(r) {
          r.ts = r.minedTs || r.sentTs;
        });
        $scope.blockchain_txs = w.cached_txs = res;
        $scope.loading = false;
        setTimeout(function() {
          $scope.$digest();
        }, 1);
      });
    };


    $scope.hasAction = function(actions, action) {
      return actions.hasOwnProperty('create');
    };

    $scope.getShortNetworkName = function() {
      var w = $rootScope.wallet;
      return w.getNetworkName().substring(0, 4);
    };

  });
