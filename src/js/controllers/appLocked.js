'use strict';

angular.module('copayApp.controllers').controller('appLockedController', function($scope, $ionicSideMenuDelegate, $log, configService, fingerprintService) {
  var isLockedApp;

  $scope.init = function() {
    var config = configService.getSync();
    isLockedApp = config.app ? config.app.locked : null;
    $ionicSideMenuDelegate.canDragContent(false);
    if ($scope.fromSidebar) return;
    $scope.requestFingerprint();
  };

  $scope.requestFingerprint = function() {
    fingerprintService.check(function(err) {
      if (err) {
        $log.error(err);
        return;
      }
      $scope.appLockedModal.hide();
    });
  };

  $scope.$on('$destroy', function() {
    $ionicSideMenuDelegate.canDragContent(true);
    $scope.appLockedModal.remove();
  });
});
