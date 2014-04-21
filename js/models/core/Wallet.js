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
  if (console)
        console.log.apply(console, arguments);
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

  var hasChanged = pkr.merge(inPKR, true);
  if (hasChanged) { 
    this.log('### BROADCASTING PKR');
    recipients = null;
    shouldSend = true;
  }
  // else if (isInbound  && !data.isBroadcast) {
  //   // always replying  to connecting peer
  //   this.log('### REPLYING PKR TO:', senderId);
  //   recipients = senderId;
  //   shouldSend = true;
  // }

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
  if (mergeInfo.hasChanged  || addSeen) { 
    this.log('### BROADCASTING txProposals. ' );
    recipients = null;
    shouldSend = true;
  }
  // else if (isInbound  && !data.isBroadcast) {
  //   // always replying  to connecting peer
  //   this.log('### REPLYING txProposals TO:', senderId);
  //   recipients = senderId;
  //   shouldSend = true;
  // }

  if (shouldSend) 
    this.sendTxProposals(recipients);
  
  this.store();
};

Wallet.prototype._handleData = function(senderId, data, isInbound) {
  // TODO check message signature
  if (this.id !== data.walletId) {
    this.emit('badMessage',senderId);
    this.log('badMessage FROM:', senderId); //TODO
    return;
  }
  this.log('[Wallet.js.98]' , data.type); //TODO
  switch(data.type) {
    // This handler is repeaded on WalletFactory (#join). TODO
    case 'walletId':
      this.sendWalletReady(senderId);
      break;
    case 'walletReady':
      this.sendPublicKeyRing(senderId);
      this.sendTxProposals(senderId);
      break;
    case 'publicKeyRing':
      this._handlePublicKeyRing(senderId, data, isInbound);
    break;
    case 'txProposals':
      this._handleTxProposals(senderId, data, isInbound);
    break;
  }
};

