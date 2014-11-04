var AddressManager = copay.AddressManager;
var assert = require('assert');

describe('AddressManager', function() {

  var addressManager;
  var unspent = [];
  var walletMock = {};
  
  function setupManager() {
    addressManager = new AddressManager();
    unspent = [
      {address: ADDRESS_1, amountSat: 1000, txid: TXID_1, vout: 0},
      {address: ADDRESS_2, amountSat: 2000, txid: TXID_2, vout: 1},
      {address: ADDRESS_3, amountSat: 3000, txid: TXID_2, vout: 0}
    ];
    walletMock.getUnspent = sinon.mock();
    walletMock.getUnspent.onFirstCall().callsArgWith(0, null, unspent);
  }

  var checkAfterSync = function checkAfterSync(check) {
    return function(done) {
      addressManager.on('ready', function checkAfterSyncReady() {
        if (check) {
          check();
        }
        done();
      });
      addressManager.syncFromWallet(walletMock);
    };
  };

  describe('initialization', function() {

    beforeEach(setupManager);

    it('processes Wallet\'s getBalance result and emits "ready"', checkAfterSync(function() {
      assert(_.size(addressManager.addresses) === 3);
    }));

    it('has a "balance" property', checkAfterSync(function() {
      assert(addressManager.balance === 6000);
    }));

    it('has a "available" property', checkAfterSync(function() {
      assert(addressManager.available === 6000);
    }));
  });

  describe('address creation', function() {

    it.skip('allows the creation of a new address', function() {
      // TODO
    });
  });

  describe('reaction to managed addresses\' events', function() {

    var fakeOutput;
    beforeEach(function() {
      addressManager = new AddressManager();
      fakeOutput = {address: ADDRESS_1, amountSat: 1000, txid: TXID_1, vout: 0};
    });

    it('should emit balance event when a wallet\'s balance changes', function(done) {
      addressManager.on('balance', function() {
        assert(addressManager.balance === 1000);
        done();
      });
      addressManager.processOutput(fakeOutput);
    });

    it('should emit balance event when the available balance changes', function(done) {

      addressManager.on('balance', firstCheck);
      addressManager.processOutput(fakeOutput);

      function firstCheck() {
        assert(addressManager.available === 1000);
        addressManager.removeAllListeners();
        addressManager.on('available', secondCheck);

        addressManager.lockOutput(fakeOutput);
      }
      function secondCheck(callback) {
        assert(addressManager.available === 0);
        addressManager.removeAllListeners();
        addressManager.on('available', thirdCheck);

        addressManager.unlockOutput(fakeOutput);
      }
      function thirdCheck(callback) {
        assert(addressManager.available === 1000);
        done();
      }
    });
  });

  describe('filtering addresses', function() {

    beforeEach(function(done) {
      setupManager();
      addressManager.on('ready', done);
      addressManager.syncFromWallet(walletMock);
    });

    it('allows to query only addresses with balance', function() {
      addressManager.removeOutput(unspent[0]);
      assert(_.size(addressManager.addresses) === 3);
      assert(_.size(addressManager.filter({balance: true})) === 2);
    });

    it('allows to query only addresses with available balance', function() {
      addressManager.lockOutput(unspent[0]);
      assert(_.size(addressManager.addresses) === 3);
      assert(_.size(addressManager.filter({available: true})) === 2);
    });

    it.skip('allows to query for used and unused addresses', function() {
      // TODO
    });

  });
});

var ADDRESS_1 = '2MvBxSdddLPmnBe465rSQGddAXKGAMJnF5B';
var ADDRESS_2 = '2MsjjiR6Sc2ecSCuY75eVjQbnzaLtZJpJev';
var ADDRESS_3 = '2MvGGj5kufHZ1aVQiC5HDd2bBmXeLjEeQBr';
var TXID_1 = 'd9b89923c80ee512f0e3ecf3de1c5353994a6b9e05077af519852042e38d623d';
var TXID_2 = 'a10a7a07de28e60a4f885e6c9f1d9391e8cd95b0a45307c79070747140d6b5ca';
