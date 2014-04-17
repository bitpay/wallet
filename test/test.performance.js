'use strict';

var chai = chai || require('chai');
var should = chai.should();

var WebRTC = require('../js/models/network/WebRTC');
var Insight = require('../js/models/blockchain/Insight');
var FakeStorage = require('./mocks/FakeStorage');
var PrivateKey = require('../js/models/core/PrivateKey');

var WalletFactory = typeof copay === 'undefined' ? require('soop').load('../js/models/core/WalletFactory',{
  Network: WebRTC,
  Blockchain: Insight,
  Storage: FakeStorage,
}) : copay.WalletFactory;


describe('Performance tests', function() {
  var config = {
    wallet: {
      requiredCopayers: 1,
      totalCopayers: 1,
      spendUnconfirmed: 1,
    },
    networkName: 'testnet',
  };

  describe('PrivateKey', function() {
    it('should optimize BIP32 private key gen time with cache', function() {
      var k1 = new PrivateKey();
      var generateN = 25;
      var generated = [];
      var start1 = new Date().getTime();
      for (var i=0; i<generateN; i++) {
        var k = JSON.stringify(k1.get(i, false).storeObj());
        generated.push(k);
      }
      var delta1 = new Date().getTime() - start1;
      var backup = k1.toObj();
      var k2 = new PrivateKey(backup);
      var start2 = new Date().getTime();
      for (var i=0; i<generateN; i++) {
        var k = JSON.stringify(k2.get(i, false).storeObj());
        generated[i].should.equal(k);
      }
      var delta2 = new Date().getTime() - start2;
      delta2.should.be.below(delta1);
    });
  });

});
