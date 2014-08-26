var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Network(opts) {}

util.inherits(Network, EventEmitter);

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

//hex version of one's own nonce
Network.prototype.setHexNonce = function(networkNonce) {
  if (networkNonce && networkNonce.length === 16)
    this.networkNonce = new Buffer(networkNonce, 'hex');
  else
    this.iterateNonce();
};

//hex version of copayers' nonces
Network.prototype.setHexNonces = function(networkNonces) {
  for (var i in networkNonces) {
    if (!this.networkNonces)
      this.networkNonces = {};
    if (networkNonces[i].length === 16)
      this.networkNonces[i] = new Buffer(networkNonces[i], 'hex');
  }
};

//for oneself
Network.prototype.getHexNonce = function() {
  return this.networkNonce.toString('hex');
};

//for copayers
Network.prototype.getHexNonces = function() {
  var networkNoncesHex = [];
  for (var i in this.networkNonces) {
    networkNoncesHex = this.networkNonces[i].toString('hex');
  }
  return networkNoncesHex;
};

Network.prototype.iterateNonce = function() {
  if (!this.networkNonce || this.networkNonce.length !== 8) {
    this.networkNonce = new Buffer(8);
    this.networkNonce.fill(0);
    this.networkNonce[7] = 1;
    return this.networkNonce;
  }
  //the first 4 bytes of a nonce is a unix timestamp in seconds
  //the second 4 bytes is just an iterated "sub" nonce
  //the whole thing is interpreted as one big endian number
  var noncep1 = this.networkNonce.slice(0, 4);
  noncep1.writeUInt32BE(Math.floor(Date.now() / 1000), 0);
  var noncep2uint = this.networkNonce.slice(4, 8).readUInt32BE(0);
  var noncep2 = this.networkNonce.slice(4, 8);
  noncep2.writeUInt32BE(noncep2uint + 1, 0);
  return this.networkNonce;
};


Network.prototype.cleanUp = function() {
  return;
};


module.exports = Network;
