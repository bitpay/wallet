'use strict';

angular.module('copayApp.services').factory('fingerprintService', function($log, gettextCatalog, configService) {
  var root = {};

  var requestTouchId = function(cb) {
    try {
      window.plugins.touchid.verifyFingerprint(
        gettextCatalog.getString('Scan your fingerprint please'),
        function(msg) {
          $log.debug('Touch ID OK');
          return cb();
        },
        function(msg) {
          $log.debug('Touch ID Failed:' + JSON.stringify(msg));
          return cb(gettextCatalog.getString('Touch ID Failed') + ': ' + msg.localizedDescription);
        }
      );
    } catch (e) {
      $log.debug('Touch ID Failed:' + JSON.stringify(e));
      return cb(gettextCatalog.getString('Touch ID Failed'));
    };
  };

  root.isAvailable = function(client) {
    var config = configService.getSync();
    config.touchIdFor = config.touchIdFor || {};
    return (window.touchidAvailable && config.touchIdFor[client.credentials.walletId]);
  };

  root.check = function(client, cb) {
    if (root.isAvailable(client)) {
      requestTouchId(cb);
    } else {
      return cb();
    }
  };

  return root;
});
