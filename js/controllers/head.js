'use strict';

angular.module('copayApp.controllers').controller('HeadController', function($scope, $rootScope, $filter, $timeout, notification, identityService, balanceService) {
  $scope.username = $rootScope.iden.getName();
  $scope.hoverMenu = false;

  var isChromeApp = typeof window !== "undefined" && window.chrome && chrome.runtime && chrome.runtime.id;

  $scope.hoverIn = function() {
    this.hoverMenu = true;
  };

  $scope.hoverOut = function() {
    this.hoverMenu = false;
  };

  $scope.signout = function() {
    $rootScope.signingOut = true;
    identityService.signout();
  };

  $scope.refresh = function() {
    var w = $rootScope.wallet;
    if (!w) return;

    if (w.isComplete()) {
      w.sendWalletReady();
      balanceService.clearBalanceCache(w);
      balanceService.update(w, function() {
        $rootScope.$digest();
      }, true);
    }
  };


  //Ensures a graceful disconnect
  window.onbeforeunload = function() {
    $scope.signout();
  };

  $scope.$on('$destroy', function() {
    if (isChromeApp) return;
    window.onbeforeunload = undefined;
  });

  $scope.init = function() {
    if (!$rootScope.wallet) return;

    $scope.$on('$idleStart', function() {});
    $scope.$on('$idleWarn', function(a, countdown) {
      $rootScope.countdown = countdown;
      $rootScope.sessionExpired = true;
    });
    $scope.$on('$idleEnd', function() {
      $timeout(function() {
        $rootScope.sessionExpired = null;
      }, 500);
    });
    $scope.$on('$idleTimeout', function() {
      $rootScope.sessionExpired = null;
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
  };
});
