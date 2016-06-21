'use strict';

angular.module('copayApp.controllers').controller('coinbaseTxDetailsController', function($scope, $rootScope, coinbaseService) {

  $scope.remove = function() {
    coinbaseService.savePendingTransaction($scope.tx, {
      remove: true
    }, function(err) {
      $rootScope.$emit('Local/CoinbaseTx');
      $scope.cancel();
    });
  };

  $scope.cancel = function() {
    $scope.coinbaseTxDetailsModal.hide();
  };

});
