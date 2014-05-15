'use strict';

angular.module('copay.header').controller('HeaderController',
  function($scope, $rootScope, $location, $notification, walletFactory, controllerUtils) {
    $scope.menu = [
    {
      'title': 'Addresses',
      'icon': 'fi-address-book',
      'link': '#/addresses'
    }, {
      'title': 'Transactions',
      'icon': 'fi-loop',
      'link': '#/transactions'
    }, {
      'title': 'Send',
      'icon': 'fi-arrow-right',
      'link': '#/send'
    }, {
      'title': 'Backup',
      'icon': 'fi-archive',
      'link': '#/backup'
    }];

    $rootScope.$watch('wallet', function(wallet) {
      if (wallet) {
        controllerUtils.updateTxs();
      }
    });

    // Initialize alert notification (not show when init wallet)
    $rootScope.txAlertCount = 0;
    $notification.enableHtml5Mode(); // for chrome: if support, enable it
    $rootScope.$watch('txAlertCount', function(txAlertCount) {
      if (txAlertCount && txAlertCount > 0) {
        $notification.info('New Transaction', ($rootScope.txAlertCount == 1) ? 'You have a pending transaction proposal' : 'You have ' + $rootScope.txAlertCount + ' pending transaction proposals', txAlertCount);
      }
    });

    $scope.isActive = function(item) {
      if (item.link && item.link.replace('#','') == $location.path()) {
        return true;
      }
      return false;
    };
    
    $scope.signout = function() {
      var w = $rootScope.wallet;
      if (w) {
        w.disconnect();
        controllerUtils.logout();
      }
      $scope.clearFlashMessage();
    };

    $scope.refresh = function() {
      var w = $rootScope.wallet;
      w.connectToAll();
      controllerUtils.updateBalance(function() {
      });
    };

    $scope.clearFlashMessage = function() {
      $rootScope.flashMessage = {};
    };

    $rootScope.isCollapsed = true;
  });
