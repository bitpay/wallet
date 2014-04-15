'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, Network) {

//    var peerData = Storage.get($rootScope.walletId, 'peerData');
//    $rootScope.peerId = peerData ? peerData.peerId : null;
    $scope.loading = false;

    $scope.selectedWalletId = false;

    $scope.listWalletIds = function() {
      return copay.Wallet.factory.getWalletIds();
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

      Network.openWallet(walletId);

      if ($rootScope.wallet && $rootScope.wallet.id) {
        Network.init(function() {
          $location.path('peer');
          $rootScope.$digest();
        });
      }
      else {
        $scope.loading = false;
        $rootScope.flashMessage = {type:'error', message: 'Wallet not found'};
        $location.path('signin');
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
              $rootScope.flashMessage = { message: 'Connection refussed', type: 'error'};
              $location.path('home');
              $rootScope.$digest();
          });
        });
      }
    };

    // if (peerData && peerData.peerId && peerData.connectedPeers.length > 0) {
    //   $rootScope.peerId = peerData.peerId;
    //   $scope.join(peerData.connectedPeers);
    // }
  });

