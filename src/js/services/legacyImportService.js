'use strict';
angular.module('copayApp.services')
  .factory('legacyImportService', function($log, lodash, bitcore, bwcService, profileService, notification) {

    var root = {};
    var wc = bwcService.getClient();

    root.getKeyForEmail = function(email) {
      var hash = bitcore.crypto.Hash.sha256ripemd160(new bitcore.deps.Buffer(email)).toString('hex');
      $log.debug('Storage key:' + hash);
      return 'profile::' + hash;
    };

    root.getKeyForWallet = function(id) {
      return 'wallet::' + id;
    };

    root.fromDevice = function(user, pass, cb) {
      var p = localStorage.getItem(root.getKeyForEmail(user));
      if (!p)
        return cb('Could not find profile for ' + user);

      var ids = wc.getWalletIdsFromOldCopay(user, pass, p);
      if (!ids)
        return cb('Could not find wallets on the profile');

      $log.info('Importing Wallet Ids:', ids);

      var i = 0;
      lodash.each(ids, function(walletId) {
        var blob = localStorage.getItem(root.getKeyForWallet(walletId));
        profileService.importLegacyWallet(user, pass, blob, function(err, name) {
console.log('[legacyImportService.js.33:err:]',err); //TODO
          if (err) {
            notification.error('Failed to import wallet ' +  (name || walletId));
          } else {
            notification.success('Wallet ' + name + ' imported successfully');
          }
          i++;
          if (i==ids.length) {
console.log('[legacyImportService.js.29] DONE'); //TODO
            return cb(null,ids);
          }
        })
      });
    };
    return root;
  });
