'use strict';

angular.module('copay.header').controller('HeaderController',
  function($scope, $rootScope, $location, Network) {
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

    if (!$rootScope.peerId) {
      $location.path('signin');
    }

    $scope.isActive = function(item) {
      if (item.link && item.link.replace('#','') == $location.path()) {
        return true;
      }
      return false;
    };
    
    $scope.init = function() {
      $rootScope.isLogged = false;
    };

    $scope.signout = function() {
      Network.disconnect(function() {
        console.log('[header.js.41] disconnect CB'); //TODO
        $location.path('signin');
        $rootScope.$digest();
      });
    };

    $scope.clearFlashMessage = function() {
      $rootScope.flashMessage = {};
    };
  });
