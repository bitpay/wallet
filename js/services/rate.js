'use strict';

angular.module('copayApp.services').factory('rateService', function(request) {
  return copay.RateService.singleton({
    request: request
  });
});
