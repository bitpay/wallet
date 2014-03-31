'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, Network) {
    $scope.loading = false;
    $rootScope.peerId = null;

    $scope.create = function() {
      $scope.loading = true;

      Network.init(function(pid) {
        $rootScope.masterId = pid;
        $location.path('peer'); 
      });
    };

    $scope.join = function(cid) {
      $scope.loading = true;

      Network.init(function() {
        Network.connect(cid, function() {
          $rootScope.masterId = cid;
          $location.path('peer');
        });  
      });

    };
  });
