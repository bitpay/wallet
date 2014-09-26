'use strict';

var           chai = require('chai'),
            assert = require('better-assert'),
             sinon = require('sinon'),
            should = chai.should(),
            expect = chai.expect,
       cryptoUtils = require('../../../js/util/crypto'),
  identityProvider = require('../../../js/persistence/identity/insight');

describe.only('insight identity persistence', function() {

  var INSIGHT_URL = 'insighturl',
            EMAIL = 'email',
       PASSPHRASE = 'passphrase',
          PRIVKEY = 'privkey';
  var KEY = cryptoUtils.kdf(PASSPHRASE, EMAIL);
  var SECRET = cryptoUtils.kdf(KEY, PASSPHRASE, EMAIL);
  var ENCRYPTED = cryptoUtils.encrypt(KEY, PRIVKEY);

  var provider, opts;

  beforeEach(function() {
    opts = {
      insightUrl: INSIGHT_URL,
      identityFactory: {
        create: sinon.stub()
      },
      request: {
        post: sinon.stub(),
        get: sinon.stub()
      }
    };

    provider = new identityProvider(opts);
  });

  describe('on registration', function() {

    var identity = {
      getEmail: function() { return EMAIL; },
      getPassphrase: function() { return PASSPHRASE; },
      getXprivkey: function() { return PRIVKEY; }
    };
    beforeEach(function() {
      sinon.spy(identity, 'getEmail');
      sinon.spy(identity, 'getPassphrase');
      sinon.spy(identity, 'getXprivkey');
    });

    it('should make the correct request', function() {

      var callback = sinon.spy();
      opts.request.post.onFirstCall().callsArgWith(1, null, {statusCode: 200});
      provider.register(identity, callback);

      assert(identity.getEmail.callCount === 2);
      assert(identity.getPassphrase.callCount === 2);
      assert(identity.getXprivkey.callCount === 1);
      assert(callback.calledOnce);
      assert(callback.calledWithExactly());
    });
  });

  describe('when retrieving', function() {

    beforeEach(function() {
      opts.request.get.reset();
    });

    it('should make the correct calls', function() {
      var callback = sinon.stub();
      opts.request.get.onFirstCall().callsArgWith(1, null, {statusCode: 200}, ENCRYPTED);

      provider.retrieve(EMAIL, PASSPHRASE, {}, callback);

      assert(opts.identityFactory.create.firstCall.args[0] === PRIVKEY);
      assert(opts.identityFactory.create.firstCall.args[1] === EMAIL);
      assert(opts.identityFactory.create.firstCall.args[2] === PASSPHRASE);
    });

    it('should fail with an invalid password', function() {
      var callback = sinon.stub();
      opts.request.get.onFirstCall().callsArgWith(1, null, {statusCode: 400});

      provider.retrieve(EMAIL, PASSPHRASE, {}, callback);

      assert(callback.calledWith(identityProvider.INVALID_CREDENTIALS));
    });

  });
});
