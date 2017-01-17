'use strict';

angular.module('copayApp.controllers').controller('coinbaseTxDetailsController', function($scope, coinbaseService, popupService) {

  $scope.remove = function() {
    coinbaseService.setCredentials();
    $scope.updateRequired = false;
    var message = 'Are you sure you want to remove this transaction?';
    popupService.showConfirm(null, message, null, null, function(ok) {
      if (!ok) {
        return;
      }
      coinbaseService.savePendingTransaction($scope.tx, {
        remove: true
      }, function(err) {
        $scope.updateRequired = true;
        $scope.close();
      });
    });
  };

  $scope.close = function() {
    $scope.modal.hide().then(function() {
      if ($scope.updateRequired) $scope.updateTransactions();
    });
  };

});
