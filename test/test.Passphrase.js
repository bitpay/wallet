'use strict';

var chai = chai || require('chai');
var should = chai.should();
var bitcore = bitcore || require('bitcore');
var buffertools = bitcore.buffertools;
var copay = require('../copay');
var Passphrase = copay.Passphrase;



describe('Passphrase model', function() {

  it('should create an instance', function() {
    var p = new Passphrase();
    should.exist(p);
  });

});
