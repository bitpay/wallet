'use strict';

angular.module('copayApp.services').factory('emailService', function($log, configService, lodash, walletService, profileService) {
  var root = {};

  root.updateEmail = function(opts) {
    opts = opts || {};
    if (!opts.email) return;

    var wallets = profileService.getWallets();

    configService.set({
      emailFor: null, // Backward compatibility
      emailNotifications: {
        enabled: opts.enabled,
        email: opts.enabled ? opts.email : null
      }
    }, function(err) {
      if (err) $log.warn(err);
      walletService.updateRemotePreferences(wallets);
    });
  };

  root.getEmailIfEnabled = function(config) {
    config = config || configService.getSync();
    
    if (config.emailNotifications) {
      if (!config.emailNotifications.enabled) return;

      if (config.emailNotifications.email) 
        return config.emailNotifications.email;
    }
    
    if (lodash.isEmpty(config.emailFor)) return;
    
    // Backward compatibility
    var emails = lodash.values(config.emailFor);
    for(var i = 0; i < emails.length; i++) {
      if (emails[i] !== null && typeof emails[i] !== 'undefined') {
        return emails[i];
      }
    }
  };

  root.init = function() {
    configService.whenAvailable(function(config) {

      if (config.emailNotifications && config.emailNotifications.enabled) {
        
        // If email already set
        if (config.emailNotifications.email) return;

        var currentEmail = root.getEmailIfEnabled(config);

        root.updateEmail({
          enabled: currentEmail ? true : false,
          email: currentEmail
        });
      }
    });
  };

  return root;
});
