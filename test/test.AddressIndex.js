'use strict';

var chai = chai || require('chai');
var should = chai.should();
var bitcore = bitcore || require('bitcore');
var Address = bitcore.Address;
var buffertools = bitcore.buffertools;
try {
  var copay = require('copay'); //browser
} catch (e) {
  var copay = require('../copay'); //node
}
var PublicKeyRing = copay.PublicKeyRing;
var AddressIndex = copay.AddressIndex;


var config = {
  networkName: 'livenet',
};

var createAI = function() {
  var i = new AddressIndex();
  should.exist(i);

  i.walletId = '1234567';
  i.cosigner = 1;

  return i;
};

describe('AddressIndex model', function() {

  it('should create an instance (livenet)', function() {
    var i = new AddressIndex();
    should.exist(i);
  });

  it('show be able to store and read', function() {
    var i = createAI();
    var changeN = 2;
    var addressN = 2;
    for (var j = 0; j < changeN; j++) {
      i.increment(true);
    }
    for (var j = 0; j < addressN; j++) {
      i.increment(false);
    }

    var data = i.toObj();
    should.exist(data);

    var i2 = AddressIndex.fromObj(data);
    i2.walletId.should.equal(i.walletId);
    i2.cosigner.should.equal(i.cosigner);

    i2.getChangeIndex().should.equal(changeN);
    i2.getReceiveIndex().should.equal(addressN);
  });

  it('should count generation indexes', function() {
    var j = createAI();
    for (var i = 0; i < 3; i++)
      j.increment(true);
    for (var i = 0; i < 2; i++)
      j.increment(false);

    j.changeIndex.should.equal(3);
    j.receiveIndex.should.equal(2);
  });

  it('#merge tests', function() {
    var j = createAI();

    for (var i = 0; i < 15; i++)
      j.increment(true);
    for (var i = 0; i < 7; i++)
      j.increment(false);
    var j2 = new AddressIndex({
      walletId: j.walletId,
      cosigner: j.cosigner,
    });
    j2.merge(j).should.equal(true);
    j2.changeIndex.should.equal(15);
    j2.receiveIndex.should.equal(7);

    j2.merge(j).should.equal(false);
  });

  it('#merge should fail with different walletId', function() {
    var j1 = new AddressIndex({ walletId: '1234' });
    var j2 = new AddressIndex({ walletId: '4321' });

    var merge = function() { j2.merge(j1); };
    merge.should.throw(Error);
  })

  it('#merge should fail with different cosigner index', function() {
    var j1 = new AddressIndex({ walletId: '1234', cosigner: 2 });
    var j2 = new AddressIndex({ walletId: '1234', cosigner: 3 });

    var merge = function() { j2.merge(j1); };
    merge.should.throw(Error);
  })

});
