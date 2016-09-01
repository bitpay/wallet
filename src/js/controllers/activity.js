'use strict';

angular.module('copayApp.controllers').controller('activityController',
  function($rootScope, $timeout, $scope, $state, lodash, profileService, walletService, configService, txFormatService, $ionicModal, $log, platformInfo) {
    var self = this;


    $scope.init = function() {
      $scope.fetchingNotifications = true;
      profileService.getNotifications(50, function(err, n) {
        if (err) {
          console.log('[tab-home.js.35:err:]', $log.error(err)); //TODO
          return;
        }
        $scope.fetchingNotifications = false;
        $scope.notifications = n;
        $timeout(function() {
          $scope.$apply();
        }, 1);
      });
    }
  });
