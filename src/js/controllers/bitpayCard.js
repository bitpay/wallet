'use strict';

angular.module('copayApp.controllers').controller('bitpayCardController', function($scope, $timeout, $log, $state, lodash, bitpayCardService, moment, popupService, gettextCatalog, $ionicHistory, bitpayService) {

  var self = this;
  var runningBalance;
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
        self.getStated=true;
        
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
        self.bitpayCardTransactionHistory = null;
        self.balance = null;
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not get transactions'));
        return;
      }

      setGetStarted(history, function() {

        var txs = lodash.clone(history.txs);
        runningBalance = parseFloat(history.endingBalance);
        for (var i = 0; i < txs.length; i++) {
          txs[i] = _getMerchantInfo(txs[i]);
          txs[i].icon = _getIconName(txs[i]);
          txs[i].desc = _processDescription(txs[i]);
          txs[i].price = _price(txs[i]);
          txs[i].runningBalance = runningBalance;
          _runningBalance(txs[i]);
        }
        self.bitpayCardTransactionHistory = txs;
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

  var _getMerchantInfo = function(tx) {
    var bpTranCodes = bitpayCardService.bpTranCodes;
    lodash.keys(bpTranCodes).forEach(function(code) {
      if (tx.type.indexOf(code) === 0) {
        lodash.assign(tx, bpTranCodes[code]);
      }
    });
    return tx;
  };

  var _getIconName = function(tx) {
    var icon = tx.mcc || tx.category || null;
    if (!icon) return 'default';
    return bitpayCardService.iconMap[icon];
  };

  var _processDescription = function(tx) {
    if (lodash.isArray(tx.description)) {
      return tx.description[0];
    }
    return tx.description;
  };

  var _price = function(tx) {
    return parseFloat(tx.amount) + parseFloat(tx.fee)
  };

  var _runningBalance = function(tx) {
    runningBalance -= parseFloat(tx.amount);
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
        self.updatedOn = cards[0].updatedOn;
      }
      self.update();
    });
  });
});
