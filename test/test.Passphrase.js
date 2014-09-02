'use strict';

var chai = chai || require('chai');
var should = chai.should();
var bitcore = bitcore || require('bitcore');
var buffertools = bitcore.buffertools;
try {
  var copay = require('copay'); //browser
} catch (e) {
  var copay = require('../copay'); //node
}
var Passphrase = copay.Passphrase;

describe('Passphrase model', function() {

  it('should create an instance', function() {
    var p = new Passphrase();
    should.exist(p);
  });

  it('should generate key from password', function (done) {
  	var p = new Passphrase({
  		salt: 'mjuBtGybi/4=',
  		iterations: 10,
  	});
  	var pass = '123456';
  	var k = p.get(pass);
  	var k64 = p.getBase64(pass);

  	// Note: hashes were generated using CryptoJS
  	k.toString().should.equal('2283fe11b9a189b82f1c09200806920cbdd8ef752f53dea910f90ab526f441acdbd5128555647a7e390a1a9fea042226963ccd0f7851030b3d6e282ccebaa17e');
  	k64.toString().should.equal('IoP+EbmhibgvHAkgCAaSDL3Y73UvU96pEPkKtSb0Qazb1RKFVWR6fjkKGp/qBCImljzND3hRAws9bigszrqhfg==');
  	
  	p.getBase64Async(pass, function (ret) {
	  	ret.toString().should.equal('IoP+EbmhibgvHAkgCAaSDL3Y73UvU96pEPkKtSb0Qazb1RKFVWR6fjkKGp/qBCImljzND3hRAws9bigszrqhfg==');
      done();
  	});
  });

});
