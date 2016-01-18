'use strict';
angular.module('copayApp.services')
  .factory('pushNotificationsService', function($http, $log, isMobile, profileService, storageService, configService, lodash) {
    var root = {};
    var defaults = configService.getDefaults();

    root.pushNotificationsInit = function() {
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
      storageService.getDeviceToken(function(err, token) {
        lodash.forEach(profileService.getWallets('testnet'), function(wallet) {
          var opts = {};
          opts.type = isMobile.iOS() ? "ios" : isMobile.Android() ? "android" : null;
          opts.token = token;
          root.subscribe(opts, wallet.id, function(err, response) {
            if (err) $log.warn('Error: ' + err.code);
            $log.debug('Suscribed: ' + JSON.stringify(response));
          });
        });
      });
    }

    root.disableNotifications = function() {
      lodash.forEach(profileService.getWallets('testnet'), function(wallet) {
        root.unsubscribe(wallet.id, function(err, response) {
          if (err) $log.warn('Error: ' + err.code);
          $log.debug('Unsubscribed: ' + response);
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
      walletClient.pushNotificationsUnsubscribe(function(err, resp) {
        if (err) return cb(err);
        return cb(null, resp);
      });
    }

    return root;

  });
