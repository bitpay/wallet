'use strict';

angular.module('copayApp.controllers').controller('HeadController', function($scope, $rootScope, $filter, notification, controllerUtils) {
  $scope.username = $rootScope.iden.getName();
  $scope.hoverMenu = false;

  $scope.hoverIn = function() {
    this.hoverMenu = true;
  };

  $scope.hoverOut = function() {
    this.hoverMenu = false;
  };

  $scope.signout = function() {
    controllerUtils.logout();
  };

  $scope.refresh = function() {
    var w = $rootScope.wallet;
    if (!w) return;

    if (w.isReady()) {
      w.sendWalletReady();
      if ($rootScope.addrInfos.length > 0) {
        controllerUtils.clearBalanceCache(w);
        controllerUtils.updateBalance(w, function() {
          $rootScope.$digest();
        });
      }
    }
  };

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
    $rootScope.$on('signout', function() {
      controllerUtils.logout();
    });
  }
});
