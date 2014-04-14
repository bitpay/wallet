'use strict';

if (typeof process === 'undefined' || !process.version)  {
  // browser
  var chai     = chai || require('chai');
  var should   = chai.should();
  var copay    = copay || require('../copay');
  var Plain    = copay.StoragePlain;

  describe('Storage/Plain model', function() {

    it('should create an instance', function () {
      var s = new Plain();
      should.exist(s);
    });
  });
}
