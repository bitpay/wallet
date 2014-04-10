'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, Network, Storage) {

    var peerData = Storage.get($rootScope.walletId, 'peerData');

    $scope.loading = false;
    $rootScope.peerId = peerData ? peerData.peerId : null;

    $scope.listWalletIds = function() {
      return Storage.getWalletIds();
    };

    $scope.create = function() {
      $scope.loading = true;

      Network.createWallet();
      Network.init(function() {
        $location.path('peer');
        $rootScope.$digest();
      });
    };

    $scope.open = function(walletId) {
      $scope.loading = true;

      if (Network.openWallet(walletId)) {
        Network.init(function() {
          $location.path('peer');
          $rootScope.$digest();
        });
      }
    };

    $scope.join = function(cid) {
      $scope.loading = true;

      if (cid) {
        Network.init(function() {
          Network.connect(cid, 
            function() {
              $location.path('peer');
              $rootScope.$digest();
            }, function() {

console.log('[signin.js.46] SETTING MESSAGE'); //TODO
              $rootScope.flashMessage = { message: 'Connection refussed', type: 'error'};
              $location.path('home');
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

