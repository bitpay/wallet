
var imports     = require('soop').imports();
var EventEmitter= imports.EventEmitter || require('events').EventEmitter;
var bitcore     = require('bitcore');
var util        = bitcore.util;
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
  var self            = this;
  opts                = opts || {};
  this.apiKey         = opts.apiKey || 'lwjd5qra8257b9';
  this.debug          = opts.debug || 3;
  this.maxPeers       = opts.maxPeers || 10;
  this.sjclParams     = opts.sjclParams || {
    salt: 'f28bfb49ef70573c', 
    iter:500,
    mode:'ccm',
    ts:parseInt(64),   
  };


  // For using your own peerJs server
  self.opts = {};
  ['port', 'host', 'path', 'debug', 'key'].forEach(function(k) {
    if (opts[k]) self.opts[k] = opts[k];
  });
  this.cleanUp();
}

Network.parent = EventEmitter;

Network.prototype.cleanUp = function() {
  this.started = false;
  this.connectedPeers = [];
  this.peerId = null;
  this.netKey = null;
  this.copayerId = null;
  this.signingKey = null;
  this.allowedCopayerIds=null;
  this.isInboundPeerAuth=[];
  this.copayerForPeer={};
  this.connections={};
  if (this.peer) {
    console.log('## DESTROYING PEER INSTANCE'); //TODO
    this.peer.disconnect();
    this.peer.destroy();
    this.peer = null;
  }
  this.closing = 0;
};

Network.parent=EventEmitter;

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
  var ret =[];
  for(var i in this.connectedPeers){
    var copayerId =this.copayerForPeer[this.connectedPeers[i]];
    if (copayerId) ret.push(copayerId);
  }
  return ret;
};

Network.prototype._deletePeer = function(peerId) {
  console.log('### Deleting connection from peer:', peerId);

  delete this.isInboundPeerAuth[peerId];
  delete this.copayerForPeer[peerId];

  if (this.connections[peerId]) {
    this.connections[peerId].close();
  }
  delete this.connections[peerId];
  this.connectedPeers = Network._arrayRemove(peerId, this.connectedPeers);
};

Network.prototype._onClose = function(peerId) {
  this._deletePeer(peerId);
  this._notifyNetworkChange();
};

Network.prototype.connectToCopayers = function(copayerIds) {
  var self = this;
  var arrayDiff= Network._arrayDiff(copayerIds, this.connectedCopayers());

  arrayDiff.forEach(function(copayerId) {
    if (this.allowedCopayerIds && !this.allowedCopayerIds[copayerId]) {
      console.log('### IGNORING STRANGE COPAYER:', copayerId);
      this._deletePeer(this.peerFromCopayer(copayerId));
    }
    else {
      console.log('### CONNECTING TO:', copayerId);
      self.connectTo(copayerId);
    }
  });
};

Network.prototype._sendHello = function(copayerId) {
  console.log('### SENDING HELLO TO ', copayerId);
  this.send(copayerId, {
    type: 'hello',
    copayerId: this.copayerId,
  });
};

Network.prototype._addConnectedCopayer = function(copayerId, isInbound) {
  var peerId = this.peerFromCopayer(copayerId);
  this._addCopayerMap(peerId,copayerId);
  Network._arrayPushOnce(peerId, this.connectedPeers);
};

Network.prototype._onData = function(encStr, isInbound, peerId) {
  var sig, payload;

  try { 
    var data = this._decrypt(encStr);
    payload=  JSON.parse(data);
  } catch (e) {
    console.log('### ERROR IN DATA: "%s" ', data, isInbound, e); 
    this._deletePeer(peerId);
    return;
  }

  console.log('### RECEIVED INBOUND?:%s TYPE: %s FROM %s', 
              isInbound, payload.type, peerId, payload); 

  if(isInbound && payload.type === 'hello') {
    var payloadStr = JSON.stringify(payload);

    if (this.allowedCopayerIds && !this.allowedCopayerIds[payload.copayerId]) {
      console.log('#### Peer sent HELLO but it is not on the allowedCopayerIds. Closing connection', 
                  this.allowedCopayerIds, payload.copayerId);
      this._deletePeer(peerId);
      return;
    }

    console.log('#### Peer sent hello. Setting it up.'); //TODO
    this._addConnectedCopayer(payload.copayerId, isInbound);
    this._setInboundPeerAuth(peerId, true);
    this._notifyNetworkChange( isInbound ? payload.copayerId : null);
    this.emit('open');
    return;
  }

  if ( !this.copayerForPeer[peerId] || (isInbound && !this.isInboundPeerAuth[peerId]) ) { 
    this._deletePeer(peerId);
    return;
  }

  var self=this;
  switch(payload.type) {
    case 'disconnect':
      this._onClose(peerId);
      break;
    default:
      this.emit('data', self.copayerForPeer[peerId], payload, isInbound);
  }
};

