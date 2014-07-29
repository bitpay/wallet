'use strict';

var preconditions = require('preconditions').singleton();

function Structure() {}

/*
 * Based on https://github.com/maraoz/bips/blob/master/bip-NNNN.mediawiki
 * m / purpose' / copayerIndex / change / addressIndex
 */
var PURPOSE = 45;
var MAX_NON_HARDENED = 0x80000000 - 1;

var SHARED_INDEX = MAX_NON_HARDENED - 0;
var ID_INDEX = MAX_NON_HARDENED - 1;

var BIP45_PUBLIC_PREFIX = 'm/' + PURPOSE + '\'';
Structure.BIP45_PUBLIC_PREFIX = BIP45_PUBLIC_PREFIX;

Structure.Branch = function(addressIndex, isChange, copayerIndex) {
  preconditions.shouldBeNumber(addressIndex);
  preconditions.shouldBeBoolean(isChange);
  var ret = 'm/' +
    (typeof copayerIndex !== 'undefined' ? copayerIndex : SHARED_INDEX) + '/' +
    (isChange ? 1 : 0) + '/' +
    addressIndex;
  return ret;
};

Structure.FullBranch = function(addressIndex, isChange, copayerIndex) {
  var sub = Structure.Branch(addressIndex, isChange, copayerIndex);
  sub = sub.substring(2);
  return BIP45_PUBLIC_PREFIX + '/' + sub;
};

Structure.indicesForPath = function(path) {
  preconditions.shouldBeString(path);
  var s = path.split('/');
  return {
    isChange: s[3] === '1',
    index: parseInt(s[4]),
    cosigner: parseInt(s[2])
  };
};

Structure.IdFullBranch = Structure.FullBranch(0, false, ID_INDEX);
Structure.IdBranch = Structure.Branch(0, false, ID_INDEX);
Structure.PURPOSE = PURPOSE;
Structure.MAX_NON_HARDENED = MAX_NON_HARDENED;
Structure.SHARED_INDEX = SHARED_INDEX;
Structure.ID_INDEX = ID_INDEX;

Structure.parseBitcoinURI = function(uri) {
  var ret = {};
  var data = decodeURIComponent(uri);
  var splitDots = data.split(':');
  ret.protocol = splitDots[0];
  data = splitDots[1];
  var splitQuestion = data.split('?');
  ret.address = splitQuestion[0];

  if (splitQuestion.length > 1) {
    var search = splitQuestion[1];
    data = JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
                      function(key, value) {
                        return key === "" ? value : decodeURIComponent(value);
                      });
                      ret.amount = parseFloat(data.amount);
                      ret.message = data.message;
  }

  return ret;
};

module.exports = Structure;
