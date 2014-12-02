'use strict';

var _ = require('lodash');
var chai = chai || require('chai');
var sinon = sinon || require('sinon');
var should = chai.should();
var log = require('../js/util/log');

describe('log utils', function() {
  afterEach(function() {
    log.setLevel('info');
  });

  it('should log fatal', function() {
    if (console.warn.restore)
      console.warn.restore();

    sinon.stub(console,'warn');

    log.setLevel('debug');
    log.warn('hola');

    var arg = console.warn.getCall(0).args[0];
    arg.should.contain('util.log.js');
    arg.should.contain('hola');
    console.warn.restore();
  });

  it('should not log debug', function() {
    sinon.stub(console,'log');
    log.setLevel('info');
    log.debug('hola');
    console.log.called.should.equal(false);
    console.log.restore();
  });

  it('should log debug', function() {
    log.getLevels().debug.should.equal(0);
    log.getLevels().fatal.should.equal(5);
  });
});
