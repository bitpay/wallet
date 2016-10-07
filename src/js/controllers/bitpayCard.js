'use strict';

angular.module('copayApp.controllers').controller('bitpayCardController', function($scope, $timeout, $log, $state, lodash, bitpayCardService, configService, profileService, walletService, ongoingProcess, moment, popupService, gettextCatalog, bwcError, $ionicHistory) {

  var self = this;
  $scope.dateRange = 'last30Days';
  $scope.network = bitpayCardService.getEnvironment();

  var getFromCache = function() {
    bitpayCardService.getBitpayDebitCardsHistory($scope.cardId, function(err, data) {
      if (err || lodash.isEmpty(data)) return;
      $scope.historyCached = true;
      self.bitpayCardTransactionHistory = data.transactions;
      self.bitpayCardCurrentBalance = data.balance;
      $scope.$apply();
    });
  };

  var setDateRange = function(preset) {
    var startDate, endDate;
    preset = preset || 'last30Days';
    switch(preset) {
      case 'last30Days':
        startDate = moment().subtract(30, 'days').toISOString();
        endDate = moment().toISOString();
        break;
      case 'lastMonth':
        startDate = moment().startOf('month').subtract(1, 'month').toISOString();
        endDate = moment().startOf('month').toISOString();
        break;
      case 'all':
        startDate = null;
        endDate = null;
        break;
      default:
        return;
    }
    return {
      startDate: startDate,
      endDate: endDate
    };
  };

  this.update = function() {
    var dateRange = setDateRange($scope.dateRange);

    $scope.loadingHistory = true;
    bitpayCardService.getHistory($scope.cardId, dateRange, function(err, history) {
      $scope.loadingHistory = false;
      if (err || history.error) {
        $log.error(err || history.error);
        $scope.error = gettextCatalog.getString('Could not get transactions');
        return;
      }

      self.bitpayCardTransactionHistory = history.transactionList;
      self.bitpayCardCurrentBalance = history.currentCardBalance;

      var cacheHistory = {
        balance: self.bitpayCardCurrentBalance,
        transactions: self.bitpayCardTransactionHistory
      };
      bitpayCardService.setBitpayDebitCardsHistory($scope.cardId, cacheHistory, {}, function(err) {
        if (err) $log.error(err);
        $scope.historyCached = true;
      });
      $timeout(function() {
        $scope.$apply();
      });
    });
  };

  this.getMerchantInfo = function(tx) {
    var bpTranCodes = bitpayCardService.bpTranCodes;
    lodash.keys(bpTranCodes).forEach(function(code) {
      if (tx.type.indexOf(code) === 0) {
        lodash.assign(tx, bpTranCodes[code]);
      }
    });
  };

  this.getIconName = function(tx) {
    var icon = tx.mcc || tx.category || null;
    if (!icon) return 'default';
    return bitpayCardService.iconMap[icon];
  };

  this.processDescription = function(tx) {
    if (lodash.isArray(tx.description)) {
      return tx.description[0];
    }
    return tx.description;
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.cardId = data.stateParams.id;
    if (!$scope.cardId) {
      var msg = gettextCatalog.getString('Bad param');
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $state.go('tabs.home');
      popupService.showAlert(null, msg);
    } else {
      getFromCache();
      self.update();
    }
  });

});

