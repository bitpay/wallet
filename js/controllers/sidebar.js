'use strict';

angular.module('copayApp.controllers').controller('SidebarController', function($scope, $rootScope, $location, $timeout, identityService, isMobile) {

  $scope.isMobile = isMobile.any()

  $scope.menu = [{
    'title': 'Home',
    'icon': 'icon-home',
    'link': 'homeWallet'
  }, {
    'title': 'Receive',
    'icon': 'icon-receive',
    'link': 'receive'
  }, {
    'title': 'Send',
    'icon': 'icon-paperplane',
    'link': 'send'
  }, {
    'title': 'History',
    'icon': 'icon-history',
    'link': 'history'
  }, {
    'title': 'Settings',
    'icon': 'icon-gear',
    'link': 'more'
  }];

  $scope.signout = function() {
    $rootScope.signingOut = true;
    identityService.signout();
  };

  $scope.isActive = function(item) {
    return item.link && item.link == $location.path().split('/')[1];
  };

  $scope.switchWallet = function(wid) {
    $scope.walletSelection = false;
    identityService.setFocusedWallet(wid);
    identityService.goWalletHome();
  };

  $scope.toggleWalletSelection = function() {
    $scope.walletSelection = !$scope.walletSelection;
    if (!$scope.walletSelection) return;
    $scope.setWallets();
  };

  $scope.init = function() {
    // This should be called only once.

    // focused wallet change
    if ($rootScope.wallet) {
      $rootScope.$watch('wallet', function() {
        $scope.walletSelection = false;
        $scope.setWallets();
      });
    }

    // wallet list change
    if ($rootScope.iden) {
      var iden = $rootScope.iden;
      iden.on('newWallet', function() {
        $scope.walletSelection = false;
        $scope.setWallets();
      });
      iden.on('walletDeleted', function(wid) {
        if (wid == $rootScope.wallet.id) {
          copay.logger.debug('Deleted focused wallet:', wid);

          // new focus
          var newWid = $rootScope.iden.getLastFocusedWalletId();
          if (newWid && $rootScope.iden.getWalletById(newWid)) {
            identityService.setFocusedWallet(newWid);
          } else {
            copay.logger.debug('No wallets');
            identityService.noFocusedWallet(newWid);
          }
        }
        $scope.walletSelection = false;
        $scope.setWallets();
      });
    }
  };

  $scope.setWallets = function() {
    if (!$rootScope.iden) return;
    var ret = _.filter($rootScope.iden.listWallets(), function(w) {
      return w;
    });
    $scope.wallets = _.sortBy(ret, 'name');
  };
});
