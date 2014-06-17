'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var bitcore        = bitcore || require('bitcore');
try {
  var copay = require('copay'); //browser
} catch (e) {
  var copay = require('../copay'); //node
}
var Structure      = require('../js/models/core/Structure');

describe('Structure model', function() {
  it('should have the correct constants', function () {
    Structure.MAX_NON_HARDENED.should.equal(Math.pow(2,31) - 1);
    Structure.SHARED_INDEX.should.equal(Structure.MAX_NON_HARDENED);
    Structure.ID_INDEX.should.equal(Structure.SHARED_INDEX - 1);
    Structure.IdFullBranch.should.equal('m/45\'/2147483646/0/0');
  });

  it('should get the correct branches', function () {
    // shared branch (no cosigner index specified)
    Structure.FullBranch(0,false).should.equal('m/45\'/2147483647/0/0');

    // copayer 0, address 0, external address (receiving)
    Structure.FullBranch(0,false,0).should.equal('m/45\'/0/0/0');

    // copayer 0, address 10, external address (receiving)
    Structure.FullBranch(0,false,10).should.equal('m/45\'/10/0/0');

    // copayer 0, address 0, internal address (change)
    Structure.FullBranch(0,true,0).should.equal('m/45\'/0/1/0');

    // copayer 0, address 10, internal address (change)
    Structure.FullBranch(10,true,0).should.equal('m/45\'/0/1/10');

    // copayer 7, address 10, internal address (change)
    Structure.FullBranch(10,true,7).should.equal('m/45\'/7/1/10');
  });

});
