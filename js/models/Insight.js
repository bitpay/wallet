'use strict';

var util = require('util');
var async = require('async');
var request = require('request');
var io = require('socket.io-client');
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var preconditions = require('preconditions').singleton();

var bitcore = require('bitcore');

var log = require('../util/log.js');


/*
  This class lets interface with the blockchain, making general queries and
  subscribing to transactions on addresses and blocks.

  Opts: 
    - url
    - reconnection (optional)
    - reconnectionDelay (optional)

  Events:
    - tx: activity on subscribed address.
    - block: a new block that includes a subscribed address.
    - connect: the connection with the blockchain is ready.
    - disconnect: the connection with the blochckain is unavailable.  
*/

var Insight = function(opts) {
  preconditions.checkArgument(opts)
    .shouldBeObject(opts)
    .checkArgument(opts.url)

  this.status = this.STATUS.DISCONNECTED;
  this.subscribed = {};
  this.listeningBlocks = false;

  this.url = opts.url;
  this.opts = {
    'reconnection': opts.reconnection || true,
    'reconnectionDelay': opts.reconnectionDelay || 1000,
    'secure': opts.url.indexOf('https') === 0
  };


  if (opts.transports) {
    this.opts['transports'] = opts.transports;
  }

  this.socket = this.getSocket();
}

Insight.setCompleteUrl = function(uri) {

  if (!uri) return uri;

  var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

  var parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
  ];

  function parseuri(str) {
    var m = re.exec(str || ''),
      uri = {},
      i = 14;

    while (i--) {
      uri[parts[i]] = m[i] || '';
    }

    return uri;
  };

  var opts_host;
  var opts_secure;
  var opts_port;
  var opts_protocol;
  if (uri) {
    uri = parseuri(uri);
    opts_host = uri.host;
    opts_protocol = uri.protocol;
    opts_secure = uri.protocol == 'https' || uri.protocol == 'wss';
    opts_port = uri.port;
  }

  var this_secure = null != opts_secure ? opts_secure :
    ('https:' == location.protocol);

  var opts_hostname;
  if (opts_host) {
    var pieces = opts_host.split(':');
    opts_hostname = pieces.shift();
    if (pieces.length) opts_port = pieces.pop();
  }

  var this_port = opts_port ||
    (this_secure ? 443 : 80);

  var newUri = opts_protocol + '://' + opts_host + ':' + this_port;

  return newUri;
}

util.inherits(Insight, EventEmitter);

Insight.prototype.STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  DESTROYED: 'destroyed'
}

/** @private */
Insight.prototype.subscribeToBlocks = function() {
  var socket = this.getSocket();
  if (this.listeningBlocks || !socket.connected) return;

  var self = this;
  socket.on('block', function(blockHash) {
    self.emit('block', blockHash);
  });
  this.listeningBlocks = true;
}

/** @private */
Insight.prototype._getSocketIO = function(url, opts) {
  log.debug('Insight: Connecting to socket:', this.url);
  return io(this.url, this.opts);
};


Insight.prototype._setMainHandlers = function(url, opts) {
  // Emmit connection events
  var self = this;
  this.socket.on('connect', function() {
    self.status = self.STATUS.CONNECTED;
    self.subscribeToBlocks();
    self.emit('connect', 0);
  });

  this.socket.on('connect_error', function() {
    if (self.status != self.STATUS.CONNECTED) return;
    self.status = self.STATUS.DISCONNECTED;
    self.emit('disconnect');
  });

  this.socket.on('connect_timeout', function() {
    if (self.status != self.STATUS.CONNECTED) return;
    self.status = self.STATUS.DISCONNECTED;
    self.emit('disconnect');
  });

  this.socket.on('reconnect', function(attempt) {
    if (self.status != self.STATUS.DISCONNECTED) return;
    self.emit('reconnect', attempt);
    self.reSubscribe();
    self.status = self.STATUS.CONNECTED;
  });
};


/** @private */
Insight.prototype.getSocket = function() {

  if (!this.socket) {
    this.socket = this._getSocketIO(this.url, this.opts);
    this._setMainHandlers();
  }
  return this.socket;
}

/** @private */
Insight.prototype.request = function(path, cb) {
  preconditions.checkArgument(path).shouldBeFunction(cb);
  request(this.url + path, cb);
}

/** @private */
Insight.prototype.requestPost = function(path, data, cb) {
  preconditions.checkArgument(path).checkArgument(data).shouldBeFunction(cb);
  request({
    method: "POST",
    url: this.url + path,
    json: data
  }, cb);
}

