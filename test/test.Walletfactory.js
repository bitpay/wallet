'use strict';

var chai = chai || require('chai');
var should = chai.should();

var WebRTC = require('../js/models/network/WebRTC');
var Insight = require('../js/models/blockchain/Insight');
var FakeStorage = require('./mocks/FakeStorage');

var WalletFactory = typeof copay === 'undefined' ? require('soop').load('../js/models/core/WalletFactory',{
  Network: WebRTC,
  Blockchain: Insight,
  Storage: FakeStorage,
}) : copay.WalletFactory;


var addCopayers = function (w) {
  for(var i=0; i<4; i++) {
    w.publicKeyRing.addCopayer();
  }
};

describe('WalletFactory model', function() {
  var config = {
    wallet: {
      requiredCopayers: 3,
      totalCopayers: 5,
      spendUnconfirmed: 1,
    },
    blockchain: {
      host: 'test.insight.is',
      port: 80
    },
    networkName: 'testnet',
  };

  describe('factory', function() {
    it('should create the factory', function() {
      var wf = new WalletFactory(config);
      should.exist(wf);
    });
    it('#_checkRead should return false', function() {
      var wf = new WalletFactory(config);
      wf._checkRead('dummy').should.equal(false);
      wf.read('dummy').should.equal(false);
    });
 
    it('should be able to create wallets', function() {
      var wf = new WalletFactory(config);
      var w = wf.create();
      should.exist(w);
    });
    it('should be able to get wallets', function() {
      var wf = new WalletFactory(config);
      var w = wf.create();
 
      var w2 = wf.read(w.id);
      should.exist(w2);
      w2.id.should.equal(w.id);
    });
  });

});
