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
    $scope.totalItems = 0;
    $scope.blockchain_txs = [];
    $scope.alternativeCurrency = [];



    $scope.selectPage = function(page) {
      $scope.currentPage = page;
      $scope.update();
    };



    $scope.downloadHistory = function() {

      if (window.cordova) {
        log.info('Not available on mobile');
        return;
      }

      var data = $scope.blockchain_txs;
      var filename = "copay_history.csv";
      var csvContent = "data:text/csv;charset=utf-8,Date,Amount,Action,AddressTo\n";

      data.forEach(function(it, index) {
        var dataString = formatDate(it.ts) + ',' + it.amount + ',' + it.action + ',' + it.addressTo;
        csvContent += index < data.length ? dataString + "\n" : dataString;
      });

      var encodedUri = encodeURI(csvContent);
      var link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);

      link.click();


      function formatDate(date) {
        var dateObj = new Date(date);
        if (!dateObj) {
          log.error('Error formating a date');
          return 'DateError'
        }
        return dateObj.toJSON().substring(0, 10);
      }
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

        _.each(items, function(r) {
          r.ts = r.minedTs || r.sentTs;
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
