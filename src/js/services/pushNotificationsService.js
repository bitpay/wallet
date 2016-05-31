'use strict';
angular.module('copayApp.services')
  .factory('pushNotificationsService', function($log, platformInfo, storageService, configService, lodash) {
    var root = {};
    var isCordova = platformInfo.isCordova;
    var isWP = platformInfo.isWP;
    var isIOS = platformInfo.isIOS;
    var isAndroid = platformInfo.isAndroid;

    var usePushNotifications = isCordova && !isWP;

    root.init = function(walletsClients) {
      var defaults = configService.getDefaults();
      var push = PushNotification.init(defaults.pushNotifications.config);

      push.on('registration', function(data) {
        if (root.token) return;
        $log.debug('Starting push notification registration');
        root.token = data.registrationId;
        var config = configService.getSync();
        if (config.pushNotifications.enabled) root.enableNotifications(walletsClients);
      });

      return push;
    }

    root.enableNotifications = function(walletsClients) {
      if (!usePushNotifications) return;

      var config = configService.getSync();
      if (!config.pushNotifications.enabled) return;

      if (!root.token) {
        $log.warn('No token available for this device. Cannot set push notifications');
        return;
      }

      lodash.forEach(walletsClients, function(walletClient) {
        var opts = {};
        opts.type = isIOS ? "ios" : isAndroid ? "android" : null;
        opts.token = root.token;
        root.subscribe(opts, walletClient, function(err, response) {
          if (err) $log.warn('Subscription error: ' + err.message + ': ' + JSON.stringify(opts));
          else $log.debug('Subscribed to push notifications service: ' + JSON.stringify(response));
        });
      });
    }

    root.disableNotifications = function(walletsClients) {
      if (!usePushNotifications) return;

      lodash.forEach(walletsClients, function(walletClient) {
        root.unsubscribe(walletClient, function(err) {
          if (err) $log.warn('Unsubscription error: ' + err.message);
          else $log.debug('Unsubscribed from push notifications service');
        });
      });
    }

    root.subscribe = function(opts, walletClient, cb) {
      if (!usePushNotifications) return cb();

      var config = configService.getSync();
      if (!config.pushNotifications.enabled) return;

      walletClient.pushNotificationsSubscribe(opts, function(err, resp) {
        if (err) return cb(err);
        return cb(null, resp);
      });
    }

    root.unsubscribe = function(walletClient, cb) {
      if (!usePushNotifications) return cb();

      walletClient.pushNotificationsUnsubscribe(function(err) {
        if (err) return cb(err);
        return cb(null);
      });
    }

    return root;

  });
