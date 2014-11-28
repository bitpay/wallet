'use strict';

angular.module('copayApp.services').factory('rateService', function(request) {
  var cfg = _.extend(config.rates, {
    request: request
  });
  return copay.RateService.singleton(cfg);
});
