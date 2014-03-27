'use strict';

angular.module('cosign.header').controller('HeaderController',
  function($scope, $rootScope, $location) {
    $scope.menu = [{
      'title': 'Home',
      'link': '#/'
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
      $rootScope.isLogged = false;

      $location.path('signin');
    };
  });
