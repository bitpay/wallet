'use strict';

angular.module('copayApp.services').factory('emailService', function($log, configService, profileService, lodash, walletService) {
  var root = {};

  root.enableEmailNotifications = function(opts) {
    opts = opts || {};

    var wallets = profileService.getWallets();
    var keys = lodash.map(wallets, function(w) {
      return w.credentials.walletId;
    });

    walletService.updateRemotePreferences(wallets, {
      email: opts.enabled ? opts.email : null
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
