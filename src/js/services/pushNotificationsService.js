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
        lodash.forEach(profileService.getWallets('testnet'), function(wallets) {
          var opts = {};
          opts.user = wallets.id + '$' + wallets.copayerId;
          opts.type = isMobile.iOS() ? "ios" : isMobile.Android() ? "android" : null;
          opts.token = token;
          root.subscribe(opts).then(function(response) {
              $log.debug('Suscribed: ' + response.status);
            },
            function(err) {
              $log.warn('Error: ' + err.status);
            });
        });
      });
    }

    root.disableNotifications = function() {
      storageService.getDeviceToken(function(err, token) {
        root.unsubscribeAll(token).then(function(response) {
            $log.debug('Unsubscribed: ' + response.status);
          },
          function(err) {
            $log.warn('Error: ' + err.status);
          });
      });
    }

    root.subscribe = function(opts) {
      return $http.post(defaults.pushNotifications.url + '/subscribe', opts);
    }

    root.unsubscribe = function(user) {
      return $http.post(defaults.pushNotifications.url + '/unsubscribe', {
        user: user
      });
    }

    root.unsubscribeAll = function(token) {
      return $http.post(defaults.pushNotifications.url + '/unsubscribe', {
        token: token
      });
    }

    return root;

  });
