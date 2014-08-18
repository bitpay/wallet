'use strict';

var EventEmitter = require('events').EventEmitter;
var bitcore = require('bitcore');
var AuthMessage = bitcore.AuthMessage;
var util = bitcore.util;
var nodeUtil = require('util');
var extend = nodeUtil._extend;
var io = require('socket.io-client');
var preconditions = require('preconditions').singleton();

/*
 * Emits
 *  'connect'
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
  var self = this;
  opts = opts || {};
  this.maxPeers = opts.maxPeers || 12;
  this.host = opts.host || 'localhost';
  this.port = opts.port || 3001;
  this.cleanUp();
}

nodeUtil.inherits(Network, EventEmitter);

Network.prototype.cleanUp = function() {
  this.started = false;
  this.connectedPeers = [];
  this.peerId = null;
  this.privkey = null;
  this.key = null;
  this.copayerId = null;
  this.allowedCopayerIds = null;
  this.isInboundPeerAuth = [];
  this.copayerForPeer = {};
  this.connections = {};
  this.criticalErr = '';
  this.closing = 0;
  this.removeAllListeners();
};

Network.parent = EventEmitter;

// Array helpers
Network._arrayDiff = function(a, b) {
  var seen = [];
  var diff = [];

  for (var i = 0; i < b.length; i++)
    seen[b[i]] = true;

  for (var j = 0; j < a.length; j++)
    if (!seen[a[j]])
      diff.push(a[j]);

  return diff;
};

Network._inArray = function(el, array) {
  return array.indexOf(el) > -1;
};

Network._arrayPushOnce = function(el, array) {
  var ret = false;
  if (!Network._inArray(el, array)) {
    array.push(el);
    ret = true;
  }
  return ret;
};

Network._arrayRemove = function(el, array) {
  var pos = array.indexOf(el);
  if (pos >= 0) array.splice(pos, 1);
  return array;
};

Network.prototype.connectedCopayers = function() {
  var ret = [];
  for (var i in this.connectedPeers) {
    var copayerId = this.copayerForPeer[this.connectedPeers[i]];
    if (copayerId) ret.push(copayerId);
  }
  return ret;
};

Network.prototype._sendHello = function(copayerId) {
  this.send(copayerId, {
    type: 'hello',
    copayerId: this.copayerId,
  });
};

Network.prototype._deletePeer = function(peerId) {
  delete this.isInboundPeerAuth[peerId];
  delete this.copayerForPeer[peerId];

  if (this.connections[peerId]) {
    this.connections[peerId].close();
  }
  delete this.connections[peerId];
  this.connectedPeers = Network._arrayRemove(peerId, this.connectedPeers);
};

Network.prototype._addConnectedCopayer = function(copayerId, isInbound) {
  var peerId = this.peerFromCopayer(copayerId);
  this._addCopayerMap(peerId, copayerId);
  Network._arrayPushOnce(peerId, this.connectedPeers);
  this.emit('connect', copayerId);
};

Network.prototype.getKey = function() {
  if (!this.key) {
    var key = new bitcore.Key();
    key.private = new Buffer(this.privkey, 'hex');
    key.regenerateSync();
    this.key = key;
  }
  return this.key;
};

//hex version of one's own nonce
Network.prototype.setHexNonce = function(networkNonce) {
  if (networkNonce) {
    if (networkNonce.length !== 16)
      throw new Error('incorrect length of hex nonce');
    this.networkNonce = new Buffer(networkNonce, 'hex');
  } else
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
    networkNoncesHex[i] = this.networkNonces[i].toString('hex');
  }
  return networkNoncesHex;
};

Network.prototype.iterateNonce = function() {
  if (!this.networkNonce || this.networkNonce.length !== 8) {
    this.networkNonce = new Buffer(8);
    this.networkNonce.fill(0);
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

Network.prototype._onMessage = function(enc) {
  var key = this.getKey();
  var sender = enc.pubkey;
  try {
    var prevnonce = this.networkNonces ? this.networkNonces[sender] : undefined;
    var opts = {
      prevnonce: prevnonce
    };
    var decoded = AuthMessage.decode(key, enc, opts);

    //if no error thrown in the last step, we can set the copayer's nonce
    if (!this.networkNonces)
      this.networkNonces = {};
    this.networkNonces[sender] = decoded.nonce;

    var payload = decoded.payload;
  } catch (e) {
    this._deletePeer(sender);
    return;
  }

  // TODO
  /*
  if (!this.copayerForPeer[sender] || (isInbound && !this.isInboundPeerAuth[sender])) {
    this._deletePeer(sender);
    return;
  }
  */


  console.log('receiving ' + JSON.stringify(payload));

  var self = this;
  switch (payload.type) {
    case 'disconnect':
      this._onClose(sender);
      break;
    case 'hello':
      if (this.allowedCopayerIds && !this.allowedCopayerIds[payload.copayerId]) {
        this._deletePeer(sender);
        return;
      }

      this._addConnectedCopayer(payload.copayerId);
      break;
    default:
      this.emit('data', self.copayerForPeer[sender], payload);
  }
};

