'use strict';

var imports     = require('soop').imports();

var bitcore     = require('bitcore');
var coinUtil    = bitcore.util;
var buffertools = bitcore.buffertools;
var Builder     = bitcore.TransactionBuilder;
var http        = require('http');
var EventEmitter= imports.EventEmitter || require('events').EventEmitter;
var copay       = copay || require('../../../copay');

function Wallet(opts) {
  var self = this;

  //required params
  ['storage', 'network', 'blockchain',
    'requiredCopayers', 'totalCopayers', 'spendUnconfirmed',
    'publicKeyRing', 'txProposals', 'privateKey'
  ].forEach( function(k){
    if (typeof opts[k] === 'undefined') throw new Error('missing key:' + k);
    self[k] = opts[k];
  });

  this.log('creating '+opts.requiredCopayers+' of '+opts.totalCopayers+' wallet');

  this.id = opts.id || Wallet.getRandomId();
  this.verbose = opts.verbose;
  this.publicKeyRing.walletId = this.id;
  this.txProposals.walletId = this.id;

}

Wallet.parent=EventEmitter;
Wallet.prototype.log = function(){
  if (!this.verbose) return;
  console.log(arguments);
};

Wallet.getRandomId = function() {
  var r = buffertools.toHex(coinUtil.generateNonce());
  return r;
};

Wallet.prototype._handlePublicKeyRing = function(senderId, data, isInbound) {
  this.log('RECV PUBLICKEYRING:',data); 

  var shouldSend = false;
  var recipients, pkr = this.publicKeyRing;
  var inPKR = copay.PublicKeyRing.fromObj(data.publicKeyRing);
  if (pkr.merge(inPKR, true)  && !data.isBroadcast) { 
    this.log('### BROADCASTING PKR');
    recipients = null;
    shouldSend = true;
  }
  else if (isInbound  && !data.isBroadcast) {
    // always replying  to connecting peer
    this.log('### REPLYING PKR TO:', senderId);
    recipients = senderId;
    shouldSend = true;
  }

  if (shouldSend) {
    this.sendPublicKeyRing(recipients);
  }
  this.store();
};


Wallet.prototype._handleTxProposals = function(senderId, data, isInbound) {
  this.log('RECV TXPROPOSAL:',data); //TODO

  var shouldSend = false;
  var recipients;
  var inTxp = copay.TxProposals.fromObj(data.txProposals);
  var mergeInfo = this.txProposals.merge(inTxp, true);

  var addSeen = this.addSeenToTxProposals();
  if ((mergeInfo.merged  && !data.isBroadcast) || addSeen) { 
    this.log('### BROADCASTING txProposals. ' );
    recipients = null;
    shouldSend = true;
  }
  else if (isInbound  && !data.isBroadcast) {
    // always replying  to connecting peer
    this.log('### REPLYING txProposals TO:', senderId);
    recipients = senderId;
    shouldSend = true;
  }

  if (shouldSend) 
    this.sendTxProposals(recipients);
  
  this.store();
};

Wallet.prototype._handleData = function(senderId, data, isInbound) {

  if (this.id !== data.walletId) {
    this.emit('badMessage',senderId);
    this.log('badMessage FROM:', senderId); //TODO
    return;
  }
  this.log('[Wallet.js.98]' , data.type); //TODO
  switch(data.type) {
    case 'publicKeyRing':
      this._handlePublicKeyRing(senderId, data, isInbound);
    break;
    case 'txProposals':
      this._handleTxProposals(senderId, data, isInbound);
    break;
  }
};

Wallet.prototype._handleNetworkChange = function(newPeer) {
  if (newPeer) {
    this.log('#### Setting new PEER:', newPeer);
    this.sendWalletId(newPeer);
    this.sendPublicKeyRing(newPeer);
    this.sendTxProposals(newPeer);
  }
  this.emit('refresh');
};

Wallet.prototype._optsToObj = function () {
  var obj = {
    id: this.id,
    spendUnconfirmed: this.spendUnconfirmed,
    requiredCopayers: this.requiredCopayers,
    totalCopayers: this.totalCopayers,
  };

  return obj;
};

