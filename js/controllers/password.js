'use strict';

angular.module('copay.password').controller('PasswordController',
  function($scope, $rootScope) {
    $scope.title = 'Password';

    $scope.getPassphrase = function() {
      console.log('######### Password', $scope.password);
    };

  });
