'use strict';

if (typeof process === 'undefined' || !process.version) {
  // browser
  var chai = chai || require('chai');
  var should = chai.should();
  var copay = copay || require('../copay');
  var LocalPlain = copay.StorageLocalPlain;

  describe.skip('Storage/LocalPlain model', function() {

    it('should create an instance', function() {
      var s = new LocalPlain();
      should.exist(s);
    });

    describe('#setFromObj', function() {
      it('should set keys from an object', function() {
        localStorage.clear();
        var obj = {
          test: 'testval',
          opts: {
            name: 'testname'
          }
        };
        var storage = new LocalPlain();
        storage.setFromObj('walletId', obj);
        storage.get('walletId', 'test').should.equal('testval');
      });
    });
  });
}
