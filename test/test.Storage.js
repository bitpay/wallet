'use strict';
var chai = chai || require('chai');
var should = chai.should();
var is_browser = typeof process == 'undefined' || typeof process.versions === 'undefined';
var copay = copay || require('../copay');
var Storage = copay.Storage;

var fakeWallet = 'fake-wallet-id';
var timeStamp = Date.now();
var localMock = require('./mocks/FakeLocalStorage');
var sessionMock = require('./mocks/FakeLocalStorage');


describe('Storage model', function() {
  var s = new Storage({
    storage: localMock,
    sessionStorage: sessionMock,
  });
  s._setPassphrase('mysupercoolpassword');

  it('should create an instance', function() {
    var s2 = new Storage({
      storage: localMock,
      sessionStorage: sessionMock,
    });
    should.exist(s2);
  });
  it('should fail when encrypting without a password', function() {

    var s2 = new Storage({
      storage: localMock,
      sessionStorage: sessionMock,
    });
    (function() {
      s2.set(fakeWallet, timeStamp, 1, function() {});
    }).should.throw('NOPASSPHRASE');
  });
  it('should be able to encrypt and decrypt', function(done) {
    s._write(fakeWallet + timeStamp, 'value', function() {
      s._read(fakeWallet + timeStamp, function(v) {
        v.should.equal('value');
        localMock.removeItem(fakeWallet + timeStamp, done);
      });
    });
  });
  it('should be able to set a value', function(done) {
    s.set(fakeWallet, timeStamp, 1, function() {
      localMock.removeItem(fakeWallet + '::' + timeStamp, done);
    });
  });
  var getSetData = [
    1, 1000, -15, -1000,
    0.1, -0.5, -0.5e-10, Math.PI,
    'hi', 'auydoaiusyodaisudyoa', '0b5b8556a0c2ce828c9ccfa58b3dd0a1ae879b9b',
    '1CjPR7Z5ZSyWk6WtXvSFgkptmpoi4UM9BC', 'OP_DUP OP_HASH160 80ad90d4035', [1, 2, 3, 4, 5, 6], {
      x: 1,
      y: 2
    }, {
      x: 'hi',
      y: null
    }, {
      a: {},
      b: [],
      c: [1, 2, 'hi']
    },
    null
  ];
  getSetData.forEach(function(obj) {
    it('should be able to set a value and get it for ' + JSON.stringify(obj), function(done) {
      s.set(fakeWallet, timeStamp, obj, function() {
        s.get(fakeWallet, timeStamp, function(obj2) {
          JSON.stringify(obj2).should.equal(JSON.stringify(obj));
          localMock.removeItem(fakeWallet + '::' + timeStamp, done);
        });
      });
    });
  });

  describe('#export', function() {
    it('should export the encrypted wallet', function(done) {
      var storage = new Storage({
        storage: localMock,
        sessionStorage: sessionMock,
        password: 'password',
      });
      storage.set(fakeWallet, timeStamp, 'testval', function() {
        var obj = {
          test: 'testval'
        };
        var encrypted = storage.export(obj);
        encrypted.length.should.be.greaterThan(10);
        localMock.removeItem(fakeWallet + '::' + timeStamp, done);
      });
    });
  });

  describe('#remove', function() {
    it('should remove an item', function(done) {
      var s = new Storage({
        storage: localMock,
        sessionStorage: sessionMock,
        password: 'password'
      });
      s.set('1', "hola", 'juan', function() {
        s.get('1', 'hola', function(v) {
          v.should.equal('juan');
          s.remove('1', 'hola', function() {
            s.get('1', 'hola', function(v) {
              should.not.exist(v);
              done();
            });
          });
        })
      })
    });
  });


  describe('#getWalletIds', function() {
    it('should get wallet ids', function(done) {
      var s = new Storage({
        storage: localMock,
        sessionStorage: sessionMock,
        password: 'password'
      });
      s.set('1', "hola", 'juan', function() {
        s.set('2', "hola", 'juan', function() {
          s.getWalletIds(function(v) {
            v.should.deep.equal(['1', '2']);
            done();
          });
        });
      });
    });
  });

  describe('#getName #setName', function() {
    it('should get/set names', function(done) {
      var s = new Storage({
        storage: localMock,
        sessionStorage: sessionMock,
        password: 'password'
      });
      s.setName(1, 'hola', function() {
        s.getName(1, function(v) {
          v.should.equal('hola');
          done();
        });
      });
    });
  });

  describe('#getLastOpened #setLastOpened', function() {
    it('should get/set last opened', function() {
      var s = new Storage({
        storage: localMock,
        sessionStorage: sessionMock,
        password: 'password'
      });
      s.setLastOpened('hey', function() {
        s.getLastOpened(function(v) {
          v.should.equal('hey');
        });
      });
    });
  });

  if (is_browser) {
    describe('#getSessionId', function() {
      it('should get SessionId', function(done) {
        var s = new Storage({
          storage: localMock,
          sessionStorage: sessionMock,
          password: 'password'
        });
        s.getSessionId(function(sid) {
          should.exist(sid);
          s.getSessionId(function(sid2) {
            sid2.should.equal(sid);
            done();
          });
        });
      });
    });
  }

  describe('#getWallets', function() {
    it('should retreive wallets from storage', function(done) {
      var s = new Storage({
        storage: localMock,
        sessionStorage: sessionMock,
        password: 'password'
      });
      s.set('1', "hola", 'juan', function() {
        s.set('2', "hola", 'juan', function() {
          s.setName(1, 'hola', function() {
            s.getWallets(function(ws) {
              ws[0].should.deep.equal({
                id: '1',
                name: 'hola',
              });
              ws[1].should.deep.equal({
                id: '2',
                name: undefined
              });
              done();
            });
          });
        });
      });
    });
  });
  describe('#deleteWallet', function(done) {
    it('should delete a wallet', function() {
      var s = new Storage({
        storage: localMock,
        sessionStorage: sessionMock,
        password: 'password'
      });
      s.set('1', "hola", 'juan', function() {
        s.set('2', "hola", 'juan', function() {
          s.deleteWallet('1', function() {
            s.getWallets(function(ws) {
              s.getWallets().length.should.equal(1);
              ws[0].should.deep.equal({
                id: '2',
                name: undefined
              });
              done();
            });
          });
        });
      });
    });
  });

  describe('#setFromObj', function() {
    it('set localstorage from an object', function(done) {
      var s = new Storage({
        storage: localMock,
        sessionStorage: sessionMock,
        password: 'password'
      });
      s.setFromObj('id1', {
        'key': 'val',
        'opts': {
          'name': 'nameid1'
        },
      }, function() {
        s.get('id1', 'key', function(v) {
          v.should.equal('val');
          done();
        });
      });
    });
  });


  describe('#globals', function() {
    it('should set, get and remove keys', function(done) {
      var s = new Storage({
        storage: localMock,
        sessionStorage: sessionMock,
        password: 'password'
      });

      s.setGlobal('a', {
        b: 1
      }, function() {
        s.getGlobal('a', function(v) {

          JSON.parse(v).should.deep.equal({
            b: 1
          });
          s.removeGlobal('a', function() {
            s.getGlobal('a', function(v) {
              should.not.exist(v);
              done();
            });
          });
        });
      });
    });
  });


  describe('session storage', function() {
    it('should get a session ID', function(done) {
      var s = new Storage({
        storage: localMock,
        sessionStorage: sessionMock,
        password: 'password'
      });
      s.getSessionId(function(s) {
        should.exist(s);
        s.length.should.equal(16);
        (new Buffer(s, 'hex')).length.should.equal(8);
        done();
      });
    });
  });
});
