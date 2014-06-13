var imports = require('soop').imports();
var EventEmitter = imports.EventEmitter || require('events').EventEmitter;

function Network(opts) {}

Network.parent = EventEmitter;

Network.prototype.start = function(opts, cb) {
  this.peer = {
    options: {
      token: "asd"
    }
  };
  if (cb) cb();
};

Network.prototype.send = function(peerIds, data, cb) {};

Network.prototype.connectTo = function(peerId) {};


Network.prototype.disconnect = function(cb) {};

Network.prototype.lockIncommingConnections = function() {

};

Network.prototype.getPeer = function() {};
Network.prototype.connectToCopayers = function(cps) {};
Network.prototype.isOnline = function() {
  return true;
};
Network.prototype.peerFromCopayer = function(copayerId) {
  return copayerId;
};

module.exports = require('soop')(Network);
