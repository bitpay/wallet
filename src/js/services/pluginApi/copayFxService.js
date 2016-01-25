'use strict';
angular.module('copayApp.services').factory('copayFxService', function(rateService) {

  var root = {};

	root.getRate = function(code) {
	  return rateService.getRate(code);
	};

  return root;
});