Network.prototype._checkAnyPeer = function() {
  if (!this.connectedPeers.length) {
    console.log('EMIT openError: no more peers, not even you!'); 
    this.cleanUp();
    this.emit('openError');
  }
  if (this.connectedPeers.length === 1) {
    this.emit('onlyYou');
  }
};

Network.prototype._setupConnectionHandlers = function(dataConn, toCopayerId) {
  var self = this;

  var isInbound = toCopayerId ? false : true;

  dataConn.on('open', function() {
    if (!Network._inArray(dataConn.peer, self.connectedPeers) && 
        !self.connections[dataConn.peer]) {

      self.connections[dataConn.peer] = dataConn;

      console.log('### DATA CONNECTION READY: %s (inbound: %s) AUTHENTICATING...',
        dataConn.peer, isInbound);

      // The connecting peer send hello 
      if(toCopayerId) {
        self._addConnectedCopayer(toCopayerId);
        self._sendHello(toCopayerId);      
      }
    }
  });

  dataConn.on('data', function(data) { 
    self._onData(data, isInbound, dataConn.peer);
  });

  dataConn.on('error', function(e) {
    console.log('### DATA ERROR', e); //TODO
    self._onClose(dataConn.peer);
    self._checkAnyPeer();
    self.emit('dataError');
  });

  dataConn.on('close', function() {
    if (self.closing) return;

    console.log('### CLOSE RECV FROM:', dataConn.peer);
    self._onClose(dataConn.peer);
    self._checkAnyPeer();
  });
};

Network.prototype._notifyNetworkChange = function(newCopayerId) {
  this.emit('networkChange', newCopayerId);
};

Network.prototype._setupPeerHandlers = function(openCallback) {
  var self = this;
  var p = this.peer;

  p.on('open', function() {
    self.connectedPeers = [self.peerId];
    self.copayerForPeer[self.peerId]= self.copayerId;
    return openCallback();
  });

  p.on('error', function(err) {
    if (!err.message.match(/Could\snot\sconnect\sto peer/)) {
      console.log('### PEER ERROR:', err);
    }
    self._checkAnyPeer();
  });


  p.on('connection', function(dataConn) {
    console.log('### NEW INBOUND CONNECTION %d/%d', self.connectedPeers.length, self.maxPeers);
    if (self.connectedPeers.length >= self.maxPeers) {
      console.log('### PEER REJECTED. PEER MAX LIMIT REACHED');
      dataConn.on('open', function() {
        console.log('###  CLOSING CONN FROM:' + dataConn.peer);
        dataConn.close();
      });
    } else {
      self._setInboundPeerAuth(dataConn.peer, false);
      self._setupConnectionHandlers(dataConn);
    }
  });
};


Network.prototype._addCopayerMap = function(peerId, copayerId) {
  if (!this.copayerForPeer[peerId]) {
    if(Object.keys(this.copayerForPeer).length < this.maxPeers) {
      console.log('Adding peer/copayer',  peerId, copayerId); //TODO
      this.copayerForPeer[peerId]=copayerId;
    }
    else {
      console.log('### maxPeerLimit of %d reached. Refusing to add more copayers.', this.maxPeers); //TODO
    }
  }
};


Network.prototype._setInboundPeerAuth = function(peerId, isAuthenticated) {
  this.isInboundPeerAuth[peerId] = isAuthenticated;
};

