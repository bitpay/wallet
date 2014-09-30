if (!!global) {
  global.chai = require('chai');
  global.sinon = require('sinon');
  global.bitcore = require('bitcore');
  global.expect = global.chai.expect;
  global.bignum = global.bitcore.Bignum;
  global.should = global.chai.should();

  try {
    global.copay = require('copay');
    global.copayConfig = require('config');
  } catch (e) {
    global.copay = require('../copay');
    global.copayConfig = require('../config');
  }

  global.requireMock = function(name) {
    try {
      return require('../mocks/' + name);
    } catch (e) {
      return require('./mocks/' + name);
    }
  }

  global.is_browser = typeof process == 'undefined' || typeof process.versions === 'undefined';
  global._ = require('underscore');
}
