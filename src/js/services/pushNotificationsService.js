'use strict';
angular.module('copayApp.services')
  .factory('pushNotificationsService', function($http, $log, isMobile, profileService, storageService, configService, lodash) {
    var root = {};
    var defaults = configService.getDefaults();
    var usePushNotifications = isMobile.iOS() || isMobile.Android();

    root.pushNotificationsInit = function() {
      if (!usePushNotifications) return;

      var push = PushNotification.init(defaults.pushNotifications.config);

      push.on('registration', function(data) {
        $log.debug('Starting push notification registration');
        storageService.setDeviceToken(data.registrationId, function() {
          root.enableNotifications();
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

    root.enableNotifications = function() {
      if (!usePushNotifications) return;

      storageService.getDeviceToken(function(err, token) {
        lodash.forEach(profileService.getWallets('testnet'), function(wallet) {
          var opts = {};
          opts.type = isMobile.iOS() ? "ios" : isMobile.Android() ? "android" : null;
          opts.token = token;
          root.subscribe(opts, wallet.id, function(err, response) {
            if (err) $log.warn('Subscription error: ' + err.code);
            else $log.debug('Subscribed to push notifications service: ' + JSON.stringify(response));
          });
        });
      });
    }

    root.disableNotifications = function() {
      if (!usePushNotifications) return;

      lodash.forEach(profileService.getWallets('testnet'), function(wallet) {
        root.unsubscribe(wallet.id, function(err) {
          if (err) $log.warn('Subscription error: ' + err.code);
          else $log.debug('Unsubscribed from push notifications service');
        });
      });
    }

    root.subscribe = function(opts, walletId, cb) {

      var walletClient = profileService.getClient(walletId);
      walletClient.pushNotificationsSubscribe(opts, function(err, resp) {
        if (err) return cb(err);
        return cb(null, resp);
      });
    }

    root.unsubscribe = function(walletId, cb) {

      var walletClient = profileService.getClient(walletId);
      walletClient.pushNotificationsUnsubscribe(function(err) {
        if (err) return cb(err);
        return cb(null);
      });
    }

    return root;

  });
