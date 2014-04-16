'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var Storage        = Storage || require('../js/models/storage/File.js');
var sinon          = sinon || require('sinon');

describe('Storage/File', function() {
  it('should exist', function() {
    should.exist(Storage);
  });

  describe('#load', function(done) {
    it('should call fs.readFile', function(done) {
      var fs = {}
      fs.readFile = function(filename, callback) {
        filename.should.equal('myfilename');
        callback();
      };
      var Storage = require('soop').load('../js/models/storage/File.js', {fs: fs});
      var storage = new Storage({password: 'password'});
      storage.load('myfilename', function(err) {
        done();
      });
    });
  });

  describe('#save', function(done) {
    it('should call fs.writeFile', function(done) {
      var fs = {}
      fs.writeFile = function(filename, data, callback) {
        filename.should.equal('myfilename');
        callback();
      };
      var Storage = require('soop').load('../js/models/storage/File.js', {fs: fs});
      var storage = new Storage({password: 'password'});
      storage.save('myfilename', function(err) {
        done();
      });
    });
  });

  describe('#_read', function() {
    it('should return the value of a key', function() {
      var storage = new Storage();
      storage.data = {'walletId':{'test':'data'}};
      storage._read('walletId::test').should.equal('data');
    });
  });

  describe('#_write', function() {
    it('should save the value of a key and then run save', function(done) {
      var storage = new Storage();
      storage.save = function(walletId, callback) {
        storage.data[walletId]['key'].should.equal('value');
        callback();
      };
      storage._write('walletId::key', 'value', function() {
        done();
      });
    });
  });

  describe('#getGlobal', function() {
    it('should call storage._read', function() {
      var storage = new Storage();
      storage.data = {'walletId':{'test':'test'}};
      storage._read = sinon.spy();
      storage.getGlobal('walletId::test');
      storage._read.calledOnce.should.equal(true);
    });
  });

  describe('#setGlobal', function() {
    it('should store a global key', function(done) {
      var storage = new Storage();
      storage.save = function(walletId, callback) {
        storage.data[walletId]['key'].should.equal('value');
        callback();
      };
      storage.setGlobal('walletId::key', 'value', function() {
        done();
      });
    });
  });

  describe('#removeGlobal', function() {
    it('should remove a global key', function(done) {
      var storage = new Storage();
      storage.data = {'walletId':{'key':'value'}};
      storage.save = function(walletId, callback) {
        should.not.exist(storage.data[walletId]['key']);
        callback();
      };
      storage.removeGlobal('walletId::key', function() {
        done();
      });
    });
  });

  describe('#_key', function() {
    it('should merge the wallet id and item key', function() {
      var storage = new Storage();
      storage._key('wallet', 'key').should.equal('wallet::key');
    });
  });

  describe('#get', function() {
    it('should call getGlobal with the correct key', function() {
      var storage = new Storage();
      storage.getGlobal = sinon.spy();
      storage.get('wallet', 'key');
      storage.getGlobal.calledOnce.should.equal(true);
      storage.getGlobal.calledWith('wallet::key').should.equal(true);
    });
  });

  describe('#set', function() {
    it('should call setGlobal with the correct key', function() {
      var storage = new Storage();
      storage.setGlobal = sinon.spy();
      storage.set('wallet', 'key');
      storage.setGlobal.calledOnce.should.equal(true);
      storage.setGlobal.calledWith('wallet::key').should.equal(true);
    });
  });

  describe('#remove', function() {
    it('should call removeGlobal with the correct key', function() {
      var storage = new Storage();
      storage.removeGlobal = sinon.spy();
      storage.remove('wallet', 'key');
      storage.removeGlobal.calledOnce.should.equal(true);
      storage.removeGlobal.calledWith('wallet::key').should.equal(true);
    });
  });

  describe('#clearAll', function() {
    it('should set data to {}', function() {
      
    });
  });

});
