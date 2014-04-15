'use strict';

angular.module('copay.backup').controller('BackupController',
  function($scope, $rootScope, $location) {


    if (!$rootScope.wallet.id) {
      $location.path('signin');
    }


    $scope.title = 'Backup';
  });