Wallet.prototype.netStart = function() {
  var self = this;
  var net = this.network;
  net.removeAllListeners();
  net.on('networkChange', self._handleNetworkChange.bind(self) );
  net.on('data',  self._handleData.bind(self) );
  net.on('open', function() {});  // TODO
  net.on('openError', function() {
  this.log('[Wallet.js.132:openError:] GOT  openError'); //TODO
    self.emit('openError');
  });
  net.on('close', function() {
    self.emit('close');
  });
  net.start(function(peerId) {
    self.emit('created');
  });
};

Wallet.prototype.store = function() {
  this.log('[Wallet.js.135:store:]'); //TODO
  var wallet = this.toObj();
  this.storage.setFromObj(this.id, wallet);

  this.log('[Wallet.js.146] EMIT REFRESH'); //TODO
  this.emit('refresh');

};

Wallet.prototype.toObj = function() {
  var optsObj = this._optsToObj();
  var walletObj = {
    opts: optsObj,
    publicKeyRing: this.publicKeyRing.toObj(),
    txProposals: this.txProposals.toObj(),
    privateKey: this.privateKey.toObj()
  };

  return walletObj;
};

Wallet.fromObj = function(wallet) {
  var opts = wallet.opts;
  opts['publicKeyRing'] = this.publicKeyring.fromObj(wallet.publicKeyRing);
  opts['txProposals'] = this.txProposal.fromObj(wallet.txProposals);
  opts['privateKey'] = this.privateKey.fromObj(wallet.privateKey);

  var w = new Wallet(opts);

  return w;
};

Wallet.prototype.sendTxProposals = function(recipients) {
  this.log('### SENDING txProposals TO:', recipients||'All', this.txProposals);

  this.network.send( recipients, { 
    type: 'txProposals', 
    txProposals: this.txProposals.toObj(),
    walletId: this.id,
  });
  this.emit('txProposalsUpdated', this.txProposals);
};


Wallet.prototype.sendWalletId = function(recipients) {
  this.log('### SENDING walletId TO:', recipients||'All', this.walletId);

  this.network.send(recipients, { 
    type: 'walletId', 
    walletId: this.id,
  });
};


Wallet.prototype.sendPublicKeyRing = function(recipients) {
  this.log('### SENDING publicKeyRing TO:', recipients||'All', this.publicKeyRing.toObj());

  this.network.send(recipients, { 
    type: 'publicKeyRing', 
    publicKeyRing: this.publicKeyRing.toObj(),
    walletId: this.id,
  });
  this.emit('publicKeyRingUpdated', this.publicKeyRing);
};


Wallet.prototype.generateAddress = function() {
  var addr = this.publicKeyRing.generateAddress();
  this.sendPublicKeyRing();
  this.store();
  return addr;
};

Wallet.prototype.getTxProposals = function() {
  var ret = [];
  var self= this;
  self.txProposals.txps.forEach(function(txp) {
    var i = {txp:txp};
    i.ntxid = txp.builder.build().getNormalizedHash();
    i.signedByUs = txp.signedBy[self.privateKey.id]?true:false;
    ret.push(i);
  });
  return ret;
};

// TODO: this can be precalculated.
Wallet.prototype._findTxByNtxid = function(ntxid) {
  var ret;
  var l = this.txProposals.txps.length;
  var id = ntxid.toString('hex');
  for(var i=0; i<l; i++) {
    var txp = this.txProposals.txps[i];
    var id2 = txp.builder.build().getNormalizedHash().toString('hex');
    if (id === id2 ) {
      ret = txp;
    }
  }
  return ret;
};


Wallet.prototype.sign = function(ntxid) {
  var txp = this._findTxByNtxid(ntxid);
  if (!txp) return;

  var pkr = this.publicKeyRing;
  var keys = this.privateKey.getAll(pkr.addressIndex, pkr.changeAddressIndex);
  var ret = txp.builder.sign(keys);

  if (ret.signaturesAdded) {
    txp.signedBy[this.privateKey.id] = Date.now();
    this.log('[Wallet.js.230:ret:]',ret); //TODO
    if (ret.isFullySigned) {
      this.log('[Wallet.js.231] BROADCASTING TX!!!'); //TODO
      var tx = txp.builder.build();
      var txHex = tx.serialize().toString('hex');
      this.blockchain.sendRawTransaction(txHex, function(txid) {
        this.log('[Wallet.js.235:txid:]',txid); //TODO
        if (txid) {
          this.store();
        }
      });
    }
    else {
      this.sendTxProposals();
      this.store();
    }
  }
  return ret;
};


