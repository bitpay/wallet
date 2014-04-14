'use strict';

if (!process.version)  {
  var chai     = chai || require('chai');
  var should   = chai.should();
  var copay    = copay || require('../copay');
  var Plain    = copay.Storage;

  describe('Storage model', function() {

    it('should create an instance', function () {
      var s = new Storage();
      should.exist(s);
    });
  });
}
