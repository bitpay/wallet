
var imports     = require('soop').imports();
var EventEmitter= imports.EventEmitter || require('events').EventEmitter;

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
  var self = this;
  opts                = opts || {};
  this.peerId         = opts.peerId;
  this.apiKey         = opts.apiKey || 'lwjd5qra8257b9';
  this.debug          = opts.debug || 3;
  this.maxPeers       = opts.maxPeers || 5;
  this.opts = { key: opts.key };

  // For using your own peerJs server
  ['port', 'host', 'path', 'debug'].forEach(function(k) {
    if (opts[k]) self.opts[k]=opts[k];
  });
  this.connectedPeers = [];
}

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

Network.prototype._onClose = function(peerId) {
  this.connectedPeers = Network._arrayRemove(peerId, this.connectedPeers);
  this._notifyNetworkChange();
};

Network.prototype._connectToPeers = function(peerIds) {
  var self = this;
  var ret = false;
  var arrayDiff1= Network._arrayDiff(peerIds, this.connectedPeers);
  var arrayDiff = Network._arrayDiff(arrayDiff1, [this.peerId]);
  arrayDiff.forEach(function(peerId) {
    console.log('### CONNECTING TO:', peerId);
    self.connectTo(peerId);
    ret = true;
  });
  return ret;
};

Network.prototype._onData = function(data, isInbound) {
  var obj;
  try { 
    obj = JSON.parse(data);
  } catch (e) {
    console.log('### ERROR ON DATA: "%s" ', data, isInbound, e); 
    return;
  };
  console.log('### RECEIVED TYPE: %s FROM %s', obj.data.type, obj.sender, obj.data); 

  switch(obj.data.type) {
    case 'peerList':
      this._connectToPeers(obj.data.peers);
      this._notifyNetworkChange();
      break;
    case 'disconnect':
      this._onClose(obj.sender);
      break;
    case 'walletId':
      this.emit('walletId', obj.data.walletId);
      break;
    default:
      this.emit('data', obj.sender, obj.data, isInbound);
  }
};

Network.prototype._sendPeers = function(peerIds) {
  console.log('#### SENDING PEER LIST: ', this.connectedPeers, ' TO ', peerIds?peerIds: 'ALL');
  this.send(peerIds, {
    type: 'peerList',
    peers: this.connectedPeers,
  });
};

Network.prototype._addPeer = function(peerId, isInbound) {

  var hasChanged = Network._arrayPushOnce(peerId, this.connectedPeers);


  if (isInbound && hasChanged) {
    this._sendPeers();              //broadcast peer list
  }
  else {
    if (isInbound) {
      this._sendPeers(peerId);
    }
  }
};

Network.prototype._checkAnyPeer = function() {
  if (!this.connectedPeers.length) {
    console.log('EMIT openError: no more peers, not even you!'); 
    this.emit('openError');
  }
}

Network.prototype._setupConnectionHandlers = function(dataConn, isInbound) {

  var self=this;

  dataConn.on('open', function() {
    if (!Network._inArray(dataConn.peer, self.connectedPeers)) {

      console.log('### DATA CONNECTION READY TO: ADDING PEER: %s (inbound: %s)',
        dataConn.peer, isInbound);

      self._addPeer(dataConn.peer, isInbound);
      self._notifyNetworkChange( isInbound ? dataConn.peer : null);
      this.emit('open');
    }
  });

  dataConn.on('data', function(data) { 
    self._onData(data, isInbound);
  });

  dataConn.on('error', function(e) {
    console.log('### DATA ERROR',e ); //TODO
    self.emit('dataError');
  });

  dataConn.on('close', function() {
    if (self.closing) return;
    console.log('### CLOSE RECV FROM:', dataConn.peer); 
    self._onClose(dataConn.peer);
    self._checkAnyPeer();
  });
};

Network.prototype._notifyNetworkChange = function(newPeer) {
  console.log('[WebRTC.js.164:_notifyNetworkChange:]', newPeer); //TODO
  this.emit('networkChange', newPeer);
};

Network.prototype._setupPeerHandlers = function(openCallback) {
  var self=this;
  var p = this.peer;

  p.on('open', function(peerId) {
    self.peerId = peerId;
    self.connectedPeers = [peerId];
    self._notifyNetworkChange();
    return openCallback(peerId);
  });

  p.on('error', function(err) {
    console.log('### PEER ERROR:', err);
    self.peer.disconnect();
    self.peer.destroy();
    self.peer = null;
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
    }
    else {
      self._setupConnectionHandlers(dataConn, true);
    }
  });
};

Network.prototype.start = function(openCallback) {
  // Start PeerJS Peer
  if (this.peer) return openCallback();    // This is for connectTo-> peer is started before

  this.peer = new Peer(this.peerId, this.opts);
  this._setupPeerHandlers(openCallback);
};

Network.prototype._sendToOne = function(peerId, data, cb) {
  if (peerId !== this.peerId) {
    var conns = this.peer.connections[peerId];

    if (conns) {
      var str = JSON.stringify({
        sender: this.peerId,
        data: data
      });

      for (var i = 0; i < conns.length; i++) {
        var conn = conns[i];
        conn.send(str);
      }
    }
  }
  if (typeof cb === 'function') cb();
};

Network.prototype.send = function(peerIds, data, cb) {
  var self=this;
console.log('[WebRTC.js.242] SENDING ', data.type); //TODO
  if (!peerIds) {
    peerIds = this.connectedPeers;
    data.isBroadcast = 1;
  }

  if (Array.isArray(peerIds)) {
    var l = peerIds.length;
    var i = 0;
    peerIds.forEach(function(peerId) {
console.log('[WebRTC.js.258:peerId:]',peerId); //TODO
      self._sendToOne(peerId, data, function () {
        if (++i === l && typeof cb === 'function') cb();
      });
    });
  }
  else if (typeof peerIds === 'string')
    self._sendToOne(peerIds, data, cb);
};

Network.prototype.connectTo = function(peerId) {
  var self = this;

  console.log('### STARTING TO CONNECT TO:' + peerId );

  var dataConn = this.peer.connect(peerId, {
    serialization: 'none',
    reliable: true,
    metadata: { message: 'hi copayer!' }
  });

  self._setupConnectionHandlers(dataConn, false);
};


Network.prototype.disconnect = function(cb) {
  var self = this;
  self.closing = 1;
  this.send(null, { type: 'disconnect' }, function() {
    self.connectedPeers = [];
    self.peerId = null;
    if (self.peer) {
      self.peer.disconnect();
      self.peer.destroy();
      self.peer = null;
    }
    self.closing = 0;
    if (typeof cb === 'function') cb();
  });
};

module.exports = require('soop')(Network);
