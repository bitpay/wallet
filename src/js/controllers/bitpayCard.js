'use strict';

angular.module('copayApp.controllers').controller('bitpayCardController', function($scope, $timeout, $log, $state, lodash, bitpayCardService, moment, popupService, gettextCatalog, $ionicHistory, bitpayService, externalLinkService, timeService) {

  var self = this;
  $scope.dateRange = {
    value: 'last30Days'
  };
  $scope.network = bitpayService.getEnvironment().network;

  var setDateRange = function(preset) {
    var startDate, endDate;
    preset = preset ||  'last30Days';
    switch (preset) {
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

  var setGetStarted = function(history, cb) {

    // Is the card new?
    if (!lodash.isEmpty(history.transactionList))
      return cb();

    var dateRange = setDateRange('all');
    bitpayCardService.getHistory($scope.cardId, dateRange, function(err, history) {

      if (!err && lodash.isEmpty(history.transactionList))
        self.getStarted = true;

      return cb();
    });
  };

  this.update = function() {
    var dateRange = setDateRange($scope.dateRange.value);

    $scope.loadingHistory = true;
    bitpayCardService.getHistory($scope.cardId, dateRange, function(err, history) {

      $scope.loadingHistory = false;

      if (err) {
        $log.error(err);
        self.bitpayCardTransactionHistoryCompleted = null;
        self.bitpayCardTransactionHistoryConfirming = null;
        self.bitpayCardTransactionHistoryPreAuth = null;
        self.balance = null;
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not get transactions'));
        return;
      }

      setGetStarted(history, function() {

        var txs = lodash.clone(history.txs);

        self.bitpayCardTransactionHistoryConfirming = bitpayCardService.filterTransactions('confirming', txs);
        self.bitpayCardTransactionHistoryCompleted = bitpayCardService.filterTransactions('completed', txs);
        self.bitpayCardTransactionHistoryPreAuth = bitpayCardService.filterTransactions('preAuth', txs);

        self.balance = history.currentCardBalance;
        self.updatedOn = null;

        if ($scope.dateRange.value == 'last30Days') {

          // TODO?
          // $log.debug('BitPay Card: storing cache history');
          // var cacheHistory = {
          //   balance: history.currentCardBalance,
          //   transactions: history.txs
          // };
          // bitpayCardService.setHistory($scope.cardId, cacheHistory, {}, function(err) {
          //   if (err) $log.error(err);
          //   $scope.historyCached = true;
          // });
        }
        $timeout(function() {
          $scope.$apply();
        });
      });
    });
  };

  $scope.createdWithinPastDay = function(tx) {
    var result = false;
    if (tx.date) {
      result = timeService.withinPastDay(tx.date);
    }
    return result;
  };

  this.openExternalLink = function(url) {
    var optIn = true;
    var title = null;
    var message = gettextCatalog.getString('Help and support information is available at the website.');
    var okText = gettextCatalog.getString('Open');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

  this.viewOnBlockchain = function(transactionId) {
    var url = 'https://insight.bitpay.com/tx/' + transactionId;
    var optIn = true;
    var title = null;
    var message = gettextCatalog.getString('View Transaction on Insight');
    var okText = gettextCatalog.getString('Open Insight');
    var cancelText = gettextCatalog.getString('Go Back');
    externalLinkService.open(url, optIn, title, message, okText, cancelText);
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.cardId = data.stateParams.id;

    if (!$scope.cardId) {
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $state.go('tabs.home');
    }


    bitpayCardService.get({
      cardId: $scope.cardId,
      noRefresh: true,
    }, function(err, cards) {

      if (cards && cards[0]) {
        self.lastFourDigits = cards[0].lastFourDigits;
        self.balance = cards[0].balance;
        self.currencySymbol = cards[0].currencySymbol;
        self.updatedOn = cards[0].updatedOn;
        self.currency = cards[0].currency;
      }
      self.update();
    });
  });
});
