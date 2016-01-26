'use strict';
angular.module('copayApp.services')
  .factory('pushNotificationsService', function($http, $log, isMobile, storageService, configService, lodash, isCordova) {
    var root = {};
    var defaults = configService.getDefaults();
    var usePushNotifications = isCordova && !isMobile.Windows();

    root.pushNotificationsInit = function(walletClients) {
      if (!usePushNotifications) return;

      var push = PushNotification.init(defaults.pushNotifications.config);

      push.on('registration', function(data) {
        $log.debug('Starting push notification registration');
        storageService.setDeviceToken(data.registrationId, function() {
          root.enableNotifications(walletsClients);
        });
      });

      push.on('notification', function(data) {
        $log.debug('Push notification event: ', data.message);
        /* data.message,
         data.title,
         data.count,
         data.sound,
         data.image,
         data.additionalData
        */
      });

      push.on('error', function(e) {
        $log.warn('Error trying to push notifications: ', e);
      });
    };

    root.enableNotifications = function(walletsClients) {
      if (!usePushNotifications) return;

      storageService.getDeviceToken(function(err, token) {
        lodash.forEach(walletsClients, function(walletClient) {
          var opts = {};
          opts.type = isMobile.iOS() ? "ios" : isMobile.Android() ? "android" : null;
          opts.token = token;
          root.subscribe(opts, walletClient, function(err, response) {
            if (err) $log.warn('Subscription error: ' + err.code);
            else $log.debug('Subscribed to push notifications service: ' + JSON.stringify(response));
          });
        });
      });
    }

    root.disableNotifications = function(walletsClients) {
      if (!usePushNotifications) return;

      lodash.forEach(walletsClients, function(walletClient) {
        root.unsubscribe(walletClient, function(err) {
          if (err) $log.warn('Subscription error: ' + err.code);
          else $log.debug('Unsubscribed from push notifications service');
        });
      });
    }

    root.subscribe = function(opts, walletClient, cb) {
      if (!usePushNotifications) return;

      walletClient.pushNotificationsSubscribe(opts, function(err, resp) {
        if (err) return cb(err);
        return cb(null, resp);
      });
    }

    root.unsubscribe = function(walletClient, cb) {
      if (!usePushNotifications) return;

      walletClient.pushNotificationsUnsubscribe(function(err) {
        if (err) return cb(err);
        return cb(null);
      });
    }

    return root;

  });
