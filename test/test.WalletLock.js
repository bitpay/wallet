'use strict';

var chai = chai || require('chai');
var should = chai.should();
var sinon = require('sinon');
var is_browser = (typeof process == 'undefined' || typeof process.versions === 'undefined');
if (is_browser) {
  var copay = require('copay'); //browser
} else {
  var copay = require('../copay'); //node
}
var copayConfig = require('../config');
var WalletLock = copay.WalletLock;

var PrivateKey = copay.PrivateKey;
var Storage = require('./mocks/FakeStorage');

describe('WalletLock model', function() {
  var storage = new Storage();

  it('should fail with missing args', function() {
    (function() {
      new WalletLock()
    }).should.throw('Argument');
  });


  it('should fail with missing args (case 2)', function() {
    (function() {
      new WalletLock(storage)
    }).should.throw('Argument');
  });

  it('should create an instance', function() {
    var w = new WalletLock(storage, 'id');
    should.exist(w);
  });

  it('should fail if locked already', function() {
    var w = new WalletLock(storage, 'walletId');
    storage.sessionId = 'xxx';
    (function() {
      new WalletLock(storage, 'walletId')
    }).should.throw('adquire lock');
  });

  it('should not fail if locked by me', function() {
    var s = new Storage();
    var w = new WalletLock(s, 'walletId');
    var w2 = new WalletLock(s, 'walletId')
    should.exist(w2);
  });

  it('should not fail if locked by me', function() {
    var s = new Storage();
    var w = new WalletLock(s, 'walletId');
    var w2 = new WalletLock(s, 'walletId')
    should.exist(w2);
  });
  it('should not fail if expired', function() {
    var s = new Storage();
    var w = new WalletLock(s, 'walletId');
    s.storage[Object.keys(s.storage)[0]].expireTs = Date.now() - 60 * 6 * 1000;

    s.sessionId = 'xxx';
    var w2 = new WalletLock(s, 'walletId')
    should.exist(w2);
  });



});
