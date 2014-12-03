var InsightStorage = require('../js/plugins/InsightStorage');
var assert = require('assert');
var querystring = require('querystring');

describe('insight storage plugin', function() {

  var requestMock = sinon.stub();
  var storage = new InsightStorage({
    request: requestMock
  });
  var email = 'john@doe.com';
  var password = '1234';

  var data = '{"random": true}';
  var headers = 'X-test: 12\r\nX-testb: 32';
  var namespace = 'profile::0000000000000000000000000000000000000000';

  var oldSecret = 'rFA+F/N+ZvKXp717zBdfCKYQ5v9Fjry0W6tautj5etIH' + 'KLQliZBEYXA7AXjTJ9K3DglzGWJKost3QJUCMbhM/A=='
  var newSecret = '96KnVsaQFv8vsbxAFeYyGM4nO/8B6YaVNKz9IxDmwzk=';

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
    requestMock.post.onFirstCall().callsArgWith(1, null, {
      statusCode: 200
    });
  };

  it('should be able to create a namespace for storage', function(done) {

    setupForCreation();

    storage.createItem(namespace, data, function(err) {
      assert(!err);
      return done();
    });
  });

  var setupForRetrieval = function(code) {
    requestMock.get.onFirstCall().callsArgWith(1, null, {
      statusCode: code || 200,
      getAllResponseHeaders: sinon.stub().returns(headers),
    }, data);
  };

  describe('#getItem', function() {
    it('should be able to retrieve data in a namespace', function(done) {
      setupForRetrieval();

      storage.getItem(namespace, function(err, retrieved) {
        assert(!err);
        assert(retrieved === data);
        var url = requestMock.get.getCall(0).args[0].url;
        url.should.contain('?key=' + querystring.encode(namespace));
        return done();
      });
    });

    it('should be able to retrieve headers', function(done) {

      setupForRetrieval();

      storage.getItem(namespace, function(err, retrieved, headers) {
        assert(!err);
        headers['X-test'].should.equal('12');
        headers['X-testb'].should.equal('32');
        return done();
      });
    });

    it('should be able handle 403', function(done) {
      setupForRetrieval(403);
      // old profile query
      requestMock.get.onSecondCall().callsArgWith(1, null, {
        statusCode: 403,
        getAllResponseHeaders: sinon.stub().returns(headers),
      }, data);
      storage.getItem(namespace, function(err) {
        err.should.contain('PNOTFOUND');
        return done();
      });
    });

    it('should be able handle other error', function(done) {
      setupForRetrieval(510);
      storage.getItem(namespace, function(err) {
        err.should.contain('Unable');
        return done();
      });
    });
  });

  describe('#removeItem', function() {

    it('should be able to delete Items', function(done) {
      setupForRetrieval();
      storage.removeItem(namespace, function(err) {
        should.not.exist(err);
        var url = requestMock.get.getCall(0).args[0].url;
        url.should.contain('?key=' + querystring.encode(namespace));

        return done();
      });
    });

    it('should be able handle 406', function(done) {
      setupForRetrieval(409);
      storage.removeItem(namespace, function(err) {
        err.should.contain('BADCREDENTIALS');
        return done();
      });
    });

    it('should be able handle other error', function(done) {
      setupForRetrieval(510);
      storage.removeItem(namespace, function(err) {
        err.should.contain('Unable');
        return done();
      });
    });
  });




  var setupForSave = function(code) {
    requestMock.post.onFirstCall().callsArgWith(1, null, {
      statusCode: code || 200
    });
  };

  it('should be able to overwrite data when using same password', function(done) {
    setupForSave();

    storage.setItem(namespace, data, function(err) {
      assert(!err);
      assert(requestMock.post.firstCall.args[0].url.indexOf('save') !== -1);
      return done();
    });
  });


  it('should handle 406 (quota)', function(done) {
    setupForSave(406);
    storage.setItem(namespace, data, function(err) {
      err.should.contain('OVERQUOTA');
      return done();
    });
  });

  it('should handle other error ', function(done) {
    setupForSave(505);
    storage.setItem(namespace, data, function(err) {
      err.should.contain('Unable');
      return done();
    });
  });

  it('should handle 409 (unauthorized)', function(done) {
    setupForSave(409);

    storage.setItem(namespace, data, function(err) {
      err.should.contain('BADCREDENTIALS');
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
    requestMock.get.onFirstCall().callsArgWith(1, null, {
      statusCode: 403
    });
    requestMock.get.onSecondCall().callsArgWith(1, null, {
      statusCode: 200,
      getAllResponseHeaders: sinon.stub(),
    }, data);
    requestMock.post = sinon.stub();
    requestMock.post.onFirstCall().callsArgWith(1, null, {
      statusCode: 200,
      getAllResponseHeaders: sinon.stub(),
    });
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
        url.indexOf('change_passphrase').should.not.be.equal(-1);
        requestMock.post.firstCall.args[0].headers.Authorization.should.be.equal(new Buffer(email + ':' + oldSecret).toString('base64'));
        args.newPassphrase.should.be.equal(newSecret);
        done();
      });
    }
  );
});