Network.prototype.setCopayerId = function(copayerId) {
  if (this.started) {
    throw new Error('network already started: can not change peerId')
  }
  this.copayerId = copayerId;
  this.copayerIdBuf = new Buffer(copayerId,'hex');
  this.peerId = this.peerFromCopayer(this.copayerId);
  this._addCopayerMap(this.peerId,copayerId);
};


Network.prototype.peerFromCopayer = function(hex) {
  var SIN = bitcore.SIN;
  return new SIN(new Buffer(hex,'hex')).toString();
};

Network.prototype.start = function(opts, openCallback) {
  opts = opts || {};

  if (this.started) return openCallback();

  this.netKey = opts.netKey;
  this.maxPeers = opts.maxPeers || this.maxPeers;

  if (!this.copayerId)
    this.setCopayerId(opts.copayerId);

  console.log('CREATING PEER INSTANCE:', this.peerId); //TODO
  this.peer = new Peer(this.peerId, this.opts);
  this.started = true;
  this._setupPeerHandlers(openCallback);
};


Network.prototype.getOnlinePeerIDs = function() {
  return this.connectedPeers;
};

Network.prototype.getPeer = function() {
  return this.peer;
};

Network.prototype._encrypt = function(payloadStr) {
  var plainText = sjcl.codec.utf8String.toBits(payloadStr);
  var p = this.sjclParams;    
  ct = sjcl.encrypt(this.netKey, plainText, p);//,p, rp);
  var c = JSON.parse(ct);
  var toSend = {
    iv: c.iv,
    ct: c.ct,
  };
  return JSON.stringify(toSend);
};


Network.prototype._decrypt = function(encStr) {
  var i = JSON.parse(encStr);
  for (var k in this.sjclParams) {
    i[k] = this.sjclParams[k];
  }
  var str= JSON.stringify(i);
  var pt = sjcl.decrypt(this.netKey, str);
  return pt;
};

Network.prototype._sendToOne = function(copayerId, payload, sig, cb) {
  var peerId = this.peerFromCopayer(copayerId);
  if (peerId !== this.peerId) {
    var dataConn = this.connections[peerId];
    if (dataConn) {
      dataConn.send(payload);
    }
    else {
      console.log('[WebRTC.js.255] WARN: NO CONNECTION TO:', peerId); //TODO
    }
  }
  if (typeof cb === 'function') cb();
};

Network.prototype.send = function(copayerIds, payload, cb) {
  var self=this;
  if (!copayerIds) {
    copayerIds = this.connectedCopayers();
    payload.isBroadcast = 1;
  }

  var sig;
  var payloadStr = JSON.stringify(payload);
  var encPayload = this._encrypt(payloadStr);
  if (Array.isArray(copayerIds)) {
    var l = copayerIds.length;
    var i = 0;
    copayerIds.forEach(function(copayerId) {
      self._sendToOne(copayerId, encPayload, sig, function () {
        if (++i === l && typeof cb === 'function') cb();
      });
    });
  }
  else if (typeof copayerIds === 'string')
    self._sendToOne(copayerIds, encPayload, sig, cb);
};


Network.prototype.connectTo = function(copayerId) {
  var self = this;

  var peerId = this.peerFromCopayer(copayerId);
  console.log('### STARTING CONNECTION TO:\n\t'+ peerId+"\n\t"+ copayerId);
  var dataConn = this.peer.connect(peerId, {
    serialization: 'none',
    reliable: true,
  });
  self._setupConnectionHandlers(dataConn, copayerId);
};

Network.prototype.lockIncommingConnections = function(allowedCopayerIdsArray) {
  if (!this.allowedCopayerIds) 
    console.log('[webrtc] #### LOCKING INCOMMING CONNECTIONS'); 
  
  this.allowedCopayerIds={};
  for(var i in allowedCopayerIdsArray) {
    this.allowedCopayerIds[ allowedCopayerIdsArray[i] ] = 1;
  }
};

Network.prototype.disconnect = function(cb, forced) {
  var self = this;
  self.closing = 1;
  self.send(null, { type: 'disconnect' }, function(){
    self.cleanUp();
    if (typeof cb === 'function') cb();
  });
};

module.exports = require('soop')(Network);
