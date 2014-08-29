var is_browser = typeof process == 'undefined' || typeof process.versions === 'undefined';
if (is_browser) {
  var copay = require('copay'); //browser
} else {
  var copay = require('../copay'); //node
}
var Wallet = copay.Wallet;

var FakePrivateKey = function () {
};

FakePrivateKey.prototype.toObj = function() {
    return extendedPublicKeyString = 'privHex';
};

var FakeWallet = function() {
  this.id = 'testID';
  this.balance = 10000;
  this.safeBalance = 1000;
  this.totalCopayers = 2;
  this.requiredCopayers = 2;
  this.isLocked = false;
  this.balanceByAddr = {
    '1CjPR7Z5ZSyWk6WtXvSFgkptmpoi4UM9BC': 1000
  };
  this.name = 'myTESTwullet';
  this.addressBook = {
    '2NFR2kzH9NUdp8vsXTB4wWQtTtzhpKxsyoJ': {
      label: 'John',
      copayerId: '026a55261b7c898fff760ebe14fd22a71892295f3b49e0ca66727bc0a0d7f94d03',
      createdTs: 1403102115,
    }
  };
  this.publicKeyRing = {
    isComplete: function() {
      return true;
    }
  };
  this.blockchain = {
    getSubscriptions: function(){ return []; },
    subscribe: function(){}
  };

  this.privateKey = new FakePrivateKey();
};

FakeWallet.prototype.createTx = function(toAddress, amountSatStr, comment, opts, cb) {
  var callback = cb || opts;
  callback({});
}

FakeWallet.prototype.sendTx = function(ntxid, cb) {
  cb(8);
}

FakeWallet.prototype.set = function(balance, safeBalance, balanceByAddr) {
  this.balance = balance;
  this.safeBalance = safeBalance;
  this.balanceByAddr = balanceByAddr;
};

FakeWallet.prototype.getAddressesInfo = function() {
  var ret = [];

  for (var ii in this.balanceByAddr) {
    ret.push({
      address: ii,
      addressStr: ii,
      isChange: false,
    });
  }
  return ret;
};

FakeWallet.prototype.isShared = function() {
  return this.totalCopayers > 1;
}

FakeWallet.prototype.isReady = function() {
  return true;
};

FakeWallet.prototype.fetchPaymentTx = function(opts, cb) {
  cb(null, {
    pr: {
      pd: {
        expires: 12
      }
    }
  });
};


FakeWallet.prototype.createPaymentTx = Wallet.prototype.createPaymentTx;


FakeWallet.prototype.getBalance = function(cb) {
  return cb(null, this.balance, this.balanceByAddr, this.safeBalance);
};

FakeWallet.prototype.setEnc = function(enc) {
  this.enc = enc;
};

FakeWallet.prototype.toEncryptedObj = function() {
  return this.enc;
};

FakeWallet.prototype.close = function() {
};

// TODO a try catch was here
module.exports = FakeWallet;
