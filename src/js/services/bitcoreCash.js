'use strict';
angular.module('copayApp.services')
  .factory('bitcoreCash', function bitcoreFactory(bwcService) {
    var bitcoreCash = bwcService.getBitcoreCash();
    return bitcoreCash;
  });
