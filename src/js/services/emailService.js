'use strict';

angular.module('copayApp.services').factory('emailService', function($log, configService, profileService, lodash, walletService) {
  var root = {};

  root.enableEmailNotifications = function(opts) {
    opts = opts || {};

    var wallets = profileService.getWallets();
    var keys = lodash.map(wallets, function(w) {
      return w.credentials.walletId;
    });

    lodash.each(wallets, function(w) {
      walletService.updateRemotePreferences(w, {
        email: opts.enabled ? opts.email : null
      }, function(err) {
        if (err) $log.warn(err);
      });
    });

    var config = configService.getSync();
    if (!config.emailFor)
      config.emailFor = {};

    lodash.each(keys, function(k) {
      config.emailFor[k] = opts.email;
    });

    if (!opts.enabled) return;

    configService.set({
      emailFor: config.emailFor
    }, function(err) {
      if (err) $log.debug(err);
    });
  };

  return root;
});
