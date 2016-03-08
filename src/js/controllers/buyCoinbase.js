'use strict';

angular.module('copayApp.controllers').controller('buyCoinbaseController', 
  function($scope, coinbaseService) {
    
    window.ignoreMobilePause = true;

    this.buyRequest = function(token, account) {
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
      coinbaseService.buyRequest(token, accountId, dataSrc, function(err, data) {
        self.loading = null;
        if (err) {
          self.error = err;
          return;
        }
        self.buyInfo = data.data;
      });
    };

    this.confirmBuy = function(token, account, buy) {
      var self = this;
      var accountId = account.id;
      var buyId = buy.id;
      this.loading = 'Buying bitcoin...';
      coinbaseService.buyCommit(token, accountId, buyId, function(err, data) {
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
