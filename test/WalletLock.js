'use strict';

var WalletLock = copay.WalletLock;
var PrivateKey = copay.PrivateKey;
var Storage = copay.Storage;


var storage;
describe('WalletLock model', function() {

  beforeEach(function() {
    storage = new Storage(requireMock('FakeLocalStorage').storageParams);
    storage.setPassphrase('mysupercoolpassword');
    storage.clearAll();
  });

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


  it('should generate a sessionId with init', function(done) {
    var w = new WalletLock(storage, 'id');
    var spy = sinon.spy(storage, 'getSessionId');
    w.init(function() {
      spy.calledOnce.should.equal(true);
      done();
    });
  });

  it('#keepAlive should call getsessionId if not called before', function(done) {
    var w = new WalletLock(storage, 'id');
    var spy = sinon.spy(storage, 'getSessionId');
    w.keepAlive(function() {
      spy.calledOnce.should.equal(true);
      done();
    });
  });

  it('should NOT fail if locked already by me', function(done) {
    var w = new WalletLock(storage, 'walletId2');
    w.keepAlive(function() {
      var w2 = new WalletLock(storage, 'walletId2');
      w2.init(function() {
        w2.keepAlive(function() {
          w.sessionId.should.equal(w2.sessionId);
          should.exist(w2);
          done();
        });
      });
    })
  });

  it('should FAIL if locked by someone else', function(done) {
    var w = new WalletLock(storage, 'walletId');
    w.keepAlive(function() {
      storage.setSessionId('session2', function() {
        var w2 = new WalletLock(storage, 'walletId');
        w2.keepAlive(function(locked) {
          should.exist(locked);
          locked.message.should.contain('LOCKED');
          done();
        });
      });
    });
  })

  it('should FAIL if locked by someone else but expired', function(done) {
    var w = new WalletLock(storage, 'walletId');
    w.keepAlive(function() {
      storage.setSessionId('session2', function() {

        var json = JSON.parse(storage.db.ls['lock::walletId']);
        json.expireTs -= 3600 * 1000;
        storage.db.ls['lock::walletId'] = JSON.stringify(json);
        var w2 = new WalletLock(storage, 'walletId');
        w2.keepAlive(function(locked) {
          w2.sessionId.should.equal('session2');
          should.not.exist(locked);
          done();
        });
      });
    });
  })
});
