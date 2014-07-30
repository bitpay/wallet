'use strict';

var preconditions = require('preconditions').singleton();

function HDPath() {}

/*
 * Based on https://github.com/maraoz/bips/blob/master/bip-NNNN.mediawiki
 * m / purpose' / copayerIndex / change / addressIndex
 */
var PURPOSE = 45;
var MAX_NON_HARDENED = 0x80000000 - 1;

var SHARED_INDEX = MAX_NON_HARDENED - 0;
var ID_INDEX = MAX_NON_HARDENED - 1;

var BIP45_PUBLIC_PREFIX = 'm/' + PURPOSE + '\'';
HDPath.BIP45_PUBLIC_PREFIX = BIP45_PUBLIC_PREFIX;

HDPath.Branch = function(addressIndex, isChange, copayerIndex) {
  preconditions.shouldBeNumber(addressIndex);
  preconditions.shouldBeBoolean(isChange);
  var ret = 'm/' +
    (typeof copayerIndex !== 'undefined' ? copayerIndex : SHARED_INDEX) + '/' +
    (isChange ? 1 : 0) + '/' +
    addressIndex;
  return ret;
};

HDPath.FullBranch = function(addressIndex, isChange, copayerIndex) {
  var sub = HDPath.Branch(addressIndex, isChange, copayerIndex);
  sub = sub.substring(2);
  return BIP45_PUBLIC_PREFIX + '/' + sub;
};

HDPath.indexesForPath = function(path) {
  preconditions.shouldBeString(path);
  var s = path.split('/');
  return {
    isChange: s[3] === '1',
    addressIndex: parseInt(s[4]),
    copayerIndex: parseInt(s[2])
  };
};

HDPath.IdFullBranch = HDPath.FullBranch(0, false, ID_INDEX);
HDPath.IdBranch = HDPath.Branch(0, false, ID_INDEX);
HDPath.PURPOSE = PURPOSE;
HDPath.MAX_NON_HARDENED = MAX_NON_HARDENED;
HDPath.SHARED_INDEX = SHARED_INDEX;
HDPath.ID_INDEX = ID_INDEX;

HDPath.parseBitcoinURI = function(uri) {
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
    ret.merchant = data.r;
  }

  return ret;
};

module.exports = HDPath;
