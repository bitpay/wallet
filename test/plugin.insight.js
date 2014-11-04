var InsightStorage = require('../js/plugins/InsightStorage');
var assert = require('assert');
var querystring = require('querystring');

describe('insight storage plugin', function() {

  var requestMock = sinon.stub();
  var storage = new InsightStorage({request: requestMock});
  var email = 'john@doe.com';
  var password = '1234';

  var data = '{"random": true}';
  var namespace = 'profile::0000000000000000000000000000000000000000';

  var oldSecret = 'rFA+F/N+ZvKXp717zBdfCKYQ5v9Fjry0W6tautj5etIH'
                + 'KLQliZBEYXA7AXjTJ9K3DglzGWJKost3QJUCMbhM/A=='
  var newSecret = '+72pwnQ/ukrXVXZ/L4vFeiykwn522uVz0J6p81TGXvI=';

  var setupStorageCredentials = function() {
    storage.setCredentials(email, password);
  };

  beforeEach(function() {
    requestMock.reset();
    requestMock.get = sinon.stub();
    requestMock.post = sinon.stub();
    setupStorageCredentials();
  });

  var setupForCreation = function() {
    requestMock.get.onFirstCall().callsArgWith(1, 'Not found');
    requestMock.post.onFirstCall().callsArgWith(1, null, {statusCode: 200});
  };

  it('should be able to create a namespace for storage', function(done) {

    setupForCreation();

    storage.createItem(namespace, data, function(err) {
      assert(!err);
      return done();
    });
  });

  var setupForRetrieval = function() {
    requestMock.get.onFirstCall().callsArgWith(1, null, {statusCode: 200}, data);
  };

  it('should be able to retrieve data in a namespace', function(done) {

    setupForRetrieval();

    storage.getItem(namespace, function(err, retrieved) {
      assert(!err);
      assert(retrieved === data);
      return done();
    });
  });

  var setupForSave = function () {
    requestMock.post.onFirstCall().callsArgWith(1, null, {statusCode: 200});
  };

  it('should be able to overwrite data when using same password', function(done) {
    setupForSave();

    storage.setItem(namespace, data, function(err) {
      assert(!err);
      assert(requestMock.post.firstCall.args[0].url.indexOf('register') !== -1);
      return done();
    });
  });

  it('won\'t make an unnecessary request if old password can\'t work', function(done) {
    storage.setCredentials(email, '!');
    setupForRetrieval();

    storage.getItem(namespace, function(err, retrieved) {
      assert(requestMock.get.firstCall);
      assert(!requestMock.get.secondCall);
      return done();
    });
  });

  it('shouldn\'t be able to create a namespace twice', function(done) {
    setupForRetrieval();

    storage.createItem(namespace, data, function(err) {
      assert(err);
      assert(requestMock.get.firstCall.args[0].url.indexOf('retrieve') !== -1);
      assert(!requestMock.post.firstCall);
      return done();
    });
  });

  var setupForOldData = function() {
    requestMock.get = sinon.stub();
    requestMock.get.onFirstCall().callsArgWith(1, null, {statusCode: 403});
    requestMock.get.onSecondCall().callsArgWith(1, null, {statusCode: 200}, data);
    requestMock.post = sinon.stub();
    requestMock.post.onFirstCall().callsArgWith(1, null, {statusCode: 200});
  }

  it('should be able to restore 0.7.2 data', function(done) {

    setupForOldData();

    storage.getItem(namespace, function(error, dataReturned) {
      assert(!error);
      done();
    });
  });

  it('should change the remote passphrase if retrieved with 0.7.2 passphrase',
    function(done) {

      setupForOldData();

      storage.getItem(namespace, function(error, dataReturned) {
        var receivedArgs = requestMock.post.firstCall.args[0].body;
        var url = requestMock.post.firstCall.args[0].url;
        var args = querystring.decode(receivedArgs);
        assert(url.indexOf('change_passphrase') !== -1);
        assert(requestMock.post.firstCall.args[0].headers.Authorization
               ===
               new Buffer(email + ':' + oldSecret).toString('base64'));
        assert(args.newPassphrase === newSecret);
        done();
      });
    }
  );
});
