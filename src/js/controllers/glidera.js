'use strict';

angular.module('copayApp.controllers').controller('glideraController', 
  function(glideraService) {

    this.init = function(token) {
      var self = this;
      glideraService.getTransactions(token, function(error, txs) {
        self.txs = txs;
      });
    };

  });
