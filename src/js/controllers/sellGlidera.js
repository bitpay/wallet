'use strict';

angular.module('copayApp.controllers').controller('sellGlideraController', 
  function(glideraService) {

    this.getSellPrice = function(token, price) {
      var self = this;
      glideraService.sellPrice(token, price, function(error, sellPrice) {
        self.sellPrice = sellPrice;
      });     
    };


  });
