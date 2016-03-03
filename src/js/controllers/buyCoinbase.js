'use strict';

angular.module('copayApp.controllers').controller('buyCoinbaseController', 
  function($scope, coinbaseService) {
    
    window.ignoreMobilePause = true;

    this.buyRequest = function(token, account) {
      var self = this;
      var accountId = account.id;
      var dataSrc = {
        amount: $scope.amount,
        currency: 'BTC'
      };
      coinbaseService.buyRequest(token, accountId, dataSrc, function(err, data) {
        if (err) {
          self.error = err;
          return;
        }
        self.buyInfo = data;
      });
      
    };

  });
