var LocalStorage = require('../js/plugins/LocalStorage');
var assert = require('assert');

describe('local storage plugin', function() {

  var storage, storageMock, VALUE=123;

  beforeEach(function() {
    storageMock = {};
    storageMock.getItem = sinon.stub().returns(VALUE);
    storageMock.createItem = sinon.stub().returns();
    storageMock.setItem = sinon.stub().returns();
    storageMock.removeItem = sinon.stub().returns();
    storageMock.clear = sinon.stub().returns();
    storage = new LocalStorage({
      ls: storageMock
    });
  });

  it('#getItem', function(done) {
    storage.getItem('hola', function(err, value) {
      assert(!err);
      storageMock.getItem.getCall(0).args[0].should.equal('hola');
      value.should.equal(VALUE);
      return done();
    });
  });

  it('#createItem', function(done) {
    storageMock.getItem = sinon.stub().returns(null);
    storage.createItem('hola', 'value', function(err) {
      assert(!err);
      return done();
    });
  });

  it('#createItem (Exists)', function(done) {
    storage.createItem('hola', 'value', function(err) {
      err.should.contain('EEXISTS');
      return done();
    });
  });



  it('#removeItem', function(done) {
    storage.removeItem('pepe', function(err) {
      assert(!err);
      storageMock.removeItem.getCall(0).args[0].should.equal('pepe');
      return done();
    });
  });

  it('#setItem', function(done) {
    storage.setItem('hola', 'chau', function(err) {
      assert(!err);
      storageMock.setItem.getCall(0).args[0].should.equal('hola');
      storageMock.setItem.getCall(0).args[1].should.equal('chau');
      return done();
    });
  });

  it('#clear', function(done) {
    storage.clear(function(err) {
      assert(!err);
      storageMock.clear.calledOnce.should.be.false;
      return done();
    });
  });



});
