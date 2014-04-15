'use strict';

var chai = chai || require('chai');
var should = chai.should();
var copay = copay || require('../copay');
var Wallet = require('soop').load('../js/models/core/Wallet', {
  Storage: require('./FakeStorage'),
  Network: copay.WebRTC,
  Blockchain: copay.Insight
});


var addCopayers = function (w) {
  for(var i=0; i<4; i++) {
    w.publicKeyRing.addCopayer();
  }
};

describe('Wallet model', function() {
  var config = {
    wallet: {
      requiredCopayers: 3,
      totalCopayers: 5,
    }
  };
  var opts = {};


  it('should create an instance', function () {
    var opts = {};
    var w = new Wallet(config);
    should.exist(w);
  });


  it('should fail to load', function () {
    var opts = {};
    var w = new Wallet(config);
    w.load(123);
    should.not.exist(w.id);
  });


  it('should create', function () {
    var opts = {};
    var w = new Wallet(config);
    w.create();
    should.exist(w.id);
    should.exist(w.publicKeyRing);
    should.exist(w.privateKey);
    should.exist(w.txProposals);
  });

  it('should create', function () {
    var opts = {};
    var w = new Wallet(config);
    w.create();
    addCopayers(w);
    w.publicKeyRing.generateAddress(false);

    should.exist(w.id);
    w.publicKeyRing.isComplete().should.equal(true);
  });



  describe('factory', function() {
    it('should create the factory', function() {
      should.exist(Wallet.factory);
    });
    it('should be able to create wallets', function() {
      var w = Wallet.factory.create(config, opts);
      should.exist(w);
    });
    it.skip('should be able to get wallets', function() {
      var w = Wallet.factory.create(config, opts);
      var v = Wallet.factory.get(config, w.id);
      should.exist(w);
    });
  });

});
