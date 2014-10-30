global.chai = require('chai');
global.sinon = require('sinon');
global.bitcore = require('bitcore');
global.expect = global.chai.expect;
global.bignum = global.bitcore.Bignum;
global.should = global.chai.should();

global.copay = require('../copay');
global.copayConfig = require('../config');

global.requireMock = function(name) {
  return require('../test/mocks/' + name);
}

global.is_browser = typeof process == 'undefined' || typeof process.versions === 'undefined';
global._ = require('lodash');
