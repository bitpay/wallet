
var FakeWallet = function(){
  this.balance=10000;
  this.safeBalance=1000;
  this.balanceByAddr={'1CjPR7Z5ZSyWk6WtXvSFgkptmpoi4UM9BC': 1000};
};

FakeWallet.prototype.set = function(balance, safeBalance, balanceByAddr){
  this.balance=balance;
  this.safeBalance = safeBalance;
  this.balanceByAddr = balanceByAddr;
};

FakeWallet.prototype.getAddressesInfo=function(){
  var ret = [];

  for(var ii in this.balanceByAddr){
    ret.push({
      address: ii,
      isChange: false,
    });
  }
  return ret;
};


FakeWallet.prototype.getBalance=function(cb){
  return cb(null, this.balance, this.balanceByAddr, this.safeBalance);
};

// This mock is meant for karma, module.exports is not necesary.
try {
  module.exports = require('soop')(FakeWallet);
} catch (e) {}
