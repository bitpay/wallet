'use strict';

angular.module('cosign.header').controller('HeaderController',
  function($scope, $rootScope, $location) {

    $scope.init = function() {
      $rootScope.isLogged = false;
    };

    $scope.signout = function() {
      $rootScope.isLogged = false;

      $location.path('signin');
    };
  });
