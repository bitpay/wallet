'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('HistoryController',
  function($scope, $rootScope, $timeout, controllerUtils, notification, rateService) {
    controllerUtils.redirIfNotComplete();

    var w = $rootScope.wallet;

    $rootScope.title = 'History';
    $scope.loading = false;
    $scope.lastShowed = false;

    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;
    $scope.nbPages = 0;
    $scope.blockchain_txs = [];
    $scope.alternativeCurrency = [];

    $scope.update = function() {
      $scope.getTransactions();
    };

    $scope.show = function() {
      $scope.loading = true;
      setTimeout(function() {
        $scope.update();
      }, 1);
    };

    $scope.nextPage = function() {
      $scope.currentPage++;
      $scope.update();
    };

    $scope.previousPage = function() {
      $scope.currentPage--;
      $scope.update();
    };

    $scope.hasNextPage = function() {
      return $scope.currentPage < $scope.nbPages;
    };

    $scope.hasPreviousPage = function() {
      return $scope.currentPage > 1;
    };

    $scope.getTransactions = function() {
      var w = $rootScope.wallet;
      if (!w) return;

      $scope.blockchain_txs = w.cached_txs || [];
      $scope.loading = true;

      w.getTransactionHistory({
        currentPage: $scope.currentPage,
        itemsPerPage: $scope.itemsPerPage,
      }, function(err, res) {
        if (err) throw err;

        if (!res) {
          $scope.loading = false;
          $scope.lastShowed = false;
          return;
        }

        var items = res.items;

        _.each(items, function(r) {
          r.ts = r.minedTs || r.sentTs;
        });
        $scope.blockchain_txs = w.cached_txs = items;
        $scope.nbPages = res.nbPages;


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
