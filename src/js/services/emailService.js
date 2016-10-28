'use strict';

angular.module('copayApp.services').factory('emailService', function($log, configService, profileService, lodash, walletService) {
  var root = {};

  root.enableEmailNotifications = function(val) {
    val = val || false;

    var config = configService.getSync();

    if (!config.emailFor) {
      $log.debug('No email configuration available');
      return;
    }

    var keys = lodash.keys(config.emailFor);
    var wallets = lodash.map(keys, function(k) {
      return profileService.getWallet(k);
    });

    if (!wallets) {
      $log.debug('No wallets found');
      return;
    }

    lodash.each(wallets, function(w) {
      walletService.updateRemotePreferences(w, {
        email: val ? config.emailFor[w.credentials.walletId] : null
      }, function(err) {
        if (err) $log.warn(err);
      });
    });
  };

  return root;
});
