'use strict';

angular.module('copay.header').controller('HeaderController',
  function($scope, $rootScope, $location, walletFactory, controllerUtils) {
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
        controllerUtils.setSocketHandlers();
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
      $rootScope.flashMessage = {};
    };

    $scope.clearFlashMessage = function() {
      $rootScope.flashMessage = {};
    };

    $rootScope.isCollapsed = true;
  });
