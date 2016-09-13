'use strict';

angular.module('copayApp.controllers').controller('scanTipsController', function($scope, $log, storageService) {
  $scope.close = function() {
    $log.debug('Scan tips accepted');
    storageService.setScanTipsAccepted(true, function(err) {
      $scope.$emit('TipsModalClosed', function() {});
      $scope.scanTipsModal.hide();
    });
  }
});
