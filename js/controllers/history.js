'use strict';
var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('HistoryController',
  function($scope, $rootScope, $filter, $timeout, $modal, rateService, notification, go) {
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

      var filename = "copay_history.csv";
      var descriptor = {
        columns: [{
          label: 'Date',
          property: 'ts',
          type: 'date'
        }, {
          label: 'Amount (' + w.settings.unitName + ')',
          property: 'amount',
          type: 'number'
        }, {
          label: 'Amount (' + w.settings.alternativeIsoCode + ')',
          property: 'alternativeAmount'
        }, {
          label: 'Action',
          property: 'action'
        }, {
          label: 'AddressTo',
          property: 'addressTo'
        }, {
          label: 'Comment',
          property: 'comment'
        }, ],
      };
      if (w.isShared()) {
        descriptor.columns.push({
          label: 'Signers',
          property: function(obj) {
            if (!obj.actionList) return '';
            return _.map(obj.actionList, function(action) {
              return w.publicKeyRing.nicknameForCopayer(action.cId);
            }).join('|');
          }
        });
      }

      $scope.generating = true;

      $scope._getTransactions(w, null, function(err, res) {
        if (err) {
          $scope.generating = false;
          logger.error(err);
          notification.error('Could not get transaction history');
          return;
        }
        $scope._addRates(w, res.items, function(err) {
          copay.csv.toCsv(res.items, descriptor, function(err, res) {
            if (err) {
              $scope.generating = false;
              logger.error(err);
              notification.error('Could not generate csv file');
              return;
            }
            var csvContent = "data:text/csv;charset=utf-8," + res;
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", filename);
            link.click();
            $scope.generating = false;
            $scope.$digest();
          });
        });
      });
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

    $scope._getTransactions = function(w, opts, cb) {
      w.getTransactionHistory(opts, function(err, res) {
        if (err) return cb(err);
        if (!res) return cb();

        var now = new Date();
        var items = res.items;
        _.each(items, function(tx) {
          tx.ts = tx.minedTs || tx.sentTs;
          tx.rateTs = Math.floor((tx.ts || now) / 1000);
          tx.amount = $filter('noFractionNumber')(tx.amount);
        });
        return cb(null, res);
      });
    };

    $scope._addRates = function(w, txs, cb) {
      if (!txs || txs.length == 0) return cb();
      var index = _.groupBy(txs, 'rateTs');
      rateService.getHistoricRates(w.settings.alternativeIsoCode, _.keys(index), function(err, res) {
        if (err || !res) return cb(err);
        _.each(res, function(r) {
          _.each(index[r.ts], function (tx) {
            var alternativeAmount = (r.rate != null ? tx.amountSat * rateService.SAT_TO_BTC * r.rate : null);
            tx.alternativeAmount = alternativeAmount ? $filter('noFractionNumber')(alternativeAmount, 2) : null;
          });
        });
        return cb();
      });
    };


    $scope.openTxModal = function(btx) {
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.btx = btx;

        $scope.getShortNetworkName = function() {
          var w = $rootScope.wallet;
          return w.getNetworkName().substring(0, 4);
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };
      };

      $modal.open({
        templateUrl: 'views/modals/tx-details.html',
        windowClass: 'medium',
        controller: ModalInstanceCtrl,
      });
    };

    $scope.getTransactions = function() {
      var w = $rootScope.wallet;
      if (!w) return;

      $scope.blockchain_txs = w.cached_txs || [];
      $scope.loading = true;

      $scope._getTransactions(w, {
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
        $scope._addRates(w, items, function(err) {
          $timeout(function() {
            $scope.$digest();
          }, 1);
        })

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

  });
