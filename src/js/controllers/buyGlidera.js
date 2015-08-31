'use strict';

angular.module('copayApp.controllers').controller('buyGlideraController', 
  function() {

    this.getBuyPrice = function(token, price) {
      var self = this;
      glideraService.buyPrice(token, price, function(error, sellPrice) {
        self.sellPrice = sellPrice;
      });     
    };   

  });
