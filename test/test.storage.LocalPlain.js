'use strict';

if (typeof process === 'undefined' || !process.version) {
  // browser
  var chai = chai || require('chai');
  var should = chai.should();
  var copay = copay || require('../copay');
  var LocalPlain = copay.StorageLocalPlain;

  describe('Storage/LocalPlain model', function() {

    it('should create an instance', function() {
      var s = new LocalPlain();
      should.exist(s);
    });

    describe('#setFromObj', function() {
      it('should set keys from an object', function() {
        var fakeWallet = 'fake-wallet-id';
        var timeStamp = Date.now();

        var obj = {
          test: 'testval',
          opts: {
            name: 'testname'
          }
        };
        var storage = new LocalPlain();
        storage.setFromObj(fakeWallet + timeStamp, obj);
        storage.get(fakeWallet + timeStamp, 'test').should.equal('testval');

        // Clean data used in localstorage
        localStorage.removeItem(fakeWallet + timeStamp + '::test');
        localStorage.removeItem(fakeWallet + timeStamp + '::opts');
        localStorage.removeItem('nameFor::' + fakeWallet + timeStamp);
      });
    });
  });
}
