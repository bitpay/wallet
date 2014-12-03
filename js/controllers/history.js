'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('HistoryController',
  function($scope, $rootScope, $filter, rateService) {
    var w = $rootScope.wallet;

    $rootScope.title = 'History';
    $scope.loading = false;
    $scope.generating = false;
    $scope.lastShowed = false;

    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;
    $scope.nbPages = 0;
    $scope.totalItems = 0;
    $scope.blockchain_txs = [];
    $scope.alternativeCurrency = [];

    $scope.selectPage = function(page) {
      $scope.currentPage = page;
      $scope.update();
    };

    $scope.downloadHistory = function() {
      var w = $rootScope.wallet;
      if (!w) return;

      $scope.generating = true;

      w.getTransactionHistoryCsv(function(csvContent) {
        if (csvContent && csvContent !== 'ERROR') {
          var filename = "copay_history.csv";

          var encodedUri = encodeURI(csvContent);
          var link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", filename);

          link.click();
        }
        $scope.generating = false;
        $scope.$digest();
      })
    };




    $scope.update = function() {
      $scope.getTransactions();
    };

    $scope.show = function() {
      $scope.loading = true;
      setTimeout(function() {
        $scope.update();
      }, 1);
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
        var now = new Date();
        _.each(items, function(tx) {
          tx.ts = tx.minedTs || tx.sentTs;
          tx.rateTs = Math.floor((tx.ts || now) / 1000);
          tx.amount = $filter('noFractionNumber')(tx.amount);
        });

        var index = _.indexBy(items, 'rateTs');
        rateService.getHistoricRates(w.settings.alternativeIsoCode, _.keys(index), function(err, res) {
          if (!err && res) {
            _.each(res, function(r) {
              var tx = index[r.ts];
              if (tx) {
                var alternativeAmount = (r.rate != null ? tx.amountSat * rateService.SAT_TO_BTC * r.rate : null);
                tx.alternativeAmount = alternativeAmount ? $filter('noFractionNumber')(alternativeAmount, 2) : null;
              }
            });
            setTimeout(function() {
              $scope.$digest();
            }, 1);
          }
        });

        $scope.blockchain_txs = w.cached_txs = items;
        $scope.nbPages = res.nbPages;
        $scope.totalItems = res.nbItems;

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
