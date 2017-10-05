'use strict';
angular.module('copayApp.services').factory('pushNotificationsService', function pushNotificationsService($log, $state, $ionicHistory, sjcl, platformInfo, lodash, appConfigService, profileService, configService) {
  var root = {};
  var isIOS = platformInfo.isIOS;
  var isAndroid = platformInfo.isAndroid;
  var usePushNotifications = platformInfo.isCordova && !platformInfo.isWP;

  var _token = null;

  root.init = function() {
    if (!usePushNotifications || _token) return;
    configService.whenAvailable(function(config) {
      if (!config.pushNotificationsEnabled) return;
    
      $log.debug('Starting push notification registration...'); 

      //Keep in mind the function will return null if the token has not been established yet.
      FCMPlugin.getToken(function(token) {
        $log.debug('Get token for push notifications: ' + token);
        _token = token;
        root.enable();
      }); 
    }); 
  };

  root.updateSubscription = function(walletClient) {
    if (!_token) {
      $log.warn('Push notifications disabled for this device. Nothing to do here.');
      return;
    }
    _subscribe(walletClient);
  };

  root.enable = function() {
    if (!_token) {
      $log.warn('No token available for this device. Cannot set push notifications. Needs registration.');
      return;
    }

    var wallets = profileService.getWallets();
    lodash.forEach(wallets, function(walletClient) {
      _subscribe(walletClient);
    });
  };

  root.disable = function() {
    if (!_token) {
      $log.warn('No token available for this device. Cannot disable push notifications.');
      return;
    }

    var wallets = profileService.getWallets();
    lodash.forEach(wallets, function(walletClient) {
      _unsubscribe(walletClient);
    });
    _token = null;
  };

  root.unsubscribe = function(walletClient) {
    if (!_token) return;
    _unsubscribe(walletClient);
  };

  var _subscribe = function(walletClient) {
    var opts = {
      token : _token,
      platform: isIOS ? 'ios' : isAndroid ? 'android' : null,
      packageName : appConfigService.packageNameId
    };
    walletClient.pushNotificationsSubscribe(opts, function(err) {
      if (err) $log.error(walletClient.name + ': Subscription Push Notifications error. ', JSON.stringify(err));
      else $log.debug(walletClient.name + ': Subscription Push Notifications success.');
    });
  };

  var _unsubscribe = function(walletClient, cb) {
    walletClient.pushNotificationsUnsubscribe(_token, function(err) {
      if (err) $log.error(walletClient.name + ': Unsubscription Push Notifications error. ', JSON.stringify(err));
      else $log.debug(walletClient.name + ': Unsubscription Push Notifications Success.');
    });
  };

  var _openWallet = function(walletIdHashed) {
    var wallets = profileService.getWallets();
    var wallet = lodash.find(wallets, function(w) {
      return (lodash.isEqual(walletIdHashed, sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(w.id))));
    });

    if (!wallet) return;
    
    if (!wallet.isComplete()) {
      return $state.go('tabs.copayers', {
        walletId: wallet.id 
      });
    }

    $state.go('tabs.wallet', {
      walletId: wallet.id
    });
  };

  if (usePushNotifications) {
    
    FCMPlugin.onTokenRefresh(function(token) {
      if (!_token) return;
      $log.debug('Refresh and update token for push notifications...');
      _token = token;
      root.enable();
    });

    FCMPlugin.onNotification(function(data) {
      if (!_token) return;
      $log.debug('New Event Push onNotification: ' + JSON.stringify(data));
      if(data.wasTapped) {
        // Notification was received on device tray and tapped by the user. 
        var walletIdHashed = data.walletId;
        if (!walletIdHashed) return;
        $ionicHistory.nextViewOptions({
          disableAnimate: true,
          historyRoot: true
        });
        $ionicHistory.clearHistory();
        $state.go('tabs.home', {}, {
          'reload': true,
          'notify': $state.current.name == 'tabs.home' ? false : true
        }).then(function() {
          _openWallet(walletIdHashed);
        });
      } else {
        // TODO
        // Notification was received in foreground. Maybe the user needs to be notified. 
      }
    });
  } 

  return root;

});
