
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

function CopayPeer(opts) {
  opts                = opts || {};
  this.peerId         = opts.peerId;
  this.apiKey         = opts.apiKey || 'lwjd5qra8257b9';
  this.debug          = opts.debug || 3;
  this.maxPeers       = opts.maxPeers || 5;
  this.connectedPeers = [];
}

CopayPeer.parent=EventEmitter;

// Array helpers
CopayPeer._arrayDiff = function(a, b) {
  var seen = [];
  var diff = [];

  for (var i = 0; i < b.length; i++)
    seen[b[i]] = true;

  for (var j = 0; j < a.length; j++)
    if (!seen[a[j]])
      diff.push(a[j]);

  return diff;
};

CopayPeer._inArray = function(el, array) {
  return array.indexOf(el) > -1;
};

CopayPeer._arrayPushOnce = function(el, array) {
  var ret = false;
  if (!CopayPeer._inArray(el, array)) {
    array.push(el);
    ret = true;
  }
  return ret;
};

CopayPeer._arrayRemove = function(el, array) {
  var pos = array.indexOf(el);
  if (pos >= 0) array.splice(pos, 1);

  return array;
};

// DEBUG
CopayPeer.prototype._showConnectedPeers = function() {
  console.log("### CONNECTED PEERS", this.connectedPeers);
};

CopayPeer.prototype._onClose = function(peerId) {
  this.connectedPeers = CopayPeer._arrayRemove(peerId, this.connectedPeers);
  this._notify();
};

CopayPeer.prototype._connectToPeers = function(peerIds) {
  var self = this;
  var ret = false;
  var arrayDiff1= CopayPeer._arrayDiff(peerIds, this.connectedPeers);
  var arrayDiff = CopayPeer._arrayDiff(arrayDiff1, [this.peerId]);
  arrayDiff.forEach(function(peerId) {
    console.log('### CONNECTING TO:', peerId);
    self.connectTo(peerId);
    ret = true;
  });
  return ret;
};

CopayPeer.prototype._onData = function(data, isInbound) {
  var obj;
  try { 
    obj = JSON.parse(data);
  } catch (e) {
    console.log('### ERROR ON DATA: "%s" ', data, isInbound, e); 
    return;
  };
  console.log('### RECEIVED TYPE: %s FROM %s', obj.data.type, obj.sender); 

  switch(obj.data.type) {
    case 'peerList':
      this._connectToPeers(obj.data.peers);
      this._notify();
      break;
    case 'disconnect':
      this._onClose(obj.sender);
      break;
    default:
      this.emit('data', obj.sender, obj.data, isInbound);
  }
};

CopayPeer.prototype._sendPeers = function(peerIds) {
  console.log('#### SENDING PEER LIST: ', this.connectedPeers, ' TO ', peerIds?peerIds: 'ALL');
  this.send(peerIds, {
    type: 'peerList',
    peers: this.connectedPeers,
  });
};

CopayPeer.prototype._addPeer = function(peerId, isInbound) {

  var hasChanged = CopayPeer._arrayPushOnce(peerId, this.connectedPeers);


  if (isInbound && hasChanged) {
    this._sendPeers();              //broadcast peer list
  }
  else {
    if (isInbound) {
      this._sendPeers(peerId);
    }
  }
};

CopayPeer.prototype._setupConnectionHandlers = function(
  dataConn, isInbound, openCallback, closeCallback) {

  var self=this;

  dataConn.on('open', function() {
    if (!CopayPeer._inArray(dataConn.peer, self.connectedPeers)) {

      console.log('### DATA CONNECTION READY TO: ADDING PEER: %s (inbound: %s)',
        dataConn.peer, isInbound);

      self._addPeer(dataConn.peer, isInbound);
      self._notify( isInbound ? dataConn.peer : null);
      if (typeof openCallback === 'function') openCallback();
    }
  });

  dataConn.on('data', function(data) { 
    self._onData(data, isInbound);
  });

  dataConn.on('error', function(e) {
    console.log('### DATA ERROR',e ); //TODO
  });

  dataConn.on('close', function() {
    console.log('### CLOSE RECV FROM:', dataConn.peer); //TODO
    self._onClose(dataConn.peer);
    if (typeof closeCallback === 'function') closeCallback();
  });
};

CopayPeer.prototype._notify = function(newPeer) {
  this._showConnectedPeers();
  this.emit('networkChange', newPeer);
};

CopayPeer.prototype._setupPeerHandlers = function(openCallback) {
  var self=this;
  var p = this.peer;


  p.on('open', function(peerId) {
    console.log('### PEER OPEN. I AM:' + peerId);
    self.peerId = peerId;
    self.connectedPeers = [peerId];
    self._notify();
    return openCallback(peerId);
  });

  p.on('error', function(err) {
    console.log('### PEER ERROR:', err);
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

CopayPeer.prototype.start = function(openCallback) {
  // Start PeerJS Peer
  this.peer = new Peer(this.peerId, {
    key: this.apiKey, // TODO: we need our own PeerServer KEY (http://peerjs.com/peerserver)
    debug: this.debug, 
  });

  this._setupPeerHandlers(openCallback);
};

CopayPeer.prototype._sendToOne = function(peerId, data, cb) {
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

CopayPeer.prototype.send = function(peerIds, data, cb) {
  var self=this;

  if (!peerIds) {
    peerIds = this.connectedPeers;
    data.isBroadcast = 1;
  }

  if (Array.isArray(peerIds)) {
    var l = peerIds.length;
    var i = 0;
    peerIds.forEach(function(peerId) {
      self._sendToOne(peerId, data, function () {
        if (++i === l && typeof cb === 'function') cb();
      });
    });
  }
  else if (typeof peerIds === 'string')
    self._sendToOne(peerIds, data, cb);
};

CopayPeer.prototype.connectTo = function(peerId, openCallback, closeCallback ) {
  var self = this;

  console.log('### STARTING TO CONNECT TO:' + peerId );

  var dataConn = this.peer.connect(peerId, {
//    label: 'wallet',
    serialization: 'none',
    reliable: true,
    metadata: { message: 'hi copayer!' }
  });

  self._setupConnectionHandlers(dataConn, false, openCallback, closeCallback);
};

CopayPeer.prototype.disconnect = function(peerId, cb) {
  var self = this;

  this.send(null, { type: 'disconnect' }, function() {
    self.connectedPeers = [];
    self.peerId = null;
    if (self.peer) {
      self.peer.disconnect();
      self.peer.destroy();
      self.peer = null;
    }
    if (typeof cb === 'function') cb();
  });
};

module.exports = require('soop')(CopayPeer);
