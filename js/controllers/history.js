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

        _.each(res, function (r) {
          r.ts = r.minedTs || r.sentTs;
          if (r.action === 'sent' && r.peerActions) {
            r.actionList = controllerUtils.getActionList(r.peerActions);
          }
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
    }

    $scope.getShortNetworkName = function() {
      var w = $rootScope.wallet;
      return w.getNetworkName().substring(0, 4);
    };
    $scope.amountAlternative = function(amount, txIndex, cb) {
      var w = $rootScope.wallet;
      rateService.whenAvailable(function() {
        var valueSat = amount * w.settings.unitToSatoshi;
        $scope.alternativeCurrency[txIndex] = rateService.toFiat(valueSat, w.settings.alternativeIsoCode);
        return cb ? cb() : null;
      });
    };

    // Autoload transactions 
    $scope.getTransactions();
  });
