'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $timeout, $scope, $state, lodash, profileService, walletService, configService, txFormatService, $ionicModal, $log, platformInfo) {
    var self = this;

    var setNotifications = function(notifications) {

      var n = walletService.processNotifications(notifications, 5);

      $scope.notifications = n;
      $scope.notificationsMore = notifications.length > 5 ? notifications.length - 5  : null;
      $timeout(function() {
        $scope.$apply();
      }, 1);

    };



    self.updateAllWallets = function() {
      $scope.wallets = profileService.getWallets();

      var i = $scope.wallets.length, j =0;
//      var timeSpan = 60 * 60 * 24 * 7;
      var timeSpan = 60 * 60 * 24 * 1;
      var notifications = [];

      $scope.fetchingNotifications = true;

      lodash.each($scope.wallets, function(wallet) {

        walletService.getStatus(wallet, {}, function(err, status) {
          if (err) {
            console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
            return;
          }
          wallet.status = status;
        });

        walletService.getNotifications(wallet, {
          timeSpan: timeSpan
        }, function(err, n) {
          if (err) {
            console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
            return;
          }
          notifications.push(n);
          if (++j == i) {
            $scope.fetchingNotifications = false;
            setNotifications(lodash.compact(lodash.flatten(notifications)));
          };
        });

      });
    }

    self.updateWallet = function(wallet) {
      $log.debug('Updating wallet:' + wallet.name)
      walletService.getStatus(wallet, {}, function(err, status) {
        if (err) {
          console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
          return;
        }
        wallet.status = status;
        $timeout(function() {
          $scope.$apply();
        }, 1);
      });
    };



    self.updateAllWallets();
    $scope.bitpayCardEnabled = true; // TODO

    var listeners = [
      $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
        var wallet = profileService.getWallet(walletId);
        self.updateWallet(wallet);
      }),
      $rootScope.$on('Local/TxAction', function(e, walletId) {
        var wallet = profileService.getWallet(walletId);
        self.updateWallet(wallet);
      }),
    ];

    $scope.$on('$destroy', function() {
      lodash.each(listeners, function(x) {
        x();
      });
    });

    configService.whenAvailable(function() {
      var config = configService.getSync();
      var glideraEnabled = config.glidera.enabled;
      var coinbaseEnabled = config.coinbase.enabled;
      var isWindowsPhoneApp = platformInfo.isWP && isCordova;
      $scope.buyAndSellEnabled = !isWindowsPhoneApp && (glideraEnabled || coinbaseEnabled);
    });

  });
