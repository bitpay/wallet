
angular.module('copay.signin').controller('SigninController',
  function($scope, $rootScope, $location, walletFactory, controllerUtils) {

//    var peerData = Storage.get($rootScope.walletId, 'peerData');
//    $rootScope.peerId = peerData ? peerData.peerId : null;
    $scope.loading = false;

    $scope.walletIds = walletFactory.getWalletIds();

    $scope.selectedWalletId = $scope.walletIds.length ? $scope.walletIds[0]:null;

    $scope.create = function() {
      $location.path('setup');
    };

    $scope.open = function(walletId, opts) {
      $scope.loading = true;

console.log('[signin.js.23:walletId:]',walletId); //TODO
      var w = walletFactory.open(walletId, opts);
      controllerUtils.setupUxHandlers(w);
    };

    $scope.join = function(secret) {
      $scope.loading = true;


      walletFactory.network.on('joinError', function() {
        controllerUtils.onErrorDigest($scope); 
      });

      walletFactory.joinCreateSession(secret, function(w) {
console.log('[signin.js.33] joinCreateSession RETURN', w); //TODO
        controllerUtils.setupUxHandlers(w);
      });
    };



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

    // if (peerData && peerData.peerId && peerData.connectedPeers.length > 0) {
    //   $rootScope.peerId = peerData.peerId;
    //   $scope.join(peerData.connectedPeers);
    // }
  });