Network.prototype._onClose = function(copayerId) {
  // TODO
};

Network.prototype._setupConnectionHandlers = function(cb) {
  preconditions.checkState(this.socket);
  var self = this;

  self.socket.on('connect', function() {
    self.socket.on('disconnect', function() {
      self.cleanUp();
    });
    if (typeof cb === 'function') cb();
  });
  self.socket.on('message', self._onMessage.bind(self));
  self.socket.on('error', self._onError.bind(self));

};

Network.prototype._onError = function(err) {
  console.log('RECV ERROR: ', err);
  console.log(err.stack);
  this.criticalError = err.message;
};

Network.prototype.greet = function(copayerId) {
  this._sendHello(copayerId);
  var peerId = this.peerFromCopayer(copayerId);
  this._addCopayerMap(peerId, copayerId);
};

Network.prototype._addCopayerMap = function(peerId, copayerId) {
  if (!this.copayerForPeer[peerId]) {
    if (Object.keys(this.copayerForPeer).length < this.maxPeers) {
      this.copayerForPeer[peerId] = copayerId;
    }
  }
};

Network.prototype._setInboundPeerAuth = function(peerId) {
  this.isInboundPeerAuth[peerId] = true;
};

Network.prototype.setCopayerId = function(copayerId) {
  if (this.started) {
    throw new Error('network already started: can not change peerId')
  }
  this.copayerId = copayerId;
  this.copayerIdBuf = new Buffer(copayerId, 'hex');
  this.peerId = this.peerFromCopayer(this.copayerId);
  this._addCopayerMap(this.peerId, copayerId);
};


// TODO cache this.
Network.prototype.peerFromCopayer = function(hex) {
  var SIN = bitcore.SIN;
  return new SIN(new Buffer(hex, 'hex')).toString();
};

Network.prototype.start = function(opts, openCallback) {
  opts = opts || {};

  if (this.started) return openCallback();

  if (!this.privkey)
    this.privkey = opts.privkey;

  this.maxPeers = opts.maxPeers || this.maxPeers;

  if (opts.token)
    this.opts.token = opts.token;

  if (!this.copayerId)
    this.setCopayerId(opts.copayerId);

  if (this.connectedPeers.length > 0) {
    // already connected
    return;
  }
  if (this.socket) {
    this.socket.destroy();
    this.socket.removeAllListeners();
  }

  var hostPort = this.host + ':' + this.port;
  this.socket = io.connect(hostPort, {
    reconnection: false,
  });
  this._setupConnectionHandlers(openCallback);
  var pubkey = this.getKey().public.toString('hex');
  this.socket.emit('subscribe', pubkey);
  //this.socket.emit('sync');
  this.started = true;

  //this.emit('serverError', self.criticalError);

};

Network.prototype.getOnlinePeerIDs = function() {
  return this.connectedPeers;
};

Network.prototype.getPeer = function() {
  return this.peer;
};


Network.prototype.getCopayerIds = function() {
  if (this.allowedCopayerIds) {
    return Object.keys(this.allowedCopayerIds);
  } else {
    var copayerIds = [];
    for (var peerId in this.copayerForPeer) {
      copayerIds.push(this.copayerForPeer[peerId]);
    }
    return copayerIds;
  }
};


Network.prototype.send = function(copayerIds, payload, cb) {
  preconditions.checkArgument(payload);

  var self = this;
  if (!copayerIds) {
    copayerIds = this.getCopayerIds();
    payload.isBroadcast = 1;
  }

  if (typeof copayerIds === 'string')
    copayerIds = [copayerIds];

  var l = copayerIds.length;
  var i = 0;
  console.log('sending ' + JSON.stringify(payload));
  copayerIds.forEach(function(copayerId) {
    console.log('\t to ' + copayerId);
    self.iterateNonce();
    var opts = {
      nonce: self.networkNonce
    };
    var copayerIdBuf = new Buffer(copayerId, 'hex');
    var message = AuthMessage.encode(copayerIdBuf, self.getKey(), payload, opts);
    self.socket.emit('message', message);
  });
  if (typeof cb === 'function') cb();
};


Network.prototype.isOnline = function() {
  return !!this.socket;
};


Network.prototype.lockIncommingConnections = function(allowedCopayerIdsArray) {
  this.allowedCopayerIds = {};
  for (var i in allowedCopayerIdsArray) {
    this.allowedCopayerIds[allowedCopayerIdsArray[i]] = true;
  }
};

Network.prototype.disconnect = function(cb, forced) {
  var self = this;
  self.closing = 1;
  self.send(null, {
    type: 'disconnect'
  }, function() {
    self.cleanUp();
    if (typeof cb === 'function') cb();
  });
};

module.exports = Network;
