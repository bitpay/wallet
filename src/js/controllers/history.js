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
    this.skip = 0;
    this.limit = 10;

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

    this.getTxHistory = function() {
      var self = this;
      self.updatingTxHistory = true;
      profileService.focusedClient.getTxHistory({
        skip: self.skip,
        limit: self.limit + 1
      }, function(err, txs) {
        self.txHistory = txs;
        self.updatingTxHistory = false;
        $scope.$digest();
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
      var self = this;
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.btx = btx;
        $scope.settings = config;

        $scope.getAmount = function(amount) {
          return self.getAmount(amount);
        };

        $scope.getUnitName = function() {
          return self.getUnitName();
        };

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
  });
