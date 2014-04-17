'use strict';

if (typeof process === 'undefined' || !process.version)  {
  // browser
  var chai     = chai || require('chai');
  var should   = chai.should();
  var copay    = copay || require('../copay');
  var LocalPlain    = copay.StorageLocalPlain;

  describe('Storage/LocalPlain model', function() {

    it('should create an instance', function () {
      var s = new LocalPlain();
      should.exist(s);
    });
  });
}
