'use strict';

angular.module('copayApp.controllers').controller('HomeWalletController',
  function($scope, $rootScope, $timeout, $modal, controllerUtils) {
    controllerUtils.redirIfNotComplete();

    $rootScope.title = 'Home';


    if ($rootScope.addrInfos) {

      $scope.address = $rootScope.addrInfos[0];
    }

  }
);
