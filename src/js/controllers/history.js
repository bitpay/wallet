'use strict';

angular.module('copayApp.controllers').controller('historyController',
  function($scope, $rootScope, $filter, $timeout, $modal, $log, profileService, notification, go, configService, rateService, lodash) {

    function strip(number) {
      return (parseFloat(number.toPrecision(12)));
    }

    var fc = profileService.focusedClient;
    var config = configService.getSync().wallet.settings;
    var formatAmount = profileService.formatAmount;
    this.unitToSatoshi = config.unitToSatoshi;
    this.satToUnit = 1 / this.unitToSatoshi;
    this.unitName = config.unitName;
    this.alternativeIsoCode = config.alternativeIsoCode;

    this.isShared = fc.n > 1;
    this.skip = 0;
    this.limit = 10;

    this.getUnitName = function() {
      return this.unitName;
    };

    this.getAlternativeIsoCode = function() {
      return this.alternativeIsoCode;
    };

    this.getTxHistory = function() {
      var self = this;
      self.updatingTxHistory = true;
      $timeout(function() {
        fc.getTxHistory({
          skip: self.skip,
          limit: self.limit + 1
        }, function(err, txs) {
          if (err) {
            $log.debug('Creating address ERROR:', err);
          }
          else {
            var now = new Date();
            lodash.each(txs, function(tx) {
              tx.ts = tx.minedTs || tx.sentTs;
              tx.rateTs = Math.floor((tx.ts || now) / 1000);
              tx.amountStr = profileService.formatAmount(tx.amount); //$filter('noFractionNumber')(
            });

            self.txHistory = txs;
            self.updatingTxHistory = false;
          }
          $scope.$emit('Local/ClientError', err);
        });
      }, 10);
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
      var ModalInstanceCtrl = function($scope, $modalInstance, profileService) {
        $scope.btx = btx;
        $scope.settings = config;
        $scope.btx.amountStr = profileService.formatAmount(btx.amount);

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


    this.formatAmount = function(amount) {
      return profileService.formatAmount(amount);
    };

    this.hasAction = function(actions, action) {
      return actions.hasOwnProperty('create');
    };

  });
