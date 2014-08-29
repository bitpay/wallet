'use strict';

var util = require('util');
var async = require('async');
var request = require('request');
var bitcore = require('bitcore');
var io = require('socket.io-client');

var EventEmitter = require('events').EventEmitter;
var preconditions = require('preconditions').singleton();

/*
  This class lets interfaces with the blockchain, making general queries and
  subscribing to transactions on adressess and blocks.

  Opts: 
    - host
    - port
    - schema
    - reconnection (optional)
    - reconnectionDelay (optional)

  Events:
    - tx: activity on subscribed address.
    - block: a new block that includes a subscribed address.
    - connect: the connection with the blockchain is ready.
    - disconnect: the connection with the blochckain is unavailable.  
*/

var Insight = function (opts) {
  this.status = this.STATUS.DISCONNECTED;
  this.subscribed = {};
  this.listeningBlocks = false;

  preconditions.checkArgument(opts).shouldBeObject(opts)
  .checkArgument(opts.host)
  .checkArgument(opts.port)
  .checkArgument(opts.schema);

  this.url = opts.schema + '://' + opts.host + ':' + opts.port;
  this.opts = {
    'reconnection': opts.reconnection || true,
    'reconnectionDelay': opts.reconnectionDelay || 1000,
    'secure': opts.schema === 'https'
  };

  this.socket = this.getSocket(this.url, this.opts);

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
    self.status = self.STATUS.CONNECTED;
    self.emit('connect', attempt);
  });
}

util.inherits(Insight, EventEmitter);

Insight.prototype.STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  DESTROYED: 'destroyed'
}

/** @private */
Insight.prototype.subscribeToBlocks = function() {
  if (this.listeningBlocks || !this.socket.connected) return;

  var self = this;
  this.socket.emit('subscribe', 'inv');
  this.socket.on('block', function(blockHash) {
    self.emit('block', blockHash);
  });
  this.listeningBlocks = true;
}

/** @private */
Insight.prototype.getSocket = function(url, opts) {
  return io(this.url, this.opts);
}

/** @private */
Insight.prototype.request = function(path, cb) {
  preconditions.checkArgument(path).shouldBeFunction(cb);
  request(this.url + path, cb);
}

/** @private */
Insight.prototype.requestPost = function(path, data, cb) {
  preconditions.checkArgument(path).checkArgument(data).shouldBeFunction(cb);
  request({method: "POST", url: this.url + path, json: data}, cb);
}

Insight.prototype.destroy = function() {
  this.socket.destroy();
  this.subscribed = {};
  this.status = this.STATUS.DESTROYED;
  this.removeAllListeners();
};

Insight.prototype.subscribe = function(addresses) {
  addresses = Array.isArray(addresses) ? addresses : [addresses];
  var self = this;

  function handlerFor(self, address) {
    return function (txid) {
      // verify the address is still subscribed
      if (!self.subscribed[address]) return;
      self.emit('tx', {address: address, txid: txid});
    }
  }

  addresses.forEach(function(address) {
    preconditions.checkArgument(new bitcore.Address(address).isValid());

    // skip already subscibed
    if (!self.subscribed[address]) {
      self.subscribed[address] = true;
      self.socket.emit('subscribe', address);
      self.socket.on(address, handlerFor(self, address));
    }
  });
};

Insight.prototype.getSubscriptions = function(addresses) {
  return Object.keys(this.subscribed);
}

Insight.prototype.unsubscribe = function(addresses) {
  addresses = Array.isArray(addresses) ? addresses : [addresses];
  var self = this;

  addresses.forEach(function(address) {
    preconditions.checkArgument(new bitcore.Address(address).isValid());
    self.socket.removeEventListener(address);
    delete self.subscribed[address];
  });
};

Insight.prototype.unsubscribeAll = function() {
  this.unsubscribe(this.getSubscriptions());
};

Insight.prototype.broadcast = function(rawtx, cb) {
  preconditions.checkArgument(rawtx);
  preconditions.shouldBeFunction(cb);

  this.requestPost('/api/tx/send', {rawtx: rawtx}, function(err, res, body) {
    if (err || res.statusCode != 200) cb(err || res);
    cb(null, body.txid);
  });
};

Insight.prototype.getTransaction = function(txid, cb) {
  preconditions.shouldBeFunction(cb);
  this.request('/api/tx/' + txid, function(err, res, body) {
    if (err || res.statusCode != 200 || !body) return cb(err || res);
    cb(null, JSON.parse(body));
  });
};

Insight.prototype.getTransactions = function(addresses, cb) {
  preconditions.shouldBeArray(addresses);
  preconditions.shouldBeFunction(cb);

  var self = this;
  if (!addresses.length) return cb(null, []);

  // Iterator: get a list of transaction ids for an address
  function getTransactionIds(address, next) {
    self.request('/api/addr/' + address, function(err, res, body) {
      if (err || res.statusCode != 200 || !body) return next(err || res);
      next(null, JSON.parse(body).transactions);
    });
  }

  async.map(addresses, getTransactionIds, function then(err, txids) {
    if (err) return cb(err);

    // txids it's a list of list, let's fix that:
    var txidsList = txids.reduce(function(a, r) {
      return r.concat(a);
    });

    // Remove duplicated txids
    txidsList = txidsList.filter(function(elem, pos, self) {
      return self.indexOf(elem) == pos;
    });

    // Now get the transactions for that list of txIds
    async.map(txidsList, self.getTransaction.bind(self), function then(err, txs) {
      if (err) return cb(err);
      cb(null, txs);
    });
  });
};

Insight.prototype.getUnspent = function(addresses, cb) {
  preconditions.shouldBeArray(addresses);
  preconditions.shouldBeFunction(cb);

  this.requestPost('/api/addrs/utxo', {addrs: addresses.join(',')}, function(err, res, body) {
    if (err || res.statusCode != 200) return cb(err || res);
    cb(null, body);
  });
};

Insight.prototype.getActivity = function(addresses, cb) {
  preconditions.shouldBeArray(addresses);

  this.getTransactions(addresses, function then(err, txs) {
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
