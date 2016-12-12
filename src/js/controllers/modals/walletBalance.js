'use strict';

angular.module('copayApp.controllers').controller('walletBalanceController', function($scope) {

  $scope.close = function() {
    $scope.walletBalanceModal.hide();
  };

});
