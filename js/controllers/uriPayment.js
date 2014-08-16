'use strict';

var bitcore = require('bitcore');

angular.module('copayApp.controllers').controller('UriPaymentController', function($rootScope, $scope, $routeParams, $timeout, $location) {
  var data = decodeURIComponent($routeParams.data);
  $rootScope.pendingPayment = new bitcore.BIP21($routeParams.data);

  $timeout(function() {
    $location.path('/open');
  }, 1000);


});
