'use strict';

var chai = chai || require('chai');
var should = chai.should();
var copay = copay || require('../copay');
var Wallet = require('soop').load('../js/models/core/Wallet', {
  Storage: require('./FakeStorage'),
  Network: copay.WebRTC,
  Blockchain: copay.Insight
});

describe('Wallet model', function() {
  var config = {
    wallet: {
      requiredCopayers: 3,
      totalCopayers: 5,
    }
  };
  var opts = {};


  it.skip('should create an instance', function () {
    var opts = {};
    var w = Wallet.create(config, opts);
    should.exist(w);
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
