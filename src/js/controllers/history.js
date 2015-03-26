'use strict';

angular.module('copayApp.controllers').controller('historyController',
  function($scope, $rootScope, $filter, $timeout, $modal, profileService, notification, go, configService, rateService, lodash) {

    function strip(number) {
      return (parseFloat(number.toPrecision(12)));
    }

    var fc = profileService.focusedClient;
    var config = configService.getSync().wallet.settings;
    this.unitToSatoshi = config.unitToSatoshi;
    this.satToUnit = 1 / this.unitToSatoshi;
    this.unitName = config.unitName;
    this.alternativeIsoCode = config.alternativeIsoCode;

    this.isShared = fc.n > 1;

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
      var self = this;
      var filename = "copay_history.csv";
      var descriptor = {
        columns: [{
          label: 'Date',
          property: 'ts',
          type: 'date'
        }, {
          label: 'Amount (' + config.unitName + ')',
          property: 'amount',
          type: 'number'
        }, {
          label: 'Amount (' + config.alternativeIsoCode + ')',
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

      // if (this.isShared) {
      //   descriptor.columns.push({
      //     label: 'Signers',
      //     property: function(obj) {
      //       if (!obj.actionList) return '';
      //       return lodash.map(obj.actionList, function(action) {
      //         console.log('action.......', action);
      //         //return w.publicKeyRing.nicknameForCopayer(action.cId);
      //       }).join('|');
      //     }
      //   });
      // }

      //this.generating = true;

      this._getTransactions(null, function(err, items) {
        if (err) {
          this.generating = false;
          logger.error(err);
          notification.error('Could not get transaction history');
          return;
        }
        self._addRates(items, function(err) {
          copay.csv.toCsv(items, descriptor, function(err, res) {
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


    this.getAmount = function(amount) {
      var newAmount = strip(amount * this.satToUnit);
      return newAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    this.getUnitName = function() {
      return this.unitName;
    };

    this.getAlternativeIsoCode = function() {
      return this.alternativeIsoCode;
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

    this._getTransactions = function(opts, cb) {
      var self = this;
      fc.getTxHistory(null, function(err, res) {
        if (err) throw err;

        if (!res) {
          return;
        }

        var now = new Date();
        var items = res;
        lodash.each(items, function(tx) {
          tx.ts = tx.minedTs || tx.sentTs;
          tx.rateTs = Math.floor((tx.ts || now) / 1000);
          tx.amount = $filter('noFractionNumber')(tx.amount);
        });
        return cb(null, res);
      });
    };

    this._addRates = function(txs, cb) {
      if (!txs || txs.length == 0) return cb();
      var index = lodash.groupBy(txs, 'rateTs');

      rateService.getHistoricRates(config.alternativeIsoCode, lodash.keys(index), function(err, res) {
        if (err || !res) return cb(err);
        lodash.each(res, function(r) {
          lodash.each(index[r.ts], function(tx) {
            var alternativeAmount = (r.rate != null ? tx.amount * rateService.SAT_TO_BTC * r.rate : null);
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
      this.blockchain_txs = []; // w.cached_txs || [];
      this.loading = true;

      fc.getTxHistory({
        currentPage: this.currentPage,
        itemsPerPage: this.itemsPerPage,
      }, function(err, res) {
        if (err) throw err;

        if (!res) {
          self.loading = false;
          self.lastShowed = false;
          return;
        }

        self._addRates(res, function(err) {
          $timeout(function() {
            $scope.$digest();
          }, 1);
        })

        self.blockchain_txs = res; //w.cached_txs =
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
