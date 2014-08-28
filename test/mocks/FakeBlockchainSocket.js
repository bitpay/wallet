'use strict';

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var FakeSocket = function (url, opts) {
  var self = this;

  self.connected = false;
  setTimeout(function() {
    self.connected = true;
    self.emit('connect');
  }, 0);
}

util.inherits(FakeSocket, EventEmitter);

FakeSocket.prototype.removeEventListener = function() {
  return;
}

FakeSocket.prototype.destroy = function() {
  this.connected = false;
  this.removeAllListeners();
};

module.exports = FakeSocket;