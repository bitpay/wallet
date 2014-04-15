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
      var unspentTest = [{
        "txid": "2ac165fa7a3a2b535d106a0041c7568d03b531e58aeccdd3199d7289ab12cfc1",
        "vout": 1,
        "amount": 10,
        "confirmations":7
      }];

      unspentTest[0].address        = pkr.generateAddress(false).toString();
      unspentTest[0].scriptPubKey   = pkr.getScriptPubKeyHex(false);
 
console.log('[send.js.29:txp:] BEFORE',txp); //TODO

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
    };
  });
