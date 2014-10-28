'use strict';
var Identity = require('Identity'),
    Passphrase = require('Passphrase'),
    Wallet = require('Wallet'),
//  walletFactory = new WalletFactory(),
  passphrase = new Passphrase();

function Compatibility(){
//  - preDotEightListWallets()
//  - preDotEightImportWalletToStorage(walletId, passphrase, profile) (edited)
}

Compatibility.prototype.preDotEightListWallets = function () {};


Compatibility.prototype.preDotEightImportWalletToStorage = function(encryptedObj, password, skipPublicKeyRing, skipTxProposals) {
  passphrase.getBase64Async(password, function(passphrase) {
//    updateStatus('Importing wallet - Setting things up...');
    var w, errMsg;

    var skipFields = [];
    if (skipPublicKeyRing)
      skipFields.push('publicKeyRing');

    if (skipTxProposals)
      skipFields.push('txProposals');

    // try to import encrypted wallet with passphrase
    try {
      w = walletFactory.import(encryptedObj, passphrase, skipFields);
    } catch (e) {
      errMsg = e.message;
    }

    if (!w) {
//      $scope.loading = false;
//      notification.error('Error', errMsg || 'Wrong password');
      $rootScope.$digest();
      return;
    }

    // if wallet was never used, we're done
    if (!w.isReady()) {
      $rootScope.wallet = w;
//      controllerUtils.startNetwork($rootScope.wallet, $scope);
      return;
    }

    // if it was used, we need to scan for indices
    w.updateIndexes(function(err) {
//      updateStatus('Importing wallet - We are almost there...');
      if (err) {
//        $scope.loading = false;
//        notification.error('Error', 'Error updating indexes: ' + err);
      }
      $rootScope.wallet = w;
//      controllerUtils.startNetwork($rootScope.wallet, $scope);
    });
  });
};

Compatibility.prototype.fromEncryptedObj = function(base64, passphrase, skipFields) {
  this.storage.setPassphrase(passphrase);
  var walletObj = this.storage.import(base64);
  if (!walletObj) return false;
  return this.fromObj(walletObj, skipFields);
};

Compatibility.prototype.fromObj = function(inObj, skipFields) {
  var networkName = this.obtainNetworkName(inObj);
  preconditions.checkState(networkName);
  preconditions.checkArgument(inObj);

  var obj = JSON.parse(JSON.stringify(inObj));

  // not stored options
  obj.opts = obj.opts || {};
  obj.opts.reconnectDelay = this.walletDefaults.reconnectDelay;

  skipFields = skipFields || [];
  skipFields.forEach(function(k) {
    if (obj[k]) {
      delete obj[k];
    } else
      throw new Error('unknown field:' + k);
  });

  var w = Wallet.fromObj(obj, this.storage, this.networks[networkName], this.blockchains[networkName]);
  if (!w) return false;
  this._checkVersion(w.version);
  return w;
};

module.exports = Compatibility;
