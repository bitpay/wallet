'use strict';

var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('UriPaymentController', function($rootScope, $scope, $routeParams, $timeout, $location) {
  // Build bitcoinURI with querystring
  var query = [];
  angular.forEach($location.search(), function(value, key) {
    query.push(key + "=" + value);
  });
  var queryString = query ? "?" + query.join("&") : "";
  var bitcoinURI = $routeParams.data + queryString;

  $rootScope.pendingPayment = new bitcore.BIP21(bitcoinURI);

  $timeout(function() {
    $location.path('/send');
  }, 1000);


});
