'use strict';

var _ = require('lodash');
var chai = chai || require('chai');
var sinon = sinon || require('sinon');
var should = chai.should();
var httpUtils = require('../js/util/HTTP');
describe('http utils', function() {

  var xhr;
  beforeEach(function() {
    xhr = {
      open: sinon.stub(),
      getAllResponseHeaders: sinon.stub().returns('Content-type: xx'),
      setRequestHeader: sinon.stub().returns(),
      send: function() {
        var self = this;
        setTimeout(function() {
          self.response = [1,2,3,4];
          self.error ? self.onerror() : self.onload();
        }, 10);
      },
    };
  });

  it('should get success', function(done) {
    xhr.error = 0;
    httpUtils.request({
      xhr: xhr,
      method: 'GET',
      url: 'http://test'
    }).success(function(data, status) {
      done();
    }).error(function(data, status) {
      throw new Error();
    });
  });
  it('should get error', function(done) {
    xhr.error = 1;
    httpUtils.request({
      xhr: xhr,
      method: 'GET',
      url: 'http://test',
    }).success(function(data, status) {
      throw new Error();
    }).error(function(data, status) {
      done();
    });
  });

  it('should get with headers', function(done) {
    xhr.error = 0;
    httpUtils.request({
      xhr: xhr,
      method: 'GET',
      url: 'http://test',
      headers: {
        'Content-Transfer-Encoding': 'a',
        'Content-Length': 1,
        'X-test': 2,
      }
    }).success(function(data, status) {
      done();
    });
  });
  it('should get with body', function(done) {
    xhr.error = 0;
    httpUtils.request({
      xhr: xhr,
      method: 'GET',
      url: 'http://test',
      body: 'hola',
      responseType: 'type',
    }).success(function(data, status) {
      done();
    });
  });
  it('should get with default error', function(done) {
    xhr.error = 1;
    var ret = httpUtils.request({
      xhr: xhr,
      method: 'GET',
      url: 'http://test',
    }).error(function(){
      done();
    })
  });

});
