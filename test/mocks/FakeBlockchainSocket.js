'use strict';

var EventEmitter = require('events').EventEmitter;

var FakeSocket = function (url, opts) {
  var self = this;

  self.connected = false;
  setTimeout(function() {
    self.connected = true;
    self.emit('connect');
  }, 0);
}

var inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

inherits(FakeSocket, EventEmitter);

FakeSocket.prototype.removeListener = function() {
  return;
}



FakeSocket.prototype.destroy = function() {
  this.connected = false;
  this.removeAllListeners();
};


FakeSocket.prototype.disconnect = function() {
  this.destroy();
};

module.exports = FakeSocket;
