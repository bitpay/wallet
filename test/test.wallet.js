'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var bitcore        = bitcore || require('bitcore');
var copay          = copay || require('../copay');
var Wallet         = copay.Wallet || require('./js/models/core/Wallet');


var config = {
  wallet: {
    requiredCopayers: 3,
    totalCopayers: 5,
  }
};

describe('Wallet model', function() {

  it('should create an instance', function () {
    var opts = {};
    var w = new Wallet(config, opts);
    should.exist(w);
  });
});
  
