'use strict';

angular.module('copay.header').controller('HeaderController',
  function($scope, $rootScope, $location, Network) {
    $scope.menu = [{
      'title': 'Home',
      'link': '#/home'
    }, {
      'title': 'Copayers',
      'link': '#/peer'
    }, {
      'title': 'Transactions',
      'link': '#/transactions'
    }, {
      'title': 'Send',
      'link': '#/send'
    }, {
      'title': 'Backup',
      'link': '#/backup'
    }];

    if (!$rootScope.peerId) {
      $location.path('signin');
    }

    $scope.isActive = function(item) {
      if (item.link.replace('#','') == $location.path()) {
        return true;
      }
      return false;
    };
    
    $scope.init = function() {
      $rootScope.isLogged = false;
    };

    $scope.signout = function() {
      console.log('[header.js.37:signout:]'); //TODO

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
