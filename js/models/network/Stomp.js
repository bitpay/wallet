'use strict';

var imports = require('soop').imports();
var EventEmitter = imports.EventEmitter || require('events').EventEmitter;
var bitcore = require('bitcore');
var util = bitcore.util;
var extend = require('util')._extend;
var Message = require('../core/Message');

var STOMP_PATH = 'copay/';
var STOMP_POSTFIX = '?consumer.retroactive=true';

// TODO only if now browserify
// if (process.version) {
//   var Stomp = require('stompjs');
// }

function Network(opts) {
  var self = this;
  opts = opts || {};
  this.opts = {};
  ['url', 'headers', 'disableHearbeat', 'maxPeers'].forEach(function(k) {
    if (opts.hasOwnProperty(k)) self.opts[k] = opts[k];
  });
  if (!this.opts.url)
    throw new Error('no STOMP url at config');

  this.cleanUp();
}

Network.parent = EventEmitter;

Network.prototype.cleanUp = function(cb) {
  this.started = false;
  this.peerId = null;
  this.privkey = null; //TODO: hide privkey in a closure
  this.key = null;
  this.copayerId = null;
  this.allowedCopayerIds = null;
  this.isPeerAuth = [];
  this.copayerForPeer = {};
  this.connections = {};
  this.criticalErr = '';
  this.removeAllListeners();
  if (this.client) {
    var self = this;
    this.client.disconnect(function() {
      self.client = null;
      if (cb) cb();
    });
  }
};

Network.parent = EventEmitter;

Network.prototype._deletePeer = function(peerId) {
  delete this.isPeerAuth[peerId];
  delete this.copayerForPeer[peerId];
};

Network.prototype._onClose = function(peerID) {
  this.emit('disconnect', peerID);
};


Network.prototype._sendHello = function(copayerId) {
  this.send(copayerId, {
    type: 'hello',
    copayerId: this.copayerId,
  });
};

