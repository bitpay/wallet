'use strict';

var chai     = chai || require('chai');
var should   = chai.should();
var copay    = copay || {};
var Storage  = copay.Storage || require('../js/models/Storage');

describe('Storage model', function() {

  it('should create an instance', function () {
    var s = new Storage();
    should.exist(s);
  });
});
 
