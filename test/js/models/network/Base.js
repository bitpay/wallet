var imports = require('soop').imports();
var EventEmitter = imports.EventEmitter || require('events').EventEmitter;

/*
 * Emits
 *  'networkChange'
 *    when network layout has change (new/lost peers, etc)
 *
 *  'data'
 *    when an unknown data type arrives
 *
 * Provides
 *  send(toPeerIds, {data}, cb?)
 *
 */

function Network(opts) {
  // TODO
}

Network.parent = EventEmitter;
// Allows subscribing to the following events:
//  Network#on('networkChange', listener);
//  Network#on('data', listener);
Network.prototype.start = function(callback) {
  // TODO
};

Network.prototype.send = function(peerIds, data, cb) {
  // TODO
};

Network.prototype.connectTo = function(peerId, openCallback, closeCallback) {
  // TODO
};

Network.prototype.disconnect = function(peerId, cb) {
  // TODO
};

module.exports = require('soop')(Network);
