'use strict';

if (typeof process === 'undefined' || !process.version) {
  // browser
  var chai = chai || require('chai');
  var should = chai.should();
  var copay = copay || require('../copay');
  var LocalEncrypted = copay.StorageLocalEncrypted;

  describe('Storage/LocalEncrypted model', function() {
    var wid = 'fake-wallet-id';
    var s = new LocalEncrypted();
    s._setPassphrase('mysupercoolpassword');

    it('should create an instance', function() {
      var s = new LocalEncrypted();
      should.exist(s);
    });
    it('should fail when encrypting without a password', function() {
      var s = new LocalEncrypted();
      (function(){s.set(wid, 'x', 1);}).should.throw();
    });
    it('should be able to encrypt and decrypt', function() {
      s._write('key', 'value');
      s._read('key').should.equal('value');
    });
    it('should be able to set a value', function() {
      s.set(wid, 'x', 1);
    });
    var getSetData = [
      1,1000,-15, -1000,
      0.1, -0.5, -0.5e-10, Math.PI,
      'hi', 'auydoaiusyodaisudyoa', '0b5b8556a0c2ce828c9ccfa58b3dd0a1ae879b9b',
      '1CjPR7Z5ZSyWk6WtXvSFgkptmpoi4UM9BC', 'OP_DUP OP_HASH160 80ad90d4035',
      [1,2,3,4,5,6],
      { x: 1, y: 2},
      { x: 'hi', y: null},
      { a: {}, b: [], c: [1,2,'hi']},
      null
    ];
    getSetData.forEach(function(obj) {
      it('should be able to set a value and get it for '+JSON.stringify(obj), function() {
        s.set(wid, 'x', obj);
        var obj2 = s.get(wid, 'x');
        JSON.stringify(obj2).should.equal(JSON.stringify(obj));
      });
    });

    describe('#getEncryptedObj', function() {
      it('should encrypt the wallet', function() {
        localStorage.clear();
        var storage = new LocalEncrypted({password: 'password'});
        storage.set('walletId', 'test', 'testval');
        var obj = {test:'testval'};
        var encrypted = storage.getEncryptedObj('walletId');
        encrypted.length.should.equal(96);
        encrypted.slice(0,6).should.equal("53616c");
      });
    });
  });
}
