
var imports     = require('soop').imports();
var EventEmitter= imports.EventEmitter || require('events').EventEmitter;

function Network(opts) {
}

Network.parent=EventEmitter;

Network.prototype.start = function(openCallback, opts) {
  // start! :D
};

Network.prototype.send = function(peerIds, data, cb) {
  // send! c:
};

Network.prototype.connectTo = function(peerId) {
  // connect C:
};


Network.prototype.disconnect = function(cb) {
  // disconect :c
};

module.exports = require('soop')(Network);
