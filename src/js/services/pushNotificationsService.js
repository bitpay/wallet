'use strict';
angular.module('copayApp.services')
  .factory('pushNotificationsService', function($http, $log, profileService, storageService, lodash) {
    var root = {};

    root.pushNotificationsInit = function() {

      var push = PushNotification.init({
        android: {
          senderID: "959259672122"
        },
        ios: {
          alert: "true",
          badge: true,
          sound: 'false'
        },
        windows: {}
      });

      push.on('registration', function(data) {
        storageService.setDeviceToken(data.registrationId, function() {
          root.enableNotifications();
        });
      });

      push.on('notification', function(data) {
        $log.debug('Notification event: ', data.message);
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
          opts.user = wallets.id;
          opts.type = (navigator.userAgent.match(/iPhone/i)) == "iPhone" ? "ios" : (navigator.userAgent.match(/Android/i)) == "Android" ? "android" : null;
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
      return $http.post('http://192.168.1.121:8000/subscribe', opts);
    }

    root.unsubscribe = function(user) {
      return $http.post('http://192.168.1.121:8000/unsubscribe', {
        user: user
      });
    }

    root.unsubscribeAll = function(token) {
      return $http.post('http://192.168.1.121:8000/unsubscribe', {
        token: token
      });
    }

    return root;

  });
