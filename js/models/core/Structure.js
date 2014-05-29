'use strict';


var imports     = require('soop').imports();

function Structure() {
}


/*
 * Based on https://github.com/maraoz/bips/blob/master/bip-NNNN.mediawiki
 * m / purpose' / cosigner_index / change / address_index 
 */
var PURPOSE = 45;
var MAX_NON_HARDENED = 0x8000000 - 1;

var SHARED_INDEX = MAX_NON_HARDENED - 0;
var ID_INDEX = MAX_NON_HARDENED - 1;

var BIP45_PUBLIC_PREFIX = 'm/'+ PURPOSE+'\'';
Structure.BIP45_PUBLIC_PREFIX = BIP45_PUBLIC_PREFIX;

Structure.Branch = function(address_index, isChange, cosigner_index) {
  var ret = 'm/'+
    (typeof cosigner_index !== 'undefined'? cosigner_index: SHARED_INDEX)+'/'+
    (isChange?1:0)+'/'+
    address_index;
  return ret;
};

Structure.FullBranch = function(address_index, isChange, cosigner_index) {
  var sub = Structure.Branch(address_index, isChange, cosigner_index);
  sub = sub.substring(2);
  return BIP45_PUBLIC_PREFIX + '/' + sub;
};
Structure.IdFullBranch = Structure.FullBranch(0, 0, ID_INDEX);
Structure.IdBranch = Structure.Branch(0, 0, ID_INDEX);


module.exports = require('soop')(Structure);
