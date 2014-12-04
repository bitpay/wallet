'use strict';

angular.module('copayApp.controllers').controller('HomeWalletController', function($scope, $rootScope) {
  $scope.init = function() {
    $rootScope.title = 'Home';
  };
});
