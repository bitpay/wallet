if (!!window) {
  window.bitcore = require('bitcore');
  window.expect = chai.expect;
  window.bignum = bitcore.Bignum;
  window.should = chai.should();

  window.copay = require('copay');
  window.copayConfig = require('../config');

  window.requireMock = function(name) {
    return require('./mocks/' + name);
  }

  window.is_browser = true;
  window._ = require('lodash');
}
