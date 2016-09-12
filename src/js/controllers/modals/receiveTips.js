'use strict';

angular.module('copayApp.controllers').controller('receiveTipsController', function($scope, $log, storageService) {
  $scope.close = function() {
    $log.debug('Receive tips accepted');
    storageService.setReceiveTipsAccepted(true, function(err) {
      $scope.receiveTipsModal.hide();
      $scope.receiveTipsModal.remove();
    });
  }
});
