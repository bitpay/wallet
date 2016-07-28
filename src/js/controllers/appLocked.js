'use strict';

angular.module('copayApp.controllers').controller('appLockedController', function($scope, $ionicSideMenuDelegate, $timeout, fingerprintService) {

  $ionicSideMenuDelegate.canDragContent(false);

  $scope.requestFingerprint = function() {
    $timeout(function() {
      fingerprintService.check(function(err) {
        if (err) {
          console.log(err);
          return;
        }
        $scope.appLockedModal.hide();
      });
    }, 10);
  };
});
