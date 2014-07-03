'use strict';

angular.module('copayApp.controllers').controller('UriPaymentController', function($rootScope, $scope, $routeParams, $timeout, $location) {
  var data = decodeURIComponent($routeParams.data);
  $rootScope.pendingPayment = copay.Structure.parseBitcoinURI($routeParams.data);

  $scope.protocol = $rootScope.pendingPayment.protocol;
  $scope.address = $rootScope.pendingPayment.address;
  $scope.amount = $rootScope.pendingPayment.amount;
  $scope.message = $rootScope.pendingPayment.message;

  $timeout(function() {
    $location.path('signin');
  }, 1000);


});