Network.prototype._addConnectedCopayer = function(copayerId) {
  var peerId = this.peerFromCopayer(copayerId);
  this._addCopayerMap(peerId, copayerId);
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


Network.prototype.lockPeers = function(allowedCopayerIdsArray) {
  console.log('[Stomp.js.140] LOCKING PEERS!'); //TODO
  this.allowedCopayerIds = {};
  for (var i in allowedCopayerIdsArray) {
    var copayerId = allowedCopayerIdsArray[i];
    this.allowedCopayerIds[copayerId] = true;
    var peerId = this.peerFromCopayer(copayerId);
    this._addCopayerMap(peerId, copayerId);
  }
};

Network.prototype._onData = function(message) {
  console.log('[Stomp.js.142:message:]'); //TODO

  var peerId = message.headers['reply-to'];
  var encstr = message.body;

  var privkey = this.privkey;
  var key = this.getKey();

  try {
    var encoded = JSON.parse(encstr);
    var prevnonce = this.networkNonces ? this.networkNonces[peerId] : undefined;
    var opts = {
      prevnonce: prevnonce
    };
    var decoded = this._decode(key, encoded, opts);

    //if no error thrown in the last step, we can set the copayer's nonce
    if (!this.networkNonces)
      this.networkNonces = {};
    this.networkNonces[peerId] = decoded.nonce;

    var databuf = decoded.payload;
    var datastr = databuf.toString();
    var payload = JSON.parse(datastr);
    console.log('[Stomp.js.164:payload:]', payload); //TODO
  } catch (e) {

    console.log('[Stomp.js.167] ERRR', e); //TODO
    this._deletePeer(peerId);
    return;
  }


  // Auth TODO TODO TODO
  if (payload.type === 'hello') {
    var payloadStr = JSON.stringify(payload);

    console.log('[Stomp.js.176]'); //TODO
    //ensure claimed public key is actually the public key of the peer
    //e.g., their public key should hash to be their peerId
    if (peerId.toString() !== this.peerFromCopayer(payload.copayerId) || peerId.toString() !== this.peerFromCopayer(encoded.pubkey)) {
      this._deletePeer(peerId, 'incorrect pubkey for peerId');
      return;
    }

    console.log('[Stomp.js.184]'); //TODO
    if (this.allowedCopayerIds && !this.allowedCopayerIds[payload.copayerId]) {
      this._deletePeer(peerId);
      return;
    }

    console.log('[Stomp.js.190]'); //TODO
    this._addConnectedCopayer(payload.copayerId);
    this._setPeerAuth(peerId, true);
    return;
  }
  //
  if (!this.copayerForPeer[peerId]) {
    console.log('[Stomp.js.198] UNKNOW PEER: ', peerId, this.copayerForPeer); //TODO
    this._deletePeer(peerId);
    return;
  }

  var self = this;
  switch (payload.type) {
    case 'disconnect':
      this._onClose(peerId);
      break;
    default:
      this.emit('data', self.copayerForPeer[peerId], payload);
  }
};


Network.prototype._handlePeerError = function(err) {
  console.log('RECV ERROR: ', err);
  if (err.message.match(/Could\snot\sconnect\sto peer/)) {
    //this._checkAnyPeer();
  } else {
    this.criticalError = err.message;
  }
};

// Network.prototype._handlePeerConnection = function(dataConn) {
//   if (this.connectedPeers.length >= self.maxPeers) {
//     dataConn.on('open', function() {
//       dataConn.close();
//     });
//   } else {
//     this._setPeerAuth(dataConn.peer, false);
//     this._setupConnectionHandlers(dataConn);
//   }
// };
//

Network.prototype.greet = function(copayerId) {
  this._sendHello(copayerId);
  var peerId = this.peerFromCopayer(copayerId);
  this._addCopayerMap(peerId, copayerId);
};

Network.prototype._addCopayerMap = function(peerId, copayerId) {
  if (!this.copayerForPeer[peerId]) {
    if (Object.keys(this.copayerForPeer).length < this.opts.maxPeers) {
      this.copayerForPeer[peerId] = copayerId;
    }
  }
  console.log('[Stomp.js.242:_addCopayerMap:]', peerId, copayerId, this.copayerForPeer); //TODO
};

Network.prototype._setPeerAuth = function(peerId, isAuthenticated) {
  this.isPeerAuth[peerId] = isAuthenticated;
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


Network.prototype._handleFailedOpen = function(e) {
  console.log('[Stomp.js.262:_handleFailedOpen:]', e); //TODO
  this.cleanUp();
  this.emit('serverError', e);
};


Network.prototype._handleOpen = function(openCallback) {
  this.started = true;
  this.copayerForPeer[this.peerId] = this.copayerId;

  this.stompSub = this.client.subscribe(
    STOMP_PATH + this.peerId + STOMP_POSTFIX,
    this._onData.bind(this), {
      "activemq.dispatchAsync": true,
      "activemq.exclusive": true,
      "activemq.retroactive": true,
    });
  return openCallback();
};

Network.prototype.start = function(opts, openCallback) {
  opts = opts || {};
  if (this.started) return openCallback();
  if (this.client)
    throw new Error('start called when stomp is already defined');

  if (!this.privkey)
    this.privkey = opts.privkey;

  if (opts.token)
    this.opts.token = opts.token;

  if (!this.copayerId)
    this.setCopayerId(opts.copayerId);

  console.log('[Stomp.js.281]', this.opts.url); //TODO
  this.client = Stomp.client(this.opts.url);
  if (this.opts.disableHearbeat) {
    this.client.heartbeat.outgoing = 0;
    this.client.heartbeat.incoming = 0;
  }

  var headers = JSON.parse(JSON.stringify(this.opts.headers));
  headers['client-id'] = STOMP_PATH + this.peerId;
  console.log('[Stomp.js.330:headers:]', headers); //TODO

  this.client.connect(headers, this._handleOpen.bind(this, openCallback), this._handleFailedOpen.bind(this));
};

Network.prototype.getOnlinePeerIDs = function() {
  // TODO
  //  return this.connectedPeers;
  return [];
};

Network.prototype.getPeer = function() {
  return this.peer;
};

Network.prototype._encode = function(topubkey, fromkey, payload, opts) {
  var encoded = Message.encode(topubkey, fromkey, payload, opts);
  return encoded;
};


Network.prototype._decode = function(key, encoded, opts) {
  var decoded = Message.decode(key, encoded, opts);
  return decoded;
};

Network.prototype._sendToOne = function(copayerId, payload, cb) {
  if (!Buffer.isBuffer(payload))
    throw new Error('payload must be a buffer');

  var peerId = this.peerFromCopayer(copayerId);
  if (peerId !== this.peerId) {
    this.client.send(STOMP_PATH + peerId + STOMP_POSTFIX, {
      'reply-to': this.peerId,
      'persistent': 1,
      //      'expires': 0,
    }, payload);
  }
  if (typeof cb === 'function') cb();
};


Network.prototype.getCopayerIds = function() {
  if (this.allowedCopayerIds) {
    console.log('[Stomp.js.369] LOCKED WALLET', this.allowedCopayerIds); //TODO
    return Object.keys(this.allowedCopayerIds);
  } else {
    console.log('[Stomp.js.371]', this.copayerForPeer); //TODO
    var copayerIds = [];
    for (var peerId in this.copayerForPeer) {
      copayerIds.push(this.copayerForPeer[peerId]);
    }
    return copayerIds;
  }
};

Network.prototype.send = function(copayerIds, payload, cb) {
  if (!payload) return cb();

  var self = this;
  if (!copayerIds) {
    copayerIds = this.getCopayerIds();
    payload.isBroadcast = 1;
  }
  console.log('[Stomp.js.377:copayerIds:] SEND TO:', copayerIds, payload); //TODO

  if (typeof copayerIds === 'string')
    copayerIds = [copayerIds];

  var payloadStr = JSON.stringify(payload);
  var payloadBuf = new Buffer(payloadStr);

  var l = copayerIds.length;
  var i = 0;
  copayerIds.forEach(function(copayerId) {
    self.iterateNonce();
    var opts = {
      nonce: self.networkNonce
    };
    var copayerIdBuf = new Buffer(copayerId, 'hex');
    var encPayload = self._encode(copayerIdBuf, self.getKey(), payloadBuf, opts);
    var enc = new Buffer(JSON.stringify(encPayload));
    self._sendToOne(copayerId, enc, function() {
      if (++i === l && typeof cb === 'function') cb();
    });
  });
};


Network.prototype.isOnline = function() {
  return !!this.peer;
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

module.exports = require('soop')(Network);
