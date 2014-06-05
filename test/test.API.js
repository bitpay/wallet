'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var copay          = copay || require('../copay');
var API            = API || copay.API;
var Storage        = Storage || require('../test/mocks/FakeStorage');

var blanket = require("blanket")({
  "pattern": "/js/"
});

describe('API', function() {

  it('should have a command called "echo"', function() {
    
    var api = new API({Storage: Storage});
    should.exist(api.echo);
  });

  it('should have argTypes for every command', function() {
    for (var i in API.prototype) {
      var f = API.prototype[i];
      if (i[0] != '_' && typeof f == 'function') {
        f.argTypes.length.should.be.greaterThan(0);
      }
    };
  })

  it('should throw an error for all commands when called with wrong number of arguments', function() {
    var api = new API({Storage: Storage});
    for (var i in API.prototype) {
      var f = API.prototype[i];
      if (i[0] != '_' && typeof f == 'function') {
        var a = new Array();
        for (var j = 0; j <= f.argTypes.length + 1; j++) {
          a.push(0);
        }
        (function() {
          api[i].apply(api, a);
        }).should.throw();
      }
    };
  });

  it('should have a callback in the arguments on every command', function() {
    for (var i in API.prototype) {
      var f = API.prototype[i];
      if (i[0] != '_' && typeof f == 'function') {
        f.argTypes[f.argTypes.length-1][0].should.equal('callback');
        f.argTypes[f.argTypes.length-1][1].should.equal('function');
      }
    }
  });

  describe('#echo', function() {
    it('should echo a string', function(done) {
      var api = new API({Storage: Storage});
      var str = 'mystr';
      api.echo(str, function(err, result) {
        result.should.equal(str);
        done();
      });
    });
  });

  describe('#echoNumber', function() {
    it('should echo a number', function(done) {
      var api = new API({Storage: Storage});
      var num = 500;
      api.echoNumber(num, function(err, result) {
        result.should.equal(num);
        (typeof result).should.equal('number');
        done();
      });
    });
  });

  describe('#echoObject', function() {
    it('should echo an object', function(done) {
      var api = new API({Storage: Storage});
      var obj = {test:'test'};
      api.echoObject(obj, function(err, result) {
        result.test.should.equal(obj.test);
        (typeof result).should.equal('object');
        done();
      });
    });
  });

  describe('#getArgTypes', function() {
    it('should get the argTypes of echo', function(done) {
      var api = new API({Storage: Storage});
      api.getArgTypes('echo', function(err, result) {
        result[0][1].should.equal('string');
        done();
      });
    });
  });

  describe('#getCommands', function() {
    it('should get all the commands', function(done) {
      var api = new API({Storage: Storage});
      var n = 0;

      for (var i in api)
        if (i[0] != '_' && typeof api[i] == 'function')
          n++;

      api.getCommands(function(err, result) {
        result.length.should.equal(n);
        done();
      });
    });
  });

  describe('#getWallets', function() {
    it('should get the wallet ids', function(done) {
      var api = new API({Storage: Storage});
      api.getWallets(function(err, result) {
        result.length.should.be.greaterThan(-1);
        done();
      });
    });
  });

  describe('#help', function() {
    it('should call _cmd_getCommands', function(done) {
      var api = new API({Storage: Storage});
      api._cmd_getCommands = function(callback) {
        (typeof arguments[0]).should.equal('function');
        callback(null, ['item']);
      }
      api.help(function(err, result) {
        result[0].should.equal('item');
        done();
      });
    });
  });
});
