'use strict';

var EventEmitter = require('events').EventEmitter;
var bitcore = require('bitcore');
var log = require('../util/log');
var AuthMessage = bitcore.AuthMessage;
var util = bitcore.util;
var nodeUtil = require('util');
var extend = nodeUtil._extend;
var io = require('socket.io-client');
var preconditions = require('preconditions').singleton();

function Network(opts) {
  preconditions.checkArgument(opts);
  preconditions.checkArgument(opts.url);
  opts = opts || {};
  this.maxPeers = opts.maxPeers || 12;
  this.url = opts.url;
  this.secretNumber = opts.secretNumber;
  this.cleanUp();

  this.socketOptions = {
    reconnection: true,
    'force new connection': true,
    'secure': this.url.indexOf('https') === 0,
  };

  if (opts.transports) {
    this.socketOptions['transports'] = opts.transports;
  }
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
  this.criticalErr = '';
  if (this.socket) {
    log.info('Async DISCONNECT');
    this.socket.disconnect();
    this.socket.removeAllListeners();
    this.socket = null;
  }
  this.removeAllListeners();
};

Network.parent = EventEmitter;

// Array helpers
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

Network.prototype._sendHello = function(copayerId, secretNumber) {

  this.send(copayerId, {
    type: 'hello',
    copayerId: this.copayerId,
    secretNumber: secretNumber
  });
};

Network.prototype._sendRejectConnection = function(copayerId) {

  this.send(copayerId, {
    type: 'rejectConnection',
    copayerId: this.copayerId,
  });
};

Network.prototype._deletePeer = function(peerId) {
  delete this.isInboundPeerAuth[peerId];
  delete this.copayerForPeer[peerId];
  this.connectedPeers = Network._arrayRemove(peerId, this.connectedPeers);
};

Network.prototype._addCopayer = function(copayerId) {
  var peerId = this.peerFromCopayer(copayerId);
  this._addCopayerMap(peerId, copayerId);
  Network._arrayPushOnce(peerId, this.connectedPeers);
};

Network.prototype._addConnectedCopayer = function(copayerId) {
  this._addCopayer(copayerId);
  this.emit('connect', copayerId);
};

Network.prototype.getKey = function() {
  preconditions.checkState(this.privkey || this.key);
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
  this.networkNonce = Buffer.concat([noncep1, noncep2], 8);
  return this.networkNonce;
};

Network.prototype.decode = function(enc) {
  var sender = enc.pubkey;
  var key = this.getKey();
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
  return payload;
};

Network.prototype._onMessage = function(enc) {
  var sender = enc.pubkey;
  try {
    var payload = this.decode(enc);
  } catch (e) {
    this._deletePeer(sender);
    return;
  }

  if (this.ignoreMessageFromTs && this.ignoreMessageFromTs === enc.ts) {
    log.debug('Ignoring trailing message. Ts:', enc.ts);
    return;
  }

  var self = this;
  switch (payload.type) {
    case 'hello':
      if (typeof payload.secretNumber === 'undefined' || payload.secretNumber !== this.secretNumber) {
        this._sendRejectConnection(sender);
        this._deletePeer(enc.pubkey, 'incorrect secret number');
        return;
      }
      // if we locked allowed copayers, check if it belongs
      if (this.allowedCopayerIds && !this.allowedCopayerIds[payload.copayerId]) {
        this._sendRejectConnection(sender);
        this._deletePeer(sender);
        return;
      }
      //ensure claimed public key is actually the public key of the peer
      //e.g., their public key should hash to be their peerId
      if (sender !== payload.copayerId) {
        this._sendRejectConnection(sender);
        this._deletePeer(enc.pubkey, 'incorrect pubkey for peerId');
        return;
      }
      this._addConnectedCopayer(payload.copayerId);
      break;
    default:
      this.emit('data', sender, payload, enc.ts);
  }
};

Network.prototype._setupSocketHandlers = function(opts, cb) {
  preconditions.checkState(this.socket);
  log.debug('setting up connection', opts);
  var self = this;

  self.socket.on('connect_error', function(m) {

    // If socket is not started, destroy it and emit and error
    // If it is started, socket.io will try to reconnect. 
    if (!self.started) {
      self.emit('connect_error');
      self.cleanUp();
    }
  });

  self.socket.on('subscribed', function(m) {
    var fromTs = opts.syncedTimestamp || 0;

    // We ask for this message, and then ignore it, only to see if the
    // server has erased our old messages.

    if (fromTs) {
      self.ignoreMessageFromTs = fromTs;
    }
    log.info('Async: synchronizing from: ', fromTs);
    self.socket.emit('sync', fromTs);
    self.started = true;
  });


  self.socket.on('message', function(m) {
    // delay execution, to improve error handling
    setTimeout(function() {
      self._onMessage(m);
    }, 1);
  });
  self.socket.on('error', self._onError.bind(self));
  self.socket.on('no_messages', self.emit.bind(self, 'no_messages'));
  self.socket.on('no messages', self.emit.bind(self, 'no_messages'));
  self.socket.on('connect', function() {
    var pubkey = self.getKey().public.toString('hex');
    log.debug('Async subscribing to pubkey:', pubkey);

    self.socket.emit('subscribe', pubkey);

    self.socket.on('disconnect', function() {
      self.socket.emit('subscribe', pubkey);
    });
    if (typeof cb === 'function') cb();
  });
};

Network.prototype._onError = function(err) {
  log.debug('RECV ERROR: ', err);
  log.debug(err.stack);
  this.criticalError = err.message;
};

Network.prototype.greet = function(copayerId, secretNumber) {
  this._sendHello(copayerId, secretNumber);
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
  preconditions.checkState(!this.started, 'network already started: can not change peerId');

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
  preconditions.checkArgument(opts);
  preconditions.checkArgument(opts.privkey);
  preconditions.checkArgument(opts.copayerId);

  if (this.started) {
    log.debug('Async: Networing already started for this wallet.')
    return openCallback();
  }

  this.privkey = opts.privkey;
  this.setCopayerId(opts.copayerId);
  this.maxPeers = opts.maxPeers || this.maxPeers;

  this.socket = this.createSocket();
  this._setupSocketHandlers(opts, openCallback);
};

Network.prototype.createSocket = function() {
  log.debug('Async: Connecting to socket:', this.url);
  return io.connect(this.url, this.socketOptions);
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
    console.log('[Async.js.373]', copayerIds); //TODO
    return copayerIds;
  }
};


Network.prototype.send = function(dest, payload, cb) {
  preconditions.checkState(this.socket);
  preconditions.checkArgument(payload);

  var self = this;
  if (!dest) {
    dest = this.getCopayerIds();
    console.log('[Async.js.383:dest:]', dest); //TODO
    payload.isBroadcast = 1;
  }

  if (typeof dest === 'string')
    dest = [dest];

  var l = dest.length;
  var i = 0;

  for (var ii in dest) {
    var to = dest[ii];
    if (to == this.copayerId)
      continue;

    var message = this.encode(to, payload);
    this.socket.emit('message', message);
  }

  if (typeof cb === 'function') cb();
};


Network.prototype.encode = function(copayerId, payload, nonce) {
  this.iterateNonce();
  var opts = {
    nonce: nonce || this.networkNonce
  };
  var copayerIdBuf = new Buffer(copayerId, 'hex');
  var message = AuthMessage.encode(copayerIdBuf, this.getKey(), payload, opts);
  return message;
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

Network.prototype.setCopayers = function(copayersIdsArray) {
  for (var i in copayersIdsArray) {
    this._addCopayer(copayersIdsArray[i]);
  }
};

module.exports = Network;
