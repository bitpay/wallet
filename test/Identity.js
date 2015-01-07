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
var version = copay.version;

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


  describe('#openWallets', function(done) {
    it('should emit noWallets', function() {
      var iden = new Identity(getDefaultParams());
      sinon.spy(iden, 'emitAndKeepAlive');
      iden.openWallets();
      iden.emitAndKeepAlive.calledOnce.should.be.true;
      iden.emitAndKeepAlive.getCall(0).args[0].should.equal('noWallets');
    });
  });

  describe('#remove', function(done) {
    it('should remove empty profile', function(done) {
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
      iden.remove(null, function(err, res) {
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

    it('should store a simple wallet', function(done) {
      storage.setItem = sinon.stub().yields(null);
      var w = {
        toObj: sinon.stub().returns({
          key1: 'val1'
        }),
        getStorageKey: sinon.stub().returns('storage_key'),
        getName: sinon.stub().returns('name'),
        setVersion: sinon.spy(),
      };
      iden.storeWallet(w, function(err) {
        should.not.exist(err);
        storage.setItem.calledOnce.should.be.true;
        storage.setItem.calledWith('storage_key', {
          key1: 'val1'
        });
        done();
      });
    });

    it('should return error because the limit has been reached', function(done) {
      storage.setItem = sinon.stub().yields('OVERQUOTA');
      var w = {
        toObj: sinon.stub().returns({
          key1: 'val1'
        }),
        getStorageKey: sinon.stub().returns('storage_key'),
        getName: sinon.stub().returns('name'),
        setVersion: sinon.spy(),
        sizes: sinon.stub().returns(99),
        getId: sinon.spy(),
      };
      iden.storeWallet(w, function(err) {
        should.exist(err);
        err.should.be.equal('OVERQUOTA');
        done();
      });
    });

    it('should return error', function(done) {
      storage.setItem = sinon.stub().yields('UNKNOWN');
      var w = {
        toObj: sinon.stub().returns({
          key1: 'val1'
        }),
        getStorageKey: sinon.stub().returns('storage_key'),
        getName: sinon.stub().returns('name'),
        setVersion: sinon.spy(),
        sizes: sinon.stub().returns(99),
        getId: sinon.spy(),
      };
      iden.storeWallet(w, function(err) {
        should.exist(err);
        err.should.be.equal('UNKNOWN');
        done();
      });
    });




    it('should change wallet version when storing', function(done) {
      storage.setItem = sinon.stub().yields(null);
      var w = {
        toObj: sinon.stub().returns({
          key1: 'val1'
        }),
        getStorageKey: sinon.stub().returns('storage_key'),
        getName: sinon.stub().returns('name'),
        setVersion: sinon.spy(),
        version: '1.0',
        opts: {
          version: '1.0'
        },
      };
      iden.version = '2.0';
      iden.storeWallet(w, function(err) {
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
      args.storage.getItem = sinon.stub().yields(null, JSON.stringify(iden));
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
      args.storage.getItem = sinon.stub().yields(null, JSON.stringify(iden));
      args.storage.setItem = sinon.stub();
      args.storage.setItem.onCall(0).callsArg(2);
      args.storage.setItem.onCall(1).callsArg(2);
      args.storage.setItem.onCall(2).callsArg(2);
      args.storage.setItem.onCall(3).callsArg(2);
      iden.createWallet({
        walletClass: walletClass,
      }, function(err, w1) {
        should.exist(w1);

        args.storage.getItem = sinon.stub().yields(null, JSON.stringify(iden));
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


  describe('#deleteWallet', function() {
    var iden, w;
    beforeEach(function() {
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
      iden = new Identity(opts);

      w = {
        getId: sinon.stub().returns('32'),
        getName: sinon.stub().returns('treintaydos'),
        close: sinon.stub(),
      };
    });

    it('should not save other wallets', function(done) {
      iden.addWallet(w);
      iden.storage.getItem = sinon.stub().yields(null, JSON.stringify(iden));
      iden.deleteWallet('32', function(err) {
        iden.walletIds.should.deep.equal([]);

        should.not.exist(_.find(iden.getWallets(), function(w) {
          return w.getName() == 'treintaydos';
        }));

        iden.store.calledOnce.should.be.true;
        iden.store.getCall(0).args[0].noWallets.should.equal(true);
        done();
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


  describe('add / delete / list Wallets', function() {
    var iden, w, w2;
    beforeEach(function() {
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
      iden = new Identity(opts);

      w = {
        getId: sinon.stub().returns('32'),
        getName: sinon.stub().returns('treintaydos'),
        close: sinon.stub(),
      };

      w2 = {
        getId: sinon.stub().returns('33'),
        getName: sinon.stub().returns('treintaytres'),
        close: sinon.stub(),
      };
    });

    it('should add wallet', function() {
      iden.addWallet(w);
      iden.getWalletById('32').getName().should.equal('treintaydos');
      iden.walletIds.should.deep.equal(['32']);

      _.find(iden.getWallets(), function(w) {
        return w.getName() == 'treintaydos';
      }).should.deep.equal(w);

      iden.addWallet(w2);
      iden.getWalletById('33').getName().should.equal('treintaytres');
      iden.walletIds.should.deep.equal(['32', '33']);

    });

    it('should read and bind wallet', function(done) {
      iden.addWallet(w);
      iden.storage.getItem = sinon.stub().yields(w, JSON.stringify(iden));
      iden.readAndBindWallet('32', function(err) {
        iden.getWalletById('32').getName().should.equal('treintaydos');
        done();
      });
    });


    it('should open wallet', function() {
      iden.addWallet(w);
      iden.storage.getItem = sinon.stub().yields(w, JSON.stringify(iden));
      iden.readAndBindWallet = sinon.spy();
      iden.openWallets();
      iden.readAndBindWallet.should.calledOnce;

    });

    it('should open wallets', function() {
      iden.addWallet(w);
      iden.addWallet(w2);
      iden.storage.getItem = sinon.stub().yields(w, JSON.stringify(iden));
      iden.readAndBindWallet = sinon.spy();
      iden.openWallets();
      iden.walletIds.should.deep.equal(['32', '33']);
      iden.readAndBindWallet.callCount.should.be.equal(1);

    });

    it('should not add same wallet twice', function() {
      iden.addWallet(w);
      iden.addWallet(w);
      iden.getWalletById('32').getName().should.equal('treintaydos');
      iden.walletIds.should.deep.equal(['32']);
      _.find(iden.getWallets(), function(w) {
        return w.getName() == 'treintaydos';
      }).should.deep.equal(w);
    });

    it('should delete wallet', function(done) {
      iden.addWallet(w);
      iden.getWalletById('32').getName().should.equal('treintaydos');
      iden.storage.getItem = sinon.stub().yields(null, JSON.stringify(iden));
      iden.deleteWallet('32', function(err) {
        should.not.exist(iden.getWalletById('32'));
        iden.walletIds.should.deep.equal([]);

        should.not.exist(_.find(iden.getWallets(), function(w) {
          return w.getName() == 'treintaydos';
        }));
        done();
      });
    });
  });

  describe('toObj', function() {
    var iden, w, w2;
    beforeEach(function() {
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
      iden = new Identity(opts);

      w = {
        getId: sinon.stub().returns('32'),
        getName: sinon.stub().returns('treintaydos'),
        close: sinon.stub(),
      };
      w2 = {
        getId: sinon.stub().returns('33'),
        getName: sinon.stub().returns('treintaytres'),
        close: sinon.stub(),
      };
    });
    it('should include wallets', function() {
      iden.addWallet(w);
      var obj = iden.toObj();
      _.indexOf(obj.walletIds, '32').should.be.above(-1);
    });
    it('should set version to actual version', function() {
      var obj = iden.toObj();
      obj.version.should.equal(version);
    });
    it('should include 2 wallets', function() {
      iden.addWallet(w);
      iden.addWallet(w2);
      var obj = iden.toObj();
      _.indexOf(obj.walletIds, '32').should.be.above(-1);
      _.indexOf(obj.walletIds, '33').should.be.above(-1);
    });
  });


  describe('#_cleanUp', function() {
    var iden, w, w2;
    beforeEach(function() {
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
      iden = new Identity(opts);

      w = {
        getId: sinon.stub().returns('32'),
        getName: sinon.stub().returns('treintaydos'),
        close: sinon.stub(),
      };
      w2 = {
        getId: sinon.stub().returns('33'),
        getName: sinon.stub().returns('treintaytres'),
        close: sinon.stub(),
      };
      iden.addWallet(w);
      iden.addWallet(w2);
    });

    it('should close all wallets', function() {
      _.size(iden.wallets).should.be.equal(2);
      iden._cleanUp();
      _.size(iden.wallets).should.be.equal(0);
    });

  });

  describe('#getLastFocusedWalletId', function() {
    var clock;
    before(function() {
      clock = sinon.useFakeTimers();
    });
    after(function() {
      clock.restore();
    });
    var iden, w, w2;
    beforeEach(function() {
      var storage = sinon.stub();
      storage.setCredentials = sinon.stub();
      storage.removeItem = sinon.stub().yields(null);
      storage.clear = sinon.stub().yields();
      storage.getItem = sinon.stub();

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

      w = {
        getId: sinon.stub().returns('32'),
        getName: sinon.stub().returns('treintaydos'),
        close: sinon.stub(),
      };
      w2 = {
        getId: sinon.stub().returns('33'),
        getName: sinon.stub().returns('treintaytres'),
        close: sinon.stub(),
      };

    });

    it('should return undefined', function() {
      expect(iden.getLastFocusedWalletId()).to.be.undefined;
    });

    it('should return last focused wallet', function() {
      iden.addWallet(w);
      iden.addWallet(w2);
      iden.updateFocusedTimestamp(w.getId());

      iden.getLastFocusedWalletId().should.be.equal(w.getId());

      clock.tick(1000);

      iden.updateFocusedTimestamp(w2.getId());
      iden.getLastFocusedWalletId().should.be.equal(w2.getId());

      iden.deleteWallet(w2.getId(), function() {
        iden.getLastFocusedWalletId().should.be.equal(w.getId());
      });
    });
  });

  describe('importFromFullJson', function() {
    var opts;
    beforeEach(function() {
      var storage = sinon.stub();
      storage.setCredentials = sinon.stub();
      storage.removeItem = sinon.stub().yields(null);
      storage.clear = sinon.stub().yields();

      opts = {
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
    });
    it('should throw error because json is wrong', function() {
      Identity.importFromFullJson('asdfg', '1', {}, function(c) {
        c.should.be.equal('BADSTR: Unable to retrieve json from string');
      });
    });
    it('should throw error because json does not have required fields', function() {
      Identity.importFromFullJson('{"age":23}', '1', {}, function(c) {
        c.should.be.equal('BADSTR');
      });
    });
    it('should create a profile', function() {
      var json = '{"networkOpts":{"livenet":{"url":"https://insight.bitpay.com:443","transports":["polling"]},"testnet":{"url":"https://test-insight.bitpay.com:443","transports":["polling"]}},"blockchainOpts":{"livenet":{"url":"https://insight.bitpay.com:443","transports":["polling"]},"testnet":{"url":"https://test-insight.bitpay.com:443","transports":["polling"]}},"fullName":"l@l","email":"l@l","password":"1","storage":{"type":"DB","storeUrl":"https://insight.bitpay.com:443/api/email","iterations":1000,"salt":"jBbYTj8zTrOt6V","email":"l@l","password":"1","_cachedKey":"y4a352k6sM15gGag+PgQwXRdFjzi0yX6aLEGttWaeP+kbU7JeSPDUfbhhzonnQRUicJu/1IMWgDZbDJjWmrKgA=="},"walletDefaults":{"requiredCopayers":2,"totalCopayers":3,"spendUnconfirmed":true,"reconnectDelay":5000,"idleDurationMin":4,"settings":{"unitName":"bits","unitToSatoshi":100,"unitDecimals":2,"alternativeName":"US Dollar","alternativeIsoCode":"USD"}},"version":"0.8.2","walletIds":["15a3ecd34dfb7000","59220d2110461861","bfd6adad419078d9","893dc0c0a776648b","e8ee7218c6ea7f93"],"wallets":{},"focusedTimestamps":{"15a3ecd34dfb7000":1418916813711,"bfd6adad419078d9":1418835855887,"e8ee7218c6ea7f93":1418775999995,"59220d2110461861":1418835858871,"893dc0c0a776648b":1418835763680},"backupNeeded":true,"_events":{}}';
      Identity.importFromFullJson(json, '1', opts, function(err, iden) {
        expect(err).to.be.null;
        iden.should.not.be.null;
      });

    });

  });

  describe('#closeWallet', function() {
    var iden, w, w2, w3;
    beforeEach(function() {
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
      iden = new Identity(opts);

      w = {
        getId: sinon.stub().returns('32'),
        getName: sinon.stub().returns('treintaydos'),
        close: sinon.stub(),
      };
      w2 = {
        getId: sinon.stub().returns('33'),
        getName: sinon.stub().returns('treintaytres'),
        close: sinon.stub(),
      };

      w3 = {
        getId: sinon.stub().returns('34'),
        getName: sinon.stub().returns('treintaycuatro'),
        close: sinon.stub(),
      };

      iden.addWallet(w);
      iden.addWallet(w2);
      //do not add w3
    });

    it('should close a Wallet', function() {
      iden.closeWallet(w, function(err) {
        expect(err).to.be.null;
      });

      iden.closeWallet(w3, function(err) {
        expect(err).to.be.not.null;
      });
    });

  });



  describe('#_checkVersion', function() {
    var iden;
    beforeEach(function() {
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
      iden = new Identity(opts);
    });

    it('should checkVersion', function() {

      expect(iden._checkVersion()).to.be.undefined;
      expect(iden._checkVersion('0.0.0')).to.be.undefined;
      (function() {
        console.log('b', iden._checkVersion('9.9.9'));
      }).should.throw('Major difference');
    });
  });

});