Insight.prototype.destroy = function() {
  var socket = this.getSocket();
  this.socket.disconnect();
  this.socket.removeAllListeners();
  this.socket = null;
  this.subscribed = {};
  this.status = this.STATUS.DESTROYED;
  this.removeAllListeners();
};

Insight.prototype.subscribe = function(addresses) {
  addresses = Array.isArray(addresses) ? addresses : [addresses];
  var self = this;

  function handlerFor(self, address) {
    return function(txid) {
      // verify the address is still subscribed
      if (!self.subscribed[address]) return;

      self.emit('tx', {
        address: address,
        txid: txid
      });
    }
  }

  var s = self.getSocket();
  addresses.forEach(function(address) {
    preconditions.checkArgument(new bitcore.Address(address).isValid());

    // skip already subscibed
    if (!self.subscribed[address]) {
      var handler = handlerFor(self, address);
      self.subscribed[address] = handler;
//      log.debug('Subscribe to: ', address);
      s.emit('subscribe', address);
      s.on(address, handler);
    }
  });
};

Insight.prototype.getSubscriptions = function(addresses) {
  return this.subscribed;
}


Insight.prototype.reSubscribe = function() {
  log.debug('insight reSubscribe');
  var allAddresses = Object.keys(this.subscribed);
  this.subscribed = {};
  var s = this.socket;
  if (s) {
    s.removeAllListeners();
    this._setMainHandlers();
    this.subscribe(allAddresses);
    this.subscribeToBlocks();
  }
};


Insight.prototype.broadcast = function(rawtx, cb) {
  preconditions.checkArgument(rawtx);
  preconditions.shouldBeFunction(cb);

  this.requestPost('/api/tx/send', {
    rawtx: rawtx
  }, function(err, res, body) {
    if (err || res.statusCode != 200) return cb(err || body);
    return cb(null, body ? body.txid : null);
  });
};

Insight.prototype.getTransaction = function(txid, cb) {
  preconditions.shouldBeFunction(cb);
  this.request('/api/tx/' + txid, function(err, res, body) {
    if (err || res.statusCode != 200 || !body) return cb(err || res);
    cb(null, JSON.parse(body));
  });
};

Insight.prototype.getTransactions = function(addresses, from, to, cb) {
  preconditions.shouldBeArray(addresses);
  preconditions.shouldBeFunction(cb);

  var qs = '';
  if (_.isNumber(from)) {
    qs += '?from=' + from;
    if (_.isNumber(to)) {
      qs += '&to=' + to;
    }
  }

  this.requestPost('/api/addrs/txs' + qs, {
    addrs: addresses.join(',')
  }, function(err, res, txs) {
    if (err || res.statusCode != 200) return cb(err || res);
    cb(null, txs);
  });
};

Insight.prototype.getUnspent = function(addresses, cb) {
  preconditions.shouldBeArray(addresses);
  preconditions.shouldBeFunction(cb);

  this.requestPost('/api/addrs/utxo', {
    addrs: addresses.join(',')
  }, function(err, res, unspentRaw) {
    if (err || res.statusCode != 200) return cb(err || res);

    // This filter out possible broken unspent, as reported on
    // https://github.com/bitpay/copay/issues/1585
    // and later gitter conversation.

    var unspent = _.filter(unspentRaw, 'scriptPubKey');
    cb(null, unspent);
  });
};

Insight.prototype.getActivity = function(addresses, cb) {
  preconditions.shouldBeArray(addresses);

  this.getTransactions(addresses, null, null, function then(err, txs) {
    if (err) return cb(err);

    var flatArray = function(xss) {
      return xss.reduce(function(r, xs) {
        return r.concat(xs);
      }, []);
    };
    var getInputs = function(t) {
      return t.vin.map(function(vin) {
        return vin.addr
      });
    };
    var getOutputs = function(t) {
      return flatArray(
        t.vout.map(function(vout) {
          return vout.scriptPubKey.addresses;
        })
      );
    };

    var activityMap = new Array(addresses.length);
    var activeAddress = flatArray(txs.map(function(t) {
      return getInputs(t).concat(getOutputs(t));
    }));
    activeAddress.forEach(function(addr) {
      var index = addresses.indexOf(addr);
      if (index != -1) activityMap[index] = true;
    });

    cb(null, activityMap);
  });
};

module.exports = Insight;
