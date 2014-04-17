'use strict';

angular.module('copay.header').controller('HeaderController',
  function($scope, $rootScope, $location, walletFactory, controllerUtils) {
    $scope.menu = [{
      'title': 'Home',
      'icon': 'fi-home',
      'link': '#/home'
    }, {
      'title': 'Copayers',
      'icon': 'fi-torsos-all',
      'link': '#/peer'
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

   if (!$rootScope.wallet || !$rootScope.wallet.id) {
      $location.path('signin');
    }

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
    };

    $scope.clearFlashMessage = function() {
      $rootScope.flashMessage = {};
    };

  });
