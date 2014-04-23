
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
 *
 */

function Network(opts) {
  var self = this;
  opts                = opts || {};
  this.peerId         = opts.peerId;
  this.apiKey         = opts.apiKey || 'lwjd5qra8257b9';
  this.debug          = opts.debug || 3;
  this.maxPeers       = opts.maxPeers || 10;
  this.opts = { key: opts.key };
  this.connections = {};
  this.copayerForPeer = {};

  // For using your own peerJs server
  ['port', 'host', 'path', 'debug'].forEach(function(k) {
    if (opts[k]) self.opts[k]=opts[k];
  });
  this.connectedPeers = [];
  this.started = false;
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


Network.prototype.connectedCopayers = function() {
  var ret =[];
  for(var i in this.connectedPeers){
    var copayerId =this.copayerForPeer[this.connectedPeers[i]];
    if (copayerId) ret.push(copayerId);
  }
  return ret;
};

Network.prototype._onClose = function(peerId) {
console.log('[WebRTC.js.72:_onClose:]');

  delete this.connections[peerId];
  this.connectedPeers = Network._arrayRemove(peerId, this.connectedPeers);
  this._notifyNetworkChange();
};

Network.prototype._connectToCopayers = function(copayerIds) {
  var self = this;

console.log('[WebRTC.js.96] _connectToCopayers', copayerIds, this.connectedCopayers() ); //TODO

  var arrayDiff= Network._arrayDiff(copayerIds, this.connectedCopayers());
console.log('[WebRTC.js.99:arrayDiff:]',arrayDiff); //TODO
  arrayDiff.forEach(function(copayerId) {
    console.log('### CONNECTING TO:', copayerId);
    self.connectTo(copayerId);
  });
};

Network.prototype._sendCopayerId = function(copayerId) {
  console.log('#### SENDING COPAYERID TO TO ', copayerId);
  this.send(copayerId, {
    type: 'copayerId',
    copayerId: this.copayerId,
  });
};

Network.prototype._sendCopayers = function(copayerIds) {
  console.log('#### SENDING PEER LIST: ', this.connectedPeers,this.connectedCopayers(), ' TO ', copayerIds?copayerIds: 'ALL');
  this.send(copayerIds, {
    type: 'copayers',
    copayers: this.connectedCopayers(),
  });
};

Network.prototype._addCopayer = function(copayerId, isInbound) {
  var peerId = this.peerFromCopayer(copayerId);
  this._addCopayerMap(peerId,copayerId);
  var hasChanged = Network._arrayPushOnce(peerId, this.connectedPeers);
  if (isInbound && hasChanged) {
    this._sendCopayers();              //broadcast peer list
  }
  else {
    if (isInbound) {
      this._sendCopayers(copayerId);
    }
  }
};

Network.prototype._onData = function(data, isInbound, peerId) {
  var obj;
  try { 
    obj = JSON.parse(data);
  } catch (e) {
    console.log('### ERROR ON DATA: "%s" ', data, isInbound, e); 
    return;
  };
  console.log('### RECEIVED TYPE: %s FROM %s', obj.data.type, obj.sender, obj.data); 
  var self=this;

  if(obj.data.type === 'copayerId') {
      if (this.peerFromCopayer(obj.data.copayerId) === peerId) {
        console.log('#### Peer sent the right copayerId. Setting it up.'); //TODO
        this._addCopayer(obj.data.copayerId, isInbound);
        this._notifyNetworkChange( isInbound ? obj.data.copayerId : null);
        this.emit('open');
      }
      else {
        console.log('### RECEIVED WRONG COPAYER ID FROM:', peerId); //TODO
      }
      return;
  }

  if (!this.copayerForPeer[peerId]) {
    console.log('### Discarting message from unknow peer: ', peerId); //TODO
    return;
  }
  
  switch(obj.data.type) {
    case 'copayers':
      this._addCopayer(this.copayerForPeer[peerId], false);
      this._connectToCopayers(obj.data.copayers);
      this._notifyNetworkChange();
      break;
    case 'disconnect':
      this._onClose(obj.sender);
      break;
    default:
      this.emit('data', self.copayerForPeer[obj.sender], obj.data, isInbound);
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
    if (!Network._inArray(dataConn.peer, self.connectedPeers)
        && !  self.connections[dataConn.peer]) {

      self.connections[dataConn.peer] = dataConn;

      console.log('### DATA CONNECTION READY: ADDING PEER: %s (inbound: %s)',
        dataConn.peer, isInbound);

      // The outbount send its copayerID
      if(!isInbound) 
        self._sendCopayerId(self.copayerForPeer[dataConn.peer]);      
    }
  });

  dataConn.on('data', function(data) { 
    self._onData(data, isInbound, dataConn.peer);
  });

  dataConn.on('error', function(e) {
    console.log('### DATA ERROR',e ); //TODO
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
  console.log('[WebRTC.js.164:_notifyNetworkChange:]', newCopayerId); //TODO
  this.emit('networkChange', newCopayerId);
};

Network.prototype._setupPeerHandlers = function(openCallback) {
  var self=this;
  var p = this.peer;

  p.on('open', function() {
    self.connectedPeers = [self.peerId];
    self.copayerForPeer[self.peerId]= self.copayerId;

    return openCallback();
  });

  p.on('error', function(err) {
    console.log('### PEER ERROR:', err);
    //self.disconnect(null, true); // force disconnect
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


Network.prototype._addCopayerMap = function(peerId, copayerId) {
  if (!this.copayerForPeer[peerId]) {
    console.log('ADDING COPAYER MAPPING: %s => %s', peerId, copayerId); //TODO
    this.copayerForPeer[peerId]=copayerId;
  }
};

Network.prototype.setCopayerId = function(copayerId) {
  if (this.started) {
    throw new Error ('network already started: can not change peerId')
  }
  this.copayerId = copayerId;
  this.peerId = this.peerFromCopayer(this.copayerId);
  this._addCopayerMap(this.peerId,copayerId);
};

Network.prototype.peerFromCopayer = function(hex) {
  return util.sha256(new Buffer(hex,'hex')).toString('hex');
};

Network.prototype.start = function(openCallback, opts) {
  opts = opts || {};
  var self = this;
  if (this.started)  return openCallback();

  opts.connectedPeers = opts.connectedPeers || [];


  this.setCopayerId(this.copayerId || opts.copayerId);
  this.peer = new Peer(this.peerId, this.opts);
  this._setupPeerHandlers(openCallback);
  for (var i = 0; i<opts.connectedPeers.length; i++) {
    var otherPeerId = opts.connectedPeers[i];
    this.connectTo(otherPeerId);
  }
  this.started = true;
console.log('[WebRTC.js.237] started TRUE'); //TODO
};

Network.prototype._sendToOne = function(copayerId, data, cb) {

  var peerId = this.peerFromCopayer(copayerId);
  if (peerId !== this.peerId) {
    var dataConn = this.connections[peerId];
    if (dataConn) {
      var str = JSON.stringify({
        sender: this.peerId,
        data: data
      });
      dataConn.send(str);
    }
    else {
console.log('[WebRTC.js.255] WARN: NO CONNECTION TO:', peerId); //TODO
    }
  }
  if (typeof cb === 'function') cb();
};

Network.prototype.send = function(copayerIds, data, cb) {
  var self=this;
  if (!copayerIds) {
    copayerIds = this.connectedCopayers();
    data.isBroadcast = 1;
  }

  if (Array.isArray(copayerIds)) {
    var l = copayerIds.length;
    var i = 0;
    copayerIds.forEach(function(copayerId) {
      self._sendToOne(copayerId, data, function () {
        if (++i === l && typeof cb === 'function') cb();
      });
    });
  }
  else if (typeof copayerIds === 'string')
    self._sendToOne(copayerIds, data, cb);
};

Network.prototype.connectTo = function(copayerId) {
  var self = this;
  var peerId = this.peerFromCopayer(copayerId);
  this._addCopayerMap(peerId,copayerId);

  console.log('### STARTING CONNECTION TO:', peerId, copayerId);
  var dataConn = this.peer.connect(peerId, {
    serialization: 'none',
    reliable: true,
  });

  self._setupConnectionHandlers(dataConn, false);
};


Network.prototype.disconnect = function(cb, forced) {
  var self = this;
  self.closing = 1;
  var cleanUp = function() {
    self.connectedPeers = [];
    self.started = false;
    self.peerId = null;
    if (self.peer) {
      self.peer.disconnect();
      self.peer.destroy();
      self.peer = null;
    }
    self.closing = 0;
    if (typeof cb === 'function') cb();
  };
  if (!forced) {
    this.send(null, { type: 'disconnect' }, cleanUp);
  } else {
    cleanUp();
  }
};

module.exports = require('soop')(Network);
