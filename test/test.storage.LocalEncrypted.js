//Crypto Mock
CryptoJS = {};
CryptoJS.AES = {};
CryptoJS.AES.encrypt = function(a) {
  return a;
};

CryptoJS.enc = {
  utf8: ''
};

CryptoJS.AES.decrypt = function(a) {
  return a;
};




'use strict';
var chai = chai || require('chai');
var should = chai.should();
var copay = copay || require('../copay');
var LocalEncrypted = copay.StorageLocalEncrypted;

var fakeWallet = 'fake-wallet-id';
var timeStamp = Date.now();
var localMock = require('./mocks/FakeLocalStorage');


describe('Storage/LocalEncrypted model', function() {
  var s = new LocalEncrypted({
    localStorage: localMock,
  });
  s._setPassphrase('mysupercoolpassword');

  it('should create an instance', function() {
    var s2 = new LocalEncrypted({
      localStorage: localMock,
    });
    should.exist(s2);
  });
  it('should fail when encrypting without a password', function() {
    var s2 = new LocalEncrypted({
      localStorage: localMock,
    });
    (function() {
      s2.set(fakeWallet, timeStamp, 1);
    }).should.throw();
  });
  it('should be able to encrypt and decrypt', function() {
    s._write(fakeWallet + timeStamp, 'value');
    s._read(fakeWallet + timeStamp).should.equal('value');
    localMock.removeItem(fakeWallet + timeStamp);
  });
  it('should be able to set a value', function() {
    s.set(fakeWallet, timeStamp, 1);
    localMock.removeItem(fakeWallet + '::' + timeStamp);
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
    it('should be able to set a value and get it for ' + JSON.stringify(obj), function() {
      s.set(fakeWallet, timeStamp, obj);
      var obj2 = s.get(fakeWallet, timeStamp);
      JSON.stringify(obj2).should.equal(JSON.stringify(obj));
      localMock.removeItem(fakeWallet + '::' + timeStamp);
    });
  });

  describe('#export', function() {
    it('should export the encrypted wallet', function() {
      var storage = new LocalEncrypted({
        localStorage: localMock,
        password: 'password',
      });
      storage.set(fakeWallet, timeStamp, 'testval');
      var obj = {
        test: 'testval'
      };
      var encrypted = storage.export(obj);
      encrypted.length.should.be.greaterThan(10);
      localMock.removeItem(fakeWallet + '::' + timeStamp);
      //encrypted.slice(0,6).should.equal("53616c");
    });
  });
  describe('#_decryptObj', function() {
    it('should decrypt and Obj', function() {
      var storage = new LocalEncrypted({
        password: 'password',
        localStorage: localMock,
      });
      storage._decryptObj('{"a":"2"}').should.deep.equal({
        a: "2"
      });
    });
  });


  describe('#remove', function() {
    it('should remove an item', function() {
      var s = new LocalEncrypted({
        localStorage: localMock,
        password: 'password'
      });
      s.set('1', "hola", 'juan');
      s.get('1', 'hola').should.equal('juan');
      s.remove('1', 'hola');

      should.not.exist(s.get('1', 'hola'));
    });
  });


  describe('#getWalletIds', function() {
    it('should get wallet ids', function() {
      var s = new LocalEncrypted({
        localStorage: localMock,
        password: 'password'
      });
      s.set('1', "hola", 'juan');
      s.set('2', "hola", 'juan');
      s.getWalletIds().should.deep.equal(['1', '2']);
    });
  });

  describe('#getName #setName', function() {
    it('should get/set names', function() {
      var s = new LocalEncrypted({
        localStorage: localMock,
        password: 'password'
      });
      s.setName(1, 'hola');
      s.getName(1).should.equal('hola');
    });
  });

  describe('#getLastOpened #setLastOpened', function() {
    it('should get/set names', function() {
      var s = new LocalEncrypted({
        localStorage: localMock,
        password: 'password'
      });
      s.setLastOpened('hey');
      s.getLastOpened().should.equal('hey');
    });
  });

  describe('#getWallets', function() {
    it('should retreive wallets from storage', function() {
      var s = new LocalEncrypted({
        localStorage: localMock,
        password: 'password'
      });
      s.set('1', "hola", 'juan');
      s.set('2', "hola", 'juan');
      s.setName(1, 'hola');
      s.getWallets()[0].should.deep.equal({
        id: '1',
        name: 'hola',
      });
      s.getWallets()[1].should.deep.equal({
        id: '2',
        name: undefined
      });
    });
  });
  describe('#deleteWallet', function() {
    it('should delete a wallet', function() {
      var s = new LocalEncrypted({
        localStorage: localMock,
        password: 'password'
      });
      s.set('1', "hola", 'juan');
      s.set('2', "hola", 'juan');
      s.setName(1, 'hola');

      s.deleteWallet('1');
      s.getWallets().length.should.equal(1);
      s.getWallets()[0].should.deep.equal({
        id: '2',
        name: undefined
      });
    });
  });

  describe('#setFromObj', function() {
    it('set localstorage from an object', function() {
      var s = new LocalEncrypted({
        localStorage: localMock,
        password: 'password'
      });
      s.setFromObj('id1', {
        'key': 'val',
        'opts': {
          'name': 'nameid1'
        },
      });

      s.get('id1', 'key').should.equal('val');

    });
  });


  describe('#globals', function() {
    it('should set, get and remove keys', function() {
      var s = new LocalEncrypted({
        localStorage: localMock,
        password: 'password'
      });
      s.setGlobal('a', {
        b: 1
      });
      JSON.parse(s.getGlobal('a')).should.deep.equal({
        b: 1
      });
      s.removeGlobal('a');
      should.not.exist(s.getGlobal('a'));
    });
  });
});
