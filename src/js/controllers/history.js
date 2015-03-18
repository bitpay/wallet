'use strict';

angular.module('copayApp.controllers').controller('historyController',
  function($scope, $rootScope, $filter, $timeout, $modal, profileService, notification, go) {
    var fc = profileService.focusedClient;
    this.loading = false;
    this.generating = false;
    this.lastShowed = false;

    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.nbPages = 0;
    this.totalItems = 0;
    this.blockchain_txs = [];
    this.alternativeCurrency = [];

    this.selectPage = function(page) {
      this.paging = true;
      this.currentPage = page;
      this.update();
    };

    this.downloadHistory = function() {
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

      this.generating = true;

      this._getTransactions(w, null, function(err, res) {
        if (err) {
          this.generating = false;
          logger.error(err);
          notification.error('Could not get transaction history');
          return;
        }
        this._addRates(w, res.items, function(err) {
          copay.csv.toCsv(res.items, descriptor, function(err, res) {
            if (err) {
              this.generating = false;
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
            this.generating = false;
            $scope.$digest();
          });
        });
      });
    };


    this.update = function() {
      this.getTransactions();
    };

    this.show = function() {
      var self = this;
      this.loading = true;
      setTimeout(function() {
        self.update();
      }, 1);
    };

    this._getTransactions = function(w, opts, cb) {
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

    this._addRates = function(w, txs, cb) {
      if (!txs || txs.length == 0) return cb();
      var index = _.groupBy(txs, 'rateTs');
      return cb();
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

    this.openTxModal = function(btx) {
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.btx = btx;

        $scope.getShortNetworkName = function() {
          var n = fc.network;
          return n.substring(0, 4);
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };
      };

      $modal.open({
        templateUrl: 'views/modals/tx-details.html',
        windowClass: 'full',
        controller: ModalInstanceCtrl,
      });
    };

    this.getTransactions = function() {
      var self = this;
      this.blockchain_txs = [];
      this.loading = true;
      fc.getTxHistory({
        currentPage: this.currentPage, 
        itemsPerPage: this.itemsPerPage
      }, function(err, res) {
        
        self.blockchain_txs = res;
        self.loading = false;
        setTimeout(function() {
          $scope.$digest();
        }, 1);
      });
    };

    this.__getTransactions = function() {
      var self = this;
      this.blockchain_txs = w.cached_txs || [];
      this.loading = true;

      this._getTransactions(w, {
        currentPage: this.currentPage,
        itemsPerPage: this.itemsPerPage,
      }, function(err, res) {
        if (err) throw err;

        if (!res) {
          self.loading = false;
          self.lastShowed = false;
          return;
        }

        var items = res.items;
        self._addRates(w, items, function(err) {
          $timeout(function() {
            $scope.$digest();
          }, 1);
        })

        self.blockchain_txs = w.cached_txs = items;
        self.nbPages = res.nbPages;
        self.totalItems = res.nbItems;

        self.loading = false;
        self.paging = false;
        setTimeout(function() {
          $scope.$digest();
        }, 1);
      });
    };


    this.hasAction = function(actions, action) {
      return actions.hasOwnProperty('create');
    };

  });
