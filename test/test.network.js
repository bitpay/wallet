'use strict';

var should = chai.should();
describe('Network service', function() {

  var network;
  beforeEach(angular.mock.module('cosign'));

  it('should exist', function() {
    inject(function($injector) {
      network = $injector.get('network');
      should.exist(network);
    });
  });
  it('should return 2', function() {
    network.f().should.equal(2);
  });
  it('should', function() {});
  it('should', function() {});

});
