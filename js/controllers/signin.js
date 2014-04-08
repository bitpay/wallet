'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, Network, Storage) {
    var peerData = Storage.get('peerData');

    $scope.loading = false;
    $rootScope.peerId = peerData ? peerData.peerId : null;

    $scope.create = function() {
      $scope.loading = true;

      Network.init(function() {
        $location.path('peer');
        $rootScope.$digest();
      });
    };

    $scope.join = function(cid) {
      $scope.loading = true;

      if (cid) {
        Network.init(function() {
          Network.connect(cid, function() {
console.log('[signin.js.26] REDIR'); //TODO
            $location.path('peer');
            $rootScope.$digest();
          });
        });
      }
    };

    if (peerData && peerData.peerId && peerData.connectedPeers.length > 0) {
      $rootScope.peerId = peerData.peerId;
      $scope.join(peerData.connectedPeers);
    }
  });

