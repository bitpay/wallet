'use strict';
angular.module('copayApp.api').factory('copayFxApi', function(rateService) {

  var root = {};

	root.getRate = function(code) {
	  return rateService.getRate(code);
	};

  return root;
});