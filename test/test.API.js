'use strict';

var chai           = chai || require('chai');
var should         = chai.should();
var API            = API || require('../API');

describe('API', function() {

  it('should have a command called "echo"', function() {
    var api = new API();
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
    var api = new API();
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

});
