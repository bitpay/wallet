'use strict';

angular.module('copayApp.controllers').controller('sellCoinbaseController', 
  function($scope, coinbaseService) {
    
    window.ignoreMobilePause = true;

    this.sellRequest = function(token, account) {
      var self = this;
      var accountId = account.id;
      var dataSrc = {
        amount: $scope.amount,
        currency: 'BTC'
      };
      coinbaseService.sellRequest(token, accountId, dataSrc, function(err, data) {
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
      coinbaseService.sellCommit(token, accountId, sellId, function(err, data) {
        if (err) {
          self.error = err;
          return;
        }
        self.success = data.data;
        $scope.$emit('Local/CoinbaseTx');
      });
    };

  });
