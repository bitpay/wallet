'use strict';

angular.module('copayApp.controllers').controller('SidebarController', function($scope, $rootScope, $sce, $location, $http, $filter, notification, controllerUtils) {

  $scope.menu = [{
    'title': 'Receive',
    'icon': 'fi-download',
    'link': 'receive'
  }, {
    'title': 'Send',
    'icon': 'fi-arrow-right',
    'link': 'send'
  }, {
    'title': 'History',
    'icon': 'fi-clipboard-pencil',
    'link': 'history'
  }, {
    'title': 'Settings',
    'icon': 'fi-widget',
    'link': 'more'
  }];

  $scope.signout = function() {
    logout();
  };

  // Ensures a graceful disconnect
  window.onbeforeunload = function() {
    controllerUtils.logout();
  };

  $scope.$on('$destroy', function() {
    window.onbeforeunload = undefined;
  });


  $scope.refresh = function() {
    var w = $rootScope.wallet;
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

  $scope.isActive = function(item) {
    return item.link && item.link == $location.path().split('/')[1];
  };

  function logout() {
    controllerUtils.logout();
  }

  // ng-repeat defined number of times instead of repeating over array?
  $scope.getNumber = function(num) {
    return new Array(num);
  }



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
      $rootScope.wallet.keepAlive();
    });
  }

  $scope.switchWallet = function(wid) {
    $scope.walletSelection = false;
    controllerUtils.setFocusedWallet(wid);
  };

  $scope.toggleWalletSelection = function() {
    $scope.walletSelection = !$scope.walletSelection;
    $scope.wallets = [];
    var wids = _.pluck($rootScope.iden.listWallets(), 'id');
    _.each(wids, function(wid) {
      if (controllerUtils.isFocusedWallet(wid)) return;
      var w = $rootScope.iden.getOpenWallet(wid);
      $scope.wallets.push(w);
      controllerUtils.updateBalance(w, function(err, res) {
        if (err) return;
      });
    });
  };
});
