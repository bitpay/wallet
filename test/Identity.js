'use strict';


var _ = require('lodash');
var chai = chai || require('chai');
var sinon = sinon || require('sinon');
var should = chai.should();
var PluginManager = require('../js/models/PluginManager');
var Insight = require('../js/models/Insight');

var Identity = copay.Identity;
var Wallet = copay.Wallet;
var Passphrase = copay.Passphrase;

var FakeBlockchain = require('./mocks/FakeBlockchain');

var PERSISTED_PROPERTIES = (copay.Wallet || require('../js/models/Wallet')).PERSISTED_PROPERTIES;

function assertObjectEqual(a, b) {
  PERSISTED_PROPERTIES.forEach(function(k) {
    if (a[k] && b[k]) {
      _.omit(a[k], 'name').should.be.deep.equal(b[k], k + ' differs');
    }
  })
}


describe('Identity model', function() {
  var wallet;
  var email = 'hola@hola.com';
  var password = 'password';
  var blockchain;

  var config = {
    walletDefaults: {
      requiredCopayers: 3,
      totalCopayers: 5,
      spendUnconfirmed: 1,
      reconnectDelay: 100,

    },
    blockchain: {
      host: 'test.insight.is',
      port: 80,
      schema: 'https'
    },
    networkName: 'testnet',
    passphrase: {
      iterations: 100,
      storageSalt: 'mjuBtGybi/4=',
    },

    // network layer config
    network: {
      testnet: {
        url: 'https://test-insight.bitpay.com:443'
      },
      livenet: {
        url: 'https://insight.bitpay.com:443'
      },
    },
    version: '0.0.1'
  };

  function getDefaultParams() {
    var params = _.cloneDeep(config);
    _.extend(params, {
      email: email,
      password: password
    });
    params.storage = sinon.stub();
    params.storage.setCredentials = sinon.stub();
    params.storage.getItem = sinon.stub();
    params.storage.setItem = sinon.stub();
    params.storage.setItem.onFirstCall().callsArgWith(2, null);
    params.storage.setItem.onSecondCall().callsArgWith(2, null);
    return params;
  }

  var wid = 0;
  function getNewWallet(args) {
    var w = sinon.stub();
    w.getId = sinon.stub().returns('wid' + (++wid));
    w.getStorageKey = sinon.stub().returns('wkey');
    w.toObj = sinon.stub().returns({
      obj: 1
    });
    w.getName = sinon.stub().returns('name');
    w.setVersion = sinon.stub();
    w.on = sinon.stub();
    w.netStart = sinon.stub();
    w.args = args;
    return w;
  }


  var walletClass = function(args) {
    return getNewWallet(args);
  };

  function createIdentity(done) {

    // TODO (eordano): Change this to proper dependency injection
    var blockchain = new FakeBlockchain(config.blockchain);
    var params = getDefaultParams();
    blockchain.on = sinon.stub();
    Wallet._newInsight = sinon.stub().returns(blockchain);

    return {
      blockchain: blockchain,
      storage: params.storage,
      wallet: wallet,
      params: params
    };
  };
  var orig;
  beforeEach(function() {
    orig = Identity.prototype.store;
    sinon.stub(Identity.prototype, 'store').yields(null);
  });
  afterEach(function() {
    Identity.prototype.store = orig;
  });
  describe('new Identity()', function() {
    it('returns an identity', function() {
      var iden = new Identity(getDefaultParams());
      should.exist(iden);
      iden.walletDefaults.should.deep.equal(config.walletDefaults);
    });
  });

  describe('Identity.create()', function() {
    it('should create and store identity', function() {
      var args = createIdentity();
      args.blockchain.on = sinon.stub();
      Identity.create(args.params, function(err, iden) {
        should.not.exist(err);
        should.exist(iden);
        should.exist(iden.wallets);
        iden.store.calledOnce.should.be.true;
        iden.store.restore();
      });
    });
  });

  describe('#open', function(done) {
    it.skip('should return last focused wallet', function(done) {
      var wallets = [{
        id: 'wallet1',
        store: sinon.stub().yields(null),
        netStart: sinon.stub(),
      }, {
        id: 'wallet2',
        store: sinon.stub().yields(null),
        netStart: sinon.stub(),
      }, {
        id: 'wallet3',
        store: sinon.stub().yields(null),
        netStart: sinon.stub(),
      }];
      var args = createIdentity();
      Identity.create(args.params, function(err, identity) {
        // TODO: Add checks for what is this testing
        done();
      });
    });
  });

  describe('#remove', function(done) {
    it('should remove empty profile', function (done) {
      var storage = sinon.stub();
      storage.setCredentials = sinon.stub();
      storage.removeItem = sinon.stub().yields(null);
      storage.clear = sinon.stub().yields();

      var opts = {
        email: 'test@test.com',
        password: '123',
        network: {
          testnet: {
            url: 'https://test-insight.bitpay.com:443'
          },
          livenet: {
            url: 'https://insight.bitpay.com:443'
          },
        },
        storage: storage,
      };

      var iden = new Identity(opts);
      iden.remove(null, function (err, res) {
        should.not.exist(err);
        storage.removeItem.calledOnce.should.be.true;
        storage.removeItem.getCall(0).args[0].should.equal(iden.getId());
        storage.clear.calledOnce.should.be.true;
        done();
      });
    });

    it('should remove profile and wallets', function(done) {
      var storage = sinon.stub();
      storage.setCredentials = sinon.stub();
      storage.removeItem = sinon.stub().yields(null);
      storage.clear = sinon.stub().yields();

      var opts = {
        email: 'test@test.com',
        password: '123',
        network: {
          testnet: {
            url: 'https://test-insight.bitpay.com:443'
          },
          livenet: {
            url: 'https://insight.bitpay.com:443'
          },
        },
        storage: storage,
      };

      var iden = new Identity(opts);

      _.each(_.range(3), function(i) {
        var w = {
          on: sinon.stub().yields(null),
          getId: sinon.stub().returns('wallet' + i),
          getName: sinon.stub().returns('wallet' + i),
          close: sinon.stub(),
        };
        iden.wallets[w.getId()] = w;
      });

      iden.remove(null, function(err, res) {
        should.not.exist(err);
        storage.removeItem.callCount.should.equal(4);
        storage.removeItem.getCall(0).args[0].should.equal(Wallet.getStorageKey('wallet0'));
        storage.removeItem.getCall(3).args[0].should.equal(iden.getId());
        storage.clear.calledOnce.should.be.true;
        done();
      });
    });
  });

  describe('#storeWallet', function() {
    var iden = null;
    var storage = null;
    beforeEach(function() {
      storage = sinon.stub();
      storage.setCredentials = sinon.stub();

      var opts = {
        email: 'test@test.com',
        password: '123',
        network: {
          testnet: {
            url: 'https://test-insight.bitpay.com:443'
          },
          livenet: {
            url: 'https://insight.bitpay.com:443'
          },
        },
        storage: storage,
      };

      iden = new Identity(opts);
    });

    it('should store a simple wallet', function (done) {
      storage.setItem = sinon.stub().yields(null);
      var w = {
        toObj: sinon.stub().returns({ key1: 'val1' }),
        getStorageKey: sinon.stub().returns('storage_key'),
        getName: sinon.stub().returns('name'),
        setVersion: sinon.spy(),
      };
      iden.storeWallet(w, function (err) {
        should.not.exist(err);
        storage.setItem.calledOnce.should.be.true;
        storage.setItem.calledWith('storage_key', { key1: 'val1' });
        done();
      });
    });
    it('should change wallet version when storing', function (done) {
      storage.setItem = sinon.stub().yields(null);
      var w = {
        toObj: sinon.stub().returns({ key1: 'val1' }),
        getStorageKey: sinon.stub().returns('storage_key'),
        getName: sinon.stub().returns('name'),
        setVersion: sinon.spy(),
        version: '1.0',
        opts: { version: '1.0' },
      };
      iden.version = '2.0';
      iden.storeWallet(w, function (err) {
        should.not.exist(err);
        w.setVersion.calledWith('2.0').should.be.true;
        done();
      });
    });
  });


  describe('#createWallet', function() {
    var iden = null;
    var args = null;
    beforeEach(function() {
      args = createIdentity();
      args.params.noWallets = true;
      var old = Identity.prototype.createWallet;
      Identity.create(args.params, function(err, res) {
        iden = res;
      });
    });

    afterEach(function() {
      iden.store.restore();
    });

    it('should be able to create wallets with given pk', function(done) {
      var priv = 'tprv8ZgxMBicQKsPdEqHcA7RjJTayxA3gSSqeRTttS1JjVbgmNDZdSk9EHZK5pc52GY5xFmwcakmUeKWUDzGoMLGAhrfr5b3MovMUZUTPqisL2m';
      args.storage.setItem = sinon.stub();
      args.storage.setItem.onFirstCall().callsArg(2);
      args.storage.setItem.onSecondCall().callsArg(2);
      should.exist(walletClass, 'check walletClass stub');
      iden.createWallet({
        privateKeyHex: priv,
        walletClass: walletClass,
      }, function(err, w) {
        should.not.exist(err);
        w.args.privateKey.toObj().extendedPrivateKeyString.should.equal(priv);
        done();
      });
    });

    it('should be able to create wallets with random pk', function(done) {
      args.storage.setItem = sinon.stub();
      args.storage.setItem.onCall(0).callsArg(2);
      args.storage.setItem.onCall(1).callsArg(2);
      args.storage.setItem.onCall(2).callsArg(2);
      args.storage.setItem.onCall(3).callsArg(2);
      iden.createWallet({
        walletClass: walletClass,
      }, function(err, w1) {
        should.exist(w1);

        iden.createWallet({
          walletClass: walletClass,
        }, function(err, w2) {
          should.exist(w2);
          w2.args.privateKey.toObj().extendedPrivateKeyString.should.not.equal(
            w1.args.privateKey.toObj().extendedPrivateKeyString
          ); + done();
        });
      });
    });
  });

  describe('#retrieveWalletFromStorage', function() {


    it('should return wallet', function(done) {
      var args = createIdentity();
      args.storage.getItem.onFirstCall().callsArgWith(1, null, '{"wallet": "fakeData"}');
      var backup = Wallet.fromUntrustedObj;
      args.params.noWallets = true;
      sinon.stub().returns(args.wallet);

      var opts = {
        importWallet: sinon.stub().returns(getNewWallet()),
      };

      Identity.create(args.params, function(err, iden) {
        iden.retrieveWalletFromStorage('dummy', opts, function(err, wallet) {
          should.not.exist(err);
          opts.importWallet.calledOnce.should.equal(true);
          should.exist(wallet);
          iden.store.restore();
          done();
        });
      });
    });
  });

  // This is implemented in Compatibility
  describe.skip('#importWallet', function() {
    it('should import a wallet, call the right encryption functions', function(done) {
      var args = createIdentity();
      args.storage.getItem.onFirstCall().callsArgWith(1, null, '{"wallet": "fakeData"}');
      var backup = Wallet.fromUntrustedObj;
      args.params.noWallets = true;
      sinon.stub().returns(args.wallet);
      sinon.stub(Identity.prototype, 'store').yields(null);

      var fakeCrypto = {
        kdf: sinon.stub().returns('passphrase'),
        decrypt: sinon.stub().returns('{"walletId":123}'),
      };

      var opts = {
        importWallet: sinon.stub().returns(getNewWallet()),
        cryptoUtil: fakeCrypto,
      };

      Identity.create(args.params, function(err, iden) {
        sinon.stub(iden, 'importWalletFromObj').yields(null);
        iden.importEncryptedWallet(123, 'password', opts, function(err) {
          should.not.exist(err);
          fakeCrypto.decrypt.getCall(0).args[0].should.equal('password');
          fakeCrypto.decrypt.getCall(0).args[1].should.equal(123);
          iden.store.restore();
          done();
        });
      });
    });
  });



  describe('#export', function() {

  });

  describe('#import', function() {

  });

  /**
   * TODO (eordano): Move this to a different test file
   *
  describe('#pluginManager', function() {
    it('should create a new PluginManager object', function() {
      var pm = new PluginManager({plugins: { FakeLocalStorage: true }, pluginsPath: '../../test/mocks/'});
      should.exist(pm);
    });
  });

  describe('#Insight', function() {
    it('should parse a uri', function() {
      var uri = Insight.setCompleteUrl('http://someurl.bitpay.com:443');
      should.exist(uri);
    });
  });
   */

  describe('#joinWallet', function() {
    var opts = {
      secret: '8WtTuiFTkhP5ao7AF2QErSwV39Cbur6pdMebKzQXFqL59RscXM',
      nickname: 'test',
      password: 'pass'
    };
    var iden = null;
    var args = null;
    var net = null;

    beforeEach(function() {
      args = createIdentity();
      args.params.Async = net = sinon.stub();
      net.cleanUp = sinon.spy();
      net.on = sinon.stub();
      net.start = sinon.spy();
      var old = Identity.prototype.createWallet;
      Identity.create(args.params, function(err, res) {
        iden = res;
        iden.store.restore();
      });
    });

    it('should yield bad network error', function(done) {
      var net = sinon.stub();

      net.greet = sinon.stub();
      net.cleanUp = sinon.stub();
      net.start = sinon.stub().yields(null);
      net.on = sinon.stub();
      net.on.withArgs('data').yields('senderId', {
        type: 'walletId',
        networkName: 'aWeirdNetworkName',
        opts: {},
      });

      opts.privHex = undefined;
      opts.Async = net;
      iden.joinWallet(opts, function(err, w) {
        err.should.equal('badNetwork');
        done();
      });
    });


    it('should callback with a join error in case of a problem', function(done) {
      opts.privHex = undefined;
      var net = sinon.stub();
      net.greet = sinon.stub();
      net.cleanUp = sinon.stub();
      net.start = sinon.stub().yields(null);

      net.on = sinon.stub();
      net.on.withArgs('serverError').yields(null);
      net.on.withArgs('data').yields('senderId', {
        type: 'walletId',
        networkName: iden.networkName,
      });
      opts.Async = net;

      iden.joinWallet(opts, function(err, w) {
        err.should.equal('joinError');
        done();
      });
    });

    it('should return walletFull', function(done) {
      net = sinon.stub();
      net.on = sinon.stub();
      net.start = sinon.stub();
      net.start.onFirstCall().callsArg(1);
      net.greet = sinon.stub();
      iden.createWallet = sinon.stub();
      iden.createWallet.onFirstCall().yields(null, null);
      net.on.withArgs('data').yields('senderId', {
        type: 'walletId',
        networkName: 'testnet',
        opts: {},
      });
      opts.privHex = undefined;
      opts.Async = net;

      iden.joinWallet(opts, function(err, w) {
        err.should.equal('walletFull');
        done();
      });
    });

    it('should accept a priv key as an input', function(done) {
      net = sinon.stub();
      net.on = sinon.stub();
      net.start = sinon.stub();
      net.start.onFirstCall().callsArg(1);
      net.greet = sinon.stub();
      iden.createWallet = sinon.stub();
      var fakeWallet = {
        sendWalletReady: _.noop
      };
      iden.createWallet.onFirstCall().yields(null, fakeWallet);
      net.on.withArgs('data').yields('senderId', {
        type: 'walletId',
        networkName: 'testnet',
        opts: {},
      });

      opts.privHex = 'tprv8ZgxMBicQKsPf7MCvCjnhnr4uiR2Z2gyNC27vgd9KUu98F9mM1tbaRrWMyddVju36GxLbeyntuSadBAttriwGGMWUkRgVmUUCg5nFioGZsd';
      opts.Async = net;
      iden.joinWallet(opts, function(err, w) {
        w.should.equal(fakeWallet);
        done();
      });
    });
  });
});
