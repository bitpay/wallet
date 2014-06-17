'use strict';

if (typeof process === 'undefined' || !process.version) {
  // browser
  var chai = chai || require('chai');
  var should = chai.should();
  var copay = copay || require('../copay');
  var LocalEncrypted = copay.StorageLocalEncrypted;

  var fakeWallet = 'fake-wallet-id';
  var timeStamp = Date.now();

  describe('Storage/LocalEncrypted model', function() {
    var s = new LocalEncrypted();
    s._setPassphrase('mysupercoolpassword');

    it('should create an instance', function() {
      var s = new LocalEncrypted();
      should.exist(s);
    });
    it('should fail when encrypting without a password', function() {
      var s = new LocalEncrypted();
      (function(){
        s.set(fakeWallet, timeStamp, 1);
        localStorage.removeItem(fakeWallet +'::'+ timeStamp);
      }).should.throw();
    });
    it('should be able to encrypt and decrypt', function() {
      s._write(fakeWallet+timeStamp, 'value');
      s._read(fakeWallet+timeStamp).should.equal('value');
      localStorage.removeItem(fakeWallet+timeStamp);
    });
    it('should be able to set a value', function() {
      s.set(fakeWallet, timeStamp, 1);
      localStorage.removeItem(fakeWallet +'::'+ timeStamp);
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
        s.set(fakeWallet, timeStamp, obj);
        var obj2 = s.get(fakeWallet, timeStamp);
        JSON.stringify(obj2).should.equal(JSON.stringify(obj));
        localStorage.removeItem(fakeWallet +'::'+ timeStamp);
      });
    });

    describe('#export', function() {
      it('should export the encrypted wallet', function() {
        var storage = new LocalEncrypted({password: 'password'});
        storage.set(fakeWallet, timeStamp, 'testval');
        var obj = {test:'testval'};
        var encrypted = storage.export(obj);
        encrypted.length.should.be.greaterThan(10);
        localStorage.removeItem(fakeWallet +'::'+ timeStamp);
        //encrypted.slice(0,6).should.equal("53616c");
      });
    });

  });
}
