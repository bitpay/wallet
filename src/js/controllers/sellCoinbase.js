'use strict';

angular.module('copayApp.controllers').controller('sellCoinbaseController', 
  function($scope, coinbaseService) {
    
    window.ignoreMobilePause = true;

    this.sellRequest = function(token, account) {
      var self = this;
      var accountId = account.id;
      var amount = $scope.amount ? $scope.amount : $scope.fiat;
      var currency = $scope.amount ? 'BTC' : 'USD';
      if (!amount) return;
      var dataSrc = {
        amount: amount,
        currency: currency
      };
      this.loading = 'Sending request...';
      coinbaseService.sellRequest(token, accountId, dataSrc, function(err, data) {
        self.loading = null;
        if (err) {
          self.error = err;
          return;
        }
        self.sellInfo = data.data;
      });
    };

    this.confirmSell = function(token, account, sell) {
      var self = this;
      var accountId = account.id;
      var sellId = sell.id;
      this.loading = 'Selling bitcoin...';
      coinbaseService.sellCommit(token, accountId, sellId, function(err, data) {
        self.loading = null;
        if (err) {
          self.error = err;
          return;
        }
        self.success = data.data;
        $scope.$emit('Local/CoinbaseTx');
      });
    };

  });
