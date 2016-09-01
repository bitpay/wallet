'use strict';

angular.module('copayApp.controllers').controller('tabHomeController',
  function($rootScope, $timeout, $scope, $state, $ionicScrollDelegate, lodash, profileService, walletService, configService, txFormatService, $ionicModal, $log, platformInfo, storageService) {

    $scope.externalServices = {};
    $scope.bitpayCardEnabled = true; // TODO



    var setPendingTxps = function(txps) {
      if (!txps) {
        $scope.txps = [];
        return;
      }
      $scope.txps = lodash.sortBy(txps, 'createdOn').reverse();
    };



    $scope.updateAllWallets = function() {
      $scope.wallets = profileService.getWallets();
      if (lodash.isEmpty($scope.wallets)) return;

      var i = $scope.wallets.length;
      var j = 0;
      var timeSpan = 60 * 60 * 24 * 7;
      var notifications = [];

      lodash.each($scope.wallets, function(wallet) {
        walletService.getStatus(wallet, {}, function(err, status) {
          if (err) {
            console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
            return;
          }
          wallet.status = status;
        });
      });

      $scope.fetchingNotifications = true;

      profileService.getTxps({
        limit: 3
      }, function(err, txps) {
console.log('[tab-home.js.44:txps:]',txps); //TODO
        if (err) {
          console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
        }
        $scope.txps = txps;
        $ionicScrollDelegate.resize();

        $timeout(function() {
          $scope.$apply();
        }, 1);


        profileService.getNotifications({
          limit: 3
        }, function(err, n) {
          if (err) {
            console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
            return;
          }
          $scope.fetchingNotifications = false;
          $scope.notifications = n;
          $ionicScrollDelegate.resize();

          $timeout(function() {
            $scope.$apply();
          }, 1);
        })
      })
    };

    $scope.updateWallet = function(wallet) {
      $log.debug('Updating wallet:' + wallet.name)
      walletService.getStatus(wallet, {}, function(err, status) {
        if (err) {
          $log.error(err); //TODO
          return;
        }
        wallet.status = status;

        profileService.getNotifications({
          limit: 3
        }, function(err, n) {
          if (err) {
            console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
            return;
          }
          $scope.notifications = n;
          $ionicScrollDelegate.resize();

          $timeout(function() {
            $scope.$apply();
          }, 1);
        })
      });
    };

    $scope.nextStep = function() {
      lodash.each(['AmazonGiftCards', 'BitpayCard', 'BuyAndSell'], function(service) {
        storageService.getNextStep(service, function(err, value) {
          $scope.externalServices[service] = value ? true : false;
          $ionicScrollDelegate.resize();
        });
      });
    };

    var listeners = [
      $rootScope.$on('bwsEvent', function(e, walletId, type, n) {
        var wallet = profileService.getWallet(walletId);
        $scope.updateWallet(wallet);
      }),
      $rootScope.$on('Local/TxAction', function(e, walletId) {
        var wallet = profileService.getWallet(walletId);
        $scope.updateWallet(wallet);
      }),
    ];

    $scope.$on('$destroy', function() {
      lodash.each(listeners, function(x) {
        x();
      });
    });

    configService.whenAvailable(function() {
      var config = configService.getSync();
      var isWindowsPhoneApp = platformInfo.isWP && isCordova;
      $scope.glideraEnabled = config.glidera.enabled && !isWindowsPhoneApp;
      $scope.coinbaseEnabled = config.coinbase.enabled && !isWindowsPhoneApp;
    });

  });
