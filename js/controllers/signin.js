'use strict';

angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, walletFactory) {

//    var peerData = Storage.get($rootScope.walletId, 'peerData');
//    $rootScope.peerId = peerData ? peerData.peerId : null;
    $scope.loading = false;

    $scope.selectedWalletId = false;

    $scope.listWalletIds = function() {
      return walletFactory.getWalletIds();
    };

    var _setupUxHandlers =  function(w) {
      w.on('open', function(){
        $location.path('peer');
        $rootScope.wallet = w;
        $rootScope.$digest();
      });
      w.on('openError', function(){
        $scope.loading = false;
        $rootScope.flashMessage = {type:'error', message: 'Wallet not found'};
        $location.path('signin');
      });
    };

    $scope.create = function() {
console.log('[signin.js.42:create:]'); //TODO
      $scope.loading = true;

      var w = walletFactory.create();
      _setupUxHandlers(w);
      w.netStart();
    };

    $scope.open = function(walletId) {
      $scope.loading = true;

      var w = walletFactory.open(walletId);
      _setupUxHandlers(w);
      w.netStart();
    };

    $scope.join = function(cid) {
console.log('[signin.js.42:join:]'); //TODO
      $scope.loading = true;
//
//       if (cid) {
//         var w = walletFactory.(walletId);
        //TODO
        // Network.init(null, function() {
        //   Network.connect(cid, 
        //     function() {
        //       $location.path('peer');
        //       $rootScope.$digest();
        //     }, function() {
        //       $rootScope.flashMessage = { message: 'Connection refussed', type: 'error'};
        //       $location.path('home');
        //       $rootScope.$digest();
        //   });
        // });
//      }
    };

    // if (peerData && peerData.peerId && peerData.connectedPeers.length > 0) {
    //   $rootScope.peerId = peerData.peerId;
    //   $scope.join(peerData.connectedPeers);
    // }
  });

