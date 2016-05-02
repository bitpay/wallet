'use strict';

angular.module('copayApp.services').factory('walletService', function(bwsError, profileService, storageService) {
  var root = {};

  var getClient = function(walletId) {
    return profileService.getClient(walletId);
  };

  root.isComplete = function(walletId) {
    return profileService.getClient(walletId).isComplete();
  };

  root.isBackupNeeded = function(walletId, cb) {
    var c = getClient(walletId);
    if (c.isPrivKeyExternal()) return cb(false);
    if (!c.credentials.mnemonic) return cb(false);
    if (c.credentials.network == 'testnet') return cb(false);

    storageService.getBackupFlag(walletId, function(err, val) {
      if (err || val) return cb(false);
      return cb(true);
    });
  };

  root.isReady = function(walletId, cb) {
    if(!root.isComplete(walletId)) 
      return bwsError.cb('WALLET_NOT_COMPLETE', null, cb);
    root.isBackupNeeded(walletId, function(needsBackup) {
      if (needsBackup)
        return bwsError.cb('WALLET_NEEDS_BACKUP', null, cb);
    });
  };

  return root;
});
