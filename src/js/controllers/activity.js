'use strict';

angular.module('copayApp.controllers').controller('activityController',
  function($rootScope, $timeout, $scope, $state, lodash, profileService, walletService, configService, txFormatService, $ionicModal, $log, platformInfo) {
    var self = this;

    var setNotifications = function(notifications) {
      var n = walletService.processNotifications(notifications);

      $scope.notifications = n;
      $timeout(function() {
        $scope.$apply();
      }, 1);
    };




    $scope.init = function() {
      $scope.wallets = profileService.getWallets();

      var i = $scope.wallets.length,
        j = 0;
     // var timeSpan = 60 * 60 * 24 * 7; TODO
      var timeSpan = 60 * 60 * 6;
      var notifications = [];

      $scope.fetchingNotifications = true;

      lodash.each($scope.wallets, function(wallet) {

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
  });