Wallet.prototype._handleNetworkChange = function(newPeerId) {
  if (newPeerId) {
    this.log('#### Setting new PEER:', newPeerId);
    this.sendWalletId(newPeerId);
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


Wallet.prototype.getPeerId = function(index) {
  return this.publicKeyRing.getCopayerId(index || 0);
};


Wallet.prototype.getMyPeerId = function() {
  return this.getPeerId(0);
};

Wallet.prototype.netStart = function() {
  var self = this;
  var net = this.network;
  net.removeAllListeners();
  net.on('networkChange', self._handleNetworkChange.bind(self) );
  net.on('data',  self._handleData.bind(self) );
  net.on('open', function() {});  // TODO
  net.on('openError', function() {
    self.log('[Wallet.js.132:openError:] GOT  openError'); //TODO
    self.emit('openError');
  });
  net.on('close', function() {
    self.emit('close');
  });

  var myPeerId = self.getMyPeerId();
  var startOpts = { 
    peerId: myPeerId
  };
  net.start(function() {
    self.emit('created');
    for (var i=0; i<self.publicKeyRing.registeredCopayers(); i++) {
      var otherPeerId = self.getPeerId(i);
      if (otherPeerId !== myPeerId) {
        net.connectTo(otherPeerId);
      }
    self.sendWalletReady(self.firstPeerId);
    self.firstPeerId = null;
    self.emit('refresh');
    }
  }, startOpts);
};

Wallet.prototype.store = function(isSync) {
  this.log('[Wallet.js.135:store:]'); //TODO
  var wallet = this.toObj();
  this.storage.setFromObj(this.id, wallet);

  if (isSync) {
    this.log('Wallet stored.'); //TODO
  } 
  else {
    this.log('Wallet stored. REFRESH Emitted'); //TODO
    this.emit('refresh');
  }

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

Wallet.prototype.sendWalletReady = function(recipients) {
  this.log('### SENDING WalletReady TO:', recipients);

  this.network.send( recipients, { 
    type: 'walletReady', 
    walletId: this.id,
  });
  this.emit('walletReady');
};

Wallet.prototype.sendWalletId = function(recipients) {
  this.log('### SENDING walletId TO:', recipients||'All', this.walletId);

  this.network.send(recipients, { 
    type: 'walletId', 
    walletId: this.id,
    opts: this._optsToObj()
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


Wallet.prototype.generateAddress = function(isChange) {
  var addr = this.publicKeyRing.generateAddress(isChange);
console.log('[Wallet.js.281:addr:]',addr, this.publicKeyRing.toObj(), this.getAddresses()); //TODO
  this.sendPublicKeyRing();
  this.store(true);
  return addr;
};

// TODO : sort by time... / signed.
Wallet.prototype.getTxProposals = function() {
  var ret = [];
  for(var k in this.txProposals.txps) {
    var txp = this.txProposals.txps[k];
    var i = JSON.parse(JSON.stringify(txp));
    i.builder = txp.builder;
    i.ntxid = k;
    i.signedByUs = txp.signedBy[this.getMyPeerId()]?true:false;

    i.peerActions = {};
    for(var p in txp.seenBy){
      i.peerActions[p]={seen: txp.seenBy[p]};
    }
    for(var p in txp.signedBy){
      i.peerActions[p]=  i.peerActions[p] || {};
      i.peerActions[p].sign = txp.signedBy[p];
    }
    var c = txp.creator;
    i.peerActions[c] = i.peerActions[c] || {};
    i.peerActions[c].create = txp.createdTs;


    ret.push(i);
  }
  return ret;
};

Wallet.prototype.getTxProposal = function(ntxid) {
  var txp = this.txProposals.txps[ntxid];
  var i = {txp:txp};
  i.ntxid = ntxid;
  i.signedByUs = txp.signedBy[this.getMyPeerId()]?true:false;
  return i;
};

Wallet.prototype.sign = function(ntxid) {
  var self = this;
  var txp = self.txProposals.txps[ntxid];
  if (!txp) return;

  var pkr = self.publicKeyRing;
  var keys = self.privateKey.getAll(pkr.addressIndex, pkr.changeAddressIndex);
console.log('[Wallet.js.329:keys:] LENGTH::',keys.length, pkr.addressIndex, pkr.changeAddressIndex); //TODO

  var b = txp.builder;
  var before = b.signaturesAdded;
  b.sign(keys);

  var ret = false;
  if (b.signaturesAdded >  before) {
    txp.signedBy[self.getMyPeerId()] = Date.now();
    this.sendTxProposals();
    this.store(true);
    ret = true;
  }
  return ret;
};

Wallet.prototype.sendTx = function(ntxid, cb) {
  var txp = this.txProposals.txps[ntxid];
  if (!txp) return;

  var tx = txp.builder.build();
  if (!tx.isComplete()) return;
  this.log('[Wallet.js.231] BROADCASTING TX!!!'); //TODO

  var txHex = tx.serialize().toString('hex');
  this.log('[Wallet.js.261:txHex:]',txHex); //TODO

  var self = this;

  this.blockchain.sendRawTransaction(txHex, function(txid) {
    self.log('BITCOND txid:',txid); //TODO
    if (txid) {
      self.txProposals.setSent(ntxid, txid);
    }
    self.sendTxProposals();
    self.store();
    return cb(txid);
  });
};

Wallet.prototype.addSeenToTxProposals = function() {
  var ret=false;
  var myId=this.getMyPeerId();

  for(var k in this.txProposals.txps) {
    var txp = this.txProposals.txps[k];
    if (!txp.seenBy[myId]) {

      txp.seenBy[myId] = Date.now();
      ret = true;
    }
  }
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

Wallet.prototype.getBalance = function(safe, cb) {
  var balance = 0;
  var balanceByAddr = {};
  var isMain = {};
  var COIN = bitcore.util.COIN;
  var addresses = this.getAddressesStr(true);

  if (!addresses.length) return cb(0,[]);

  // Prefill balanceByAddr with main address
  addresses.forEach(function(a){
    balanceByAddr[a]=0;
    isMain[a]=1;
  });
  var f = safe ?  this.getSafeUnspent.bind(this):this.getUnspent.bind(this);
  f(function(utxos) {
    for(var i=0;i<utxos.length; i++) {
      var u= utxos[i];
      var amt = u.amount * COIN;
      balance = balance + amt;
      balanceByAddr[u.address] = (balanceByAddr[u.address]||0) + amt;
    }
    for(var a in balanceByAddr){
      balanceByAddr[a] = balanceByAddr[a]/COIN;
    }
    return cb(balance / COIN, balanceByAddr, isMain);
  });
};

Wallet.prototype.getUnspent = function(cb) {
  this.blockchain.getUnspent(this.getAddressesStr(), function(unspentList) {
    return cb(unspentList);
  });
};

Wallet.prototype.getSafeUnspent = function(cb) {
  var self = this;
  this.blockchain.getUnspent(this.getAddressesStr(), function(unspentList) {

    var ret=[];
    var uu = self.txProposals.getUsedUnspent();

    for(var i in unspentList){
      if (uu.indexOf(unspentList[i].txid) === -1) 
        ret.push(unspentList[i]);
    }

    return cb(ret);
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

  self.getSafeUnspent(function(unspentList) {
    // TODO check enough funds, etc.
    self.createTxSync(toAddress, amountSatStr, unspentList, opts);
    self.sendPublicKeyRing();   // Change Address
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
    opts.remainderOut ={ address: this.generateAddress(true).toString() };
  }

  var b = new Builder(opts)
    .setUnspent(utxos)
    .setHashToScriptMap(pkr.getRedeemScriptMap())
    .setOutputs([{address: toAddress, amountSat: amountSat}])
    ;

  var signRet;  
  if (priv) {
    var keys = priv.getAll(pkr.addressIndex, pkr.changeAddressIndex);
console.log('[Wallet.js.329:keys:] LENGTH::',keys.length, pkr.addressIndex, pkr.changeAddressIndex); //TODO
    b.sign( keys );
  }
console.log('[Wallet.js.494]', b, b.build().serialize().toString('hex')); //TODO
  var me = {};
  var myId = this.getMyPeerId();
  var now = Date.now();

  if (priv) me[myId] = now;

  var data = {
    signedBy: (priv && b.signaturesAdded ? me : {}),
    seenBy:   (priv ? me : {}),
    creator:   myId,
    createdTs: now,
    builder: b,
  };

  this.txProposals.add(data);
};

Wallet.prototype.connectTo = function(peerId) {
  throw new Error('Wallet.connectTo.. not yet implemented!');
};

Wallet.prototype.disconnect = function() {
  this.network.disconnect();
};

module.exports = require('soop')(Wallet);
