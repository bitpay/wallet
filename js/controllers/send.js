'use strict';

angular.module('copay.send').controller('SendController',
  function($scope, $rootScope, $location, Network) {
    $scope.title = 'Send';

    if (!$rootScope.wallet.id) {
      $location.path('signin');
    }


    $scope.sendTest = function() {
      var w    = $rootScope.wallet;
      var pkr  = w.publicKeyRing;
      var txp  = w.txProposals;
      var opts = {remainderOut: { address: pkr.generateAddress(true).toString() }};

      // From @cmgustavo's wallet
      w.listUnspent(function (unspentTest) {
console.log('[send.js.19:unspentTest:]',unspentTest); //TODO

        txp.create(
          '15q6HKjWHAksHcH91JW23BJEuzZgFwydBt', 
          '123456789', 
          unspentTest,
          w.privateKey,
          opts
        );
console.log('[send.js.29:txp:] READY:',txp); //TODO

        Network.storeOpenWallet();
        Network.sendTxProposals();
        $rootScope.$digest;

        });
    };
  });
