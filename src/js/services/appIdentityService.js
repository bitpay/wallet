'use strict';

angular.module('copayApp.services').factory('appIdentityService', function($log, lodash, storageService, bitauthService) {
  var root = {};

  root.getIdentity = function(network, cb) {
    var pubkey, sin, isNew;
    storageService.getAppIdentity(network, function(err, data) {
      if (err) return cb(err);
      var appIdentity = data || {};
      if (lodash.isEmpty(appIdentity) || (appIdentity && !appIdentity.priv)) {
        isNew = true;
        appIdentity = bitauthService.generateSin();
      }
      try {
        pubkey = bitauthService.getPublicKeyFromPrivateKey(appIdentity.priv);
        sin = bitauthService.getSinFromPublicKey(pubkey);
        if (isNew)
          storageService.setAppIdentity(network, JSON.stringify(appIdentity), function(err) {});
      }
      catch (e) {
        $log.error(e);
        return cb(e);
      };
      return cb(null, appIdentity);
    });
  };

  return root;
  
});