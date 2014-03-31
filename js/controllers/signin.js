'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, Network) {
    $scope.loading = false;
    $rootScope.peerId = null;
    $rootScope.copayers = [];
    
    $scope.create = function() {
      $scope.loading = true;
      Network.init(function(pid) {
        $rootScope.copayers.push(pid);
        $location.path('peer'); 
      });
    };

    $scope.join = function(cid) {
      $scope.loading = true;
      $rootScope.connectionId = cid;
      Network.init(function(pid) {

        console.log('------- join --------');
        console.log(pid);

        $rootScope.copayers.push(pid);
        
        Network.connect(cid, function(copayer) {
          console.log('----- join master --------');
          console.log(copayer);
          $rootScope.copayers.push(copayer);

          $location.path('peer');
        });  
      });

    };
  });
