'use strict';

angular.module('copayApp.controllers').controller('HeadController', function($scope, $rootScope, notification, controllerUtils) {

  $scope.username = $rootScope.iden.profile.email;
  $scope.hoverMenu = false;

  $scope.hoverIn = function(){
    this.hoverMenu = true;
  };

  $scope.hoverOut = function(){
    this.hoverMenu = false;
  };

  $scope.signout = function() {
    logout();
  };

  function logout() {
    controllerUtils.logout();
  }

  // Ensures a graceful disconnect
  window.onbeforeunload = function() {
    controllerUtils.logout();
  };

  $scope.$on('$destroy', function() {
    window.onbeforeunload = undefined;
  });

  if ($rootScope.wallet) {
    $scope.$on('$idleWarn', function(a, countdown) {
      if (!(countdown % 5))
        notification.warning('Session will be closed', $filter('translate')('Your session is about to expire due to inactivity in') + ' ' + countdown + ' ' + $filter('translate')('seconds'));
    });

    $scope.$on('$idleTimeout', function() {
      $scope.signout();
      notification.warning('Session closed', 'Session closed because a long time of inactivity');
    });
    $scope.$on('$keepalive', function() {
      if ($rootScope.wallet) {
        $rootScope.wallet.keepAlive();
      }
    });
    $rootScope.$watch('title', function(newTitle, oldTitle) {
      $scope.title = newTitle;
    });
  }
});

