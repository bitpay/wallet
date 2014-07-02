'use strict';

angular.module('copayApp.controllers').controller('UriPaymentController', function($rootScope, $scope, $routeParams, $timeout, $location) {
  var data = decodeURIComponent($routeParams.data);
  var splitDots = data.split(':');
  $scope.protocol = splitDots[0];
  data = splitDots[1];
  var splitQuestion = data.split('?');
  $scope.address = splitQuestion[0];
  var search = splitQuestion[1];
  data = JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
    function(key, value) {
      return key === "" ? value : decodeURIComponent(value);
    });
  $scope.amount = parseFloat(data.amount);
  $scope.message = data.message;

  $rootScope.pendingPayment = {
    protocol: $scope.protocol,
    address: $scope.address,
    amount: $scope.amount,
    message: $scope.message
  };

  $timeout(function() {
    $location.path('signin');
  }, 1000);


});
