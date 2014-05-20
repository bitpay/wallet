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

    // Initialize alert notification (not show when init wallet)
    $rootScope.txAlertCount = 0;
    $rootScope.$watch('txAlertCount', function(txAlertCount) {
      if (txAlertCount && txAlertCount > 0) {
        $notification.info('New Transaction', ($rootScope.txAlertCount == 1) ? 'You have a pending transaction proposal' : 'You have ' + $rootScope.txAlertCount + ' pending transaction proposals', txAlertCount);
      }
    });

    $rootScope.$watch('receivedFund', function(receivedFund) {
      if (receivedFund) {
        $notification.funds('Received fund', 'on ' + receivedFund[1], receivedFund);
      }
    });

    $scope.isActive = function(item) {
      if (item.link && item.link.replace('#','') == $location.path()) {
        return true;
      }
      return false;
    };
    
    $scope.signout = function() {
      logout();
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

    function logout() {
      var w = $rootScope.wallet;
      if (w) {
        w.disconnect();
        controllerUtils.logout();
      }
    }

    // Ensures a graceful disconnect
    window.onbeforeunload = logout;

    $scope.$on('$destroy', function() {
      window.onbeforeunload = undefined;
    });
  });
