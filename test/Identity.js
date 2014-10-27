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

  function getNewWallet() {
    var wallet = sinon.stub();
    wallet.on = sinon.stub().yields(null);
    wallet.netStart = sinon.stub();
    wallet.toObj = sinon.stub();
    wallet.getName = sinon.stub().returns('walletname');
    wallet.getId = sinon.stub().returns('wid:123');
    return wallet;
  }

  function createIdentity(done) {

    // TODO (eordano): Change this to proper dependency injection
    var blockchain = new FakeBlockchain(config.blockchain);
    var params = getDefaultParams();
    blockchain.on = sinon.stub();
    Wallet._newInsight = sinon.stub().returns(blockchain);

    var wallet = getNewWallet();
    Identity._newWallet = sinon.stub().returns(wallet);

    return {
      blockchain: blockchain,
      storage: params.storage,
      wallet: wallet,
      params: params
    };
  };

  describe('new Identity()', function() {
    it('returns an identity', function() {
      var iden = new Identity(getDefaultParams());
      should.exist(iden);
      iden.walletDefaults.should.deep.equal(config.walletDefaults);
    });
  });

  describe('Identity.create()', function() {
    it('should call .store', function(done) {
      var args = createIdentity();
      args.blockchain.on = sinon.stub();
      Identity.create(args.params, function(err, iden) {
        should.not.exist(err);
        should.exist(iden.wallets);
        done();
      });
    });
  });

  describe('#open', function(done) {
    it('should return last focused wallet', function(done) {
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

  describe('#store', function() {
    it('should call .store for identity and wallets', function(done) {
      var args = createIdentity();
      Identity.create(args.params, function(err, identity) {

        args.storage.setItem = sinon.stub();
        args.storage.setItem.onFirstCall().callsArg(2);

        var wallet1 = {}, wallet2 = {};
        identity.storeWallet = sinon.stub();
        identity.storeWallet.onFirstCall().callsArg(1);
        identity.storeWallet.onSecondCall().callsArg(1);
        identity.wallets = {'a': wallet1, 'b': wallet2};

        identity.store({}, function(err) {
          should.not.exist(err);
          done();
        });

      });
    });
  });

  describe('#createWallet', function() {

    var iden = null;
    var args = null;

    beforeEach(function(done) {
      args = createIdentity();
      Identity.create(args.params, function(err, identity) {
        iden = identity;
        done();
      });
    });

    it('should be able to create wallets with given pk', function(done) {
      var priv = 'tprv8ZgxMBicQKsPdEqHcA7RjJTayxA3gSSqeRTttS1JjVbgmNDZdSk9EHZK5pc52GY5xFmwcakmUeKWUDzGoMLGAhrfr5b3MovMUZUTPqisL2m';
      args.storage.setItem = sinon.stub();
      args.storage.setItem.onFirstCall().callsArg(2);
      args.storage.setItem.onSecondCall().callsArg(2);
      iden.createWallet({
        privateKeyHex: priv,
      }, function(err, w) {
        should.not.exist(err);
        done();
      });
    });

    it('should be able to create wallets with random pk', function(done) {
      args.storage.setItem = sinon.stub();
      args.storage.setItem.onCall(0).callsArg(2);
      args.storage.setItem.onCall(1).callsArg(2);
      args.storage.setItem.onCall(2).callsArg(2);
      args.storage.setItem.onCall(3).callsArg(2);
      iden.createWallet(null, function(err, w1) {
        should.exist(w1);
        iden.createWallet(null, function(err, w2) {
          should.exist(w2);
          done();
        });
      });
    });
  });

  describe('#retrieveWalletFromStorage', function() {
    it('should return wallet', function(done) {
      var args = createIdentity();
      args.storage.getItem.onFirstCall().callsArgWith(1, null, '{"wallet": "fakeData"}');
      var backup = Wallet.fromUntrustedObj;
      Wallet.fromUntrustedObj = sinon.stub().returns(args.wallet);
      Identity.create(args.params, function(err, iden) {
        iden.retrieveWalletFromStorage('dummy', function(err, wallet) {
          should.not.exist(err);
          should.exist(wallet);
          Wallet.fromUntrustedObj = backup;
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

    beforeEach(function(done) {
      args = createIdentity();
      args.params.Async = net = sinon.stub();

      net.cleanUp = sinon.spy();
      net.on = sinon.stub();
      net.start = sinon.spy();

      Identity.create(args.params, function(err, identity) {
        iden = identity;
        done();
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
      iden.createWallet.onFirstCall().yields();
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
      var fakeWallet = {sendWalletReady: _.noop};
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
