'use strict';

var        assert = require('assert'),
                _ = require('underscore'),
  ProfileProvider = require('../../../js/persistence/profile/insight');

describe('insight profile provider', function() {

  var profileFactory;
  var insightUrl = 'INSIGHT_URL';
  var request;
  var profileProvider;
  var profile;
  var callback;
  var privkey = new bitcore.HierarchicalKey();

  beforeEach(function() {
    callback = sinon.spy();
    profileFactory = {
      create: sinon.mock()
    };
    insightUrl = 'INSIGHT_URL';
    request = {
      get: sinon.stub(),
      post: sinon.mock()
    };
    profileProvider = new ProfileProvider({
      request: request,
      insigthUrl: insightUrl,
      profileFactory: profileFactory
    });
    profile = {
      getAsJsonString: sinon.mock()
    };
  });

  it('can store a profile in a remote insight', function() {
    request.post.onFirstCall().callsArgWith(1, null, {statusCode: 200});
    profileProvider.register(profile, privkey, {}, callback);
    assert(callback.calledOnce && callback.calledWith());
  });
  it('can receive a public key to store a "redirection"', function() {
    var publicKey = privkey.eckey.public;
    request.post.onFirstCall().callsArgWith(1, null, {statusCode: 200});
    profileProvider.redirect(publicKey, privkey, {}, callback);
    assert(callback.calledOnce && callback.calledWith());
  });
  it('can receive a profile to store a "redirection"', function() {
    var fakeProfile = { getXpubkey: function() { return privkey; } };
    request.post.onFirstCall().callsArgWith(1, null, {statusCode: 200});
    profileProvider.redirect(fakeProfile, privkey, {}, callback);
    assert(callback.calledOnce && callback.calledWith());
  });
  it('should work receiving a string as a private key', function() {
    request.post.onFirstCall().callsArgWith(1, null, {statusCode: 200});
    profileProvider.register(profile, privkey.extendedPrivateKey.toString(), {}, callback);
    assert(callback.calledOnce && callback.calledWith());
  });
  it('can retrieve a profile from the remote server', function() {
    request.get.onFirstCall().callsArgWith(1, null, {statusCode: 200}, '{}');
    profileFactory.create.onFirstCall().callsArgWith(1);
    profileProvider.retrieve(privkey, {}, callback);
    assert(callback.calledOnce);
  });
  it('can retrieve a "redirected" profile', function() {
    request.get.onFirstCall().callsArgWith(1, null, {statusCode: 200}, '{"redirect": "1"}');
    request.get.onSecondCall().callsArgWith(1, null, {statusCode: 200}, '{}');
    profileFactory.create.onFirstCall().callsArgWith(1);
    profileProvider.retrieve(privkey, {}, callback);
    assert(callback.calledOnce);
  });

  it('fails when an invalid private key is received', function() {
    profileProvider.register(profile, 'invalid private key', {}, callback);
    assert(callback.calledOnce && callback.calledWith(ProfileProvider.INTERNAL_ERROR));
  });
  it('fails when an invalid public key is provided', function() {
    profileProvider.retrieve('public key', {}, callback);
    assert(callback.calledOnce && callback.calledWith(ProfileProvider.INTERNAL_ERROR));
  });
  it('fails when internet is not available', function() {
    request.post.onFirstCall().callsArgWith(1, 'NO_INTERNET!');
    profileProvider.register(profile, privkey, {}, callback);
    assert(callback.calledOnce && callback.calledWith(ProfileProvider.CONNECTION_ERROR));
  });
  it('fails when the profile doesnt exist', function() {
    request.get.onFirstCall().callsArgWith(1, null, {statusCode: 404});
    profileProvider.retrieve(privkey, {}, callback);
    assert(callback.calledOnce && callback.calledWith(ProfileProvider.NOT_FOUND));
  });
});