Wallet.prototype.addSeenToTxProposals = function() {
  var ret=false;
  var self=this;

  this.txProposals.txps.forEach(function(txp) {
    if (!txp.seenBy[self.privateKey.id]) {
      txp.seenBy[self.privateKey.id] = Date.now();
      ret = true;
    }
  });
  return ret;
};


Wallet.prototype.getAddresses = function(onlyMain) {
  return this.publicKeyRing.getAddresses(onlyMain);
};

Wallet.prototype.getAddressesStr = function(onlyMain) {
  var ret = [];
  this.publicKeyRing.getAddresses(onlyMain).forEach(function(a) {
    ret.push(a.toString());
  });
  return ret;
};


Wallet.prototype.addressIsOwn = function(addrStr) {
  var addrList = this.getAddressesStr();
  var l = addrList.length;
  var ret = false;

  for(var i=0; i<l; i++) {
    if (addrList[i] === addrStr) {
      ret = true; 
      break;
    }
  }
  return ret;
};


Wallet.prototype.getTotalBalance = function(cb) {
  this.getBalance(this.getAddressesStr(), function(balance) {
    return cb(balance);
  });
};

Wallet.prototype.getBalance = function(addrs, cb) {
  var balance = 0;
  this.listUnspent(addrs, function(utxos) {
    for(var i=0;i<utxos.length; i++) {
      balance = balance + utxos[i].amount;
    }
    if (balance) {
      if (balance === parseInt(balance)) {
        balance = balance;
      }
      else {
        balance = balance.toFixed(8);
      }
    }
    return cb(balance);
  });
};

Wallet.prototype.listUnspent = function(addrs, cb) {
  this.blockchain.listUnspent(addrs, function(utxos) {
    return cb(utxos);
  });
};


Wallet.prototype.createTx = function(toAddress, amountSatStr, opts, cb) {
  var self = this;
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  opts = opts || {};

  if (typeof opts.spendUnconfirmed === 'undefined') {
    opts.spendUnconfirmed = this.spendUnconfirmed;
  }

  if (!opts.remainderOut) {
    opts.remainderOut={ address: this.publicKeyRing.generateAddress(true).toString()};
  }

  self.listUnspent(self.getAddressesStr(), function(utxos) {
    // TODO check enough funds, etc.
    self.createTxSync(toAddress, amountSatStr, utxos, opts);
    self.sendTxProposals();
    self.store();
    return cb();
  });
};

Wallet.prototype.createTxSync = function(toAddress, amountSatStr, utxos, opts) {
  var pkr  = this.publicKeyRing; 
  var priv = this.privateKey;
  opts = opts || {};

  var amountSat = bitcore.bignum(amountSatStr);

  if (! pkr.isComplete() ) {
    throw new Error('publicKeyRing is not complete');
  }

  if (!opts.remainderOut) {
    opts.remainderOut ={ address: pkr.generateAddress(true).toString() };
  };

  var b = new Builder(opts)
    .setUnspent(utxos)
    .setHashToScriptMap(pkr.getRedeemScriptMap())
    .setOutputs([{address: toAddress, amountSat: amountSat}])
    ;

  var signRet;  
  if (priv) {
    b.sign( priv.getAll(pkr.addressIndex, pkr.changeAddressIndex) );
  }
  var me = {};
  if (priv) me[priv.id] = Date.now();

  this.txProposals.add({
    signedBy: priv && b.signaturesAdded ? me : {},
    seenBy:   priv ? me : {},
    builder: b,
  });
};

Wallet.prototype.connectTo = function(peerId) {
  throw new Error('Wallet.connectTo.. not yet implemented!');
};

Wallet.prototype.disconnect = function() {
  this.network.disconnect();
};

// // HERE? not sure
// Wallet.prototype.cleanPeers = function() {
//   this.storage.remove('peerData'); 
// };
//
;

module.exports = require('soop')(Wallet);
