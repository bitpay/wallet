'use strict';

var imports     = require('soop').imports();

var bitcore     = require('bitcore');
var http        = require('http');

var Storage     = imports.Storage     || require('FakeStorage');
var Network     = imports.Network     || require('FakeNetwork');
var Blockchain  = imports.Blockchain  || require('FakeBlockchain');

var copay = copay || require('../../../copay');


function Wallet(opts, config) {
  opts = opts || {};

  console.log('### CREATING WALLET.' 
    + (opts.walletId ? ' USING ID: ' +opts.walletId  : ' NEW ID') );

  //
  this.storage    = new Storage(config.storage);
  this.network    = new Network(config.network);
  this.blockchain = new Blockchain(config.blockchain);


  this.privateKey = new copay.PrivateKey({networkName: config.networkName});
  console.log('\t### PrivateKey Initialized');
  
  
  this.publicKeyRing = opts.publicKeyRing || new copay.PublicKeyRing({
    id: opts.walletId,
    requiredCopayers: opts.requiredCopayers || config.wallet.requiredCopayers,
    totalCopayers: opts.totalCopayers       || config.wallet.totalCopayers,
    networkName: config.networkName,
  });

  this.publicKeyRing.addCopayer(this.privateKey.getBIP32().extendedPublicKeyString());
  console.log('\t### PublicKeyRing Initialized WalletID: ' +  this.publicKeyRing.id);

  this.txProposals = new copay.TxProposals({
    walletId: this.publicKeyRing.id,
    publicKeyRing: this.publicKeyRing,
    networkName: config.networkName,
  });
  console.log('\t### TxProposals Initialized');
}
//
// var Read = function(walletId) {
//   this.storage.read(walletId);
//   $rootScope.w              = new copay.PublicKeyRing.fromObj(pkr);
//   $rootScope.txProposals   = new copay.TxProposals.fromObj(txp);
//   $rootScope.PrivateKey    = new copay.PrivateKey.fromObj(priv); //TODO secure
//
//

    // HERE or in Storage?
    //     $rootScope.walletId      = walletId; 
    //     $rootScope.w              = new copay.PublicKeyRing.fromObj(pkr);
    //     $rootScope.txProposals   = new copay.TxProposals.fromObj(txp);
    //     $rootScope.PrivateKey    = new copay.PrivateKey.fromObj(priv); //TODO secure

    //     // JIC: Add our key
    //     try {
    //       $rootScope.publicKeyRing.addCopayer(
    //             $rootScope.PrivateKey.getBIP32().extendedPublicKeyString()
    //       );
    //     } catch (e) {
    //       console.log('NOT NECCESARY AN ERROR:', e); //TODO
    //     };
    //     ret = true;
    //   }
    //   return ret;
    // };
// };


module.exports = require('soop')(Wallet);

