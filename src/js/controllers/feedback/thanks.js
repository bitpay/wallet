'use strict';

angular.module('copayApp.controllers').controller('thanksController', function($scope, $stateParams, platformInfo, configService, storageService) {
  $scope.score = parseInt($stateParams.score);
  $scope.skipped = $stateParams.skipped == 'false' ? false : true;
  $scope.isCordova = platformInfo.isCordova;
  var config = configService.getSync();

  $scope.shareFacebook = function() {
    window.plugins.socialsharing.shareViaFacebook(config.download.url, null, null, null);
  };

  $scope.shareTwitter = function() {
    window.plugins.socialsharing.shareVia('com.apple.social.twitter', config.download.url, null, null, 'http://www.x-services.nl', null, null);
  };

  $scope.shareGooglePlus = function() {
    window.plugins.socialsharing.shareVia('com.google.android.apps.plus', config.download.url, null, null, null);
  };

  $scope.shareEmail = function() {
    window.plugins.socialsharing.shareViaEmail(config.download.url, null, null, null);
  };

  $scope.shareWhatsapp = function() {
    window.plugins.socialsharing.shareViaWhatsApp(config.download.url, null, null, null);
  };

  $scope.shareMessage = function() {
    window.plugins.socialsharing.shareViaSMS(config.download.url, null, null, null);
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    storageService.setRateCardFlag('true', function() {});
    if (!$scope.isCordova) return;

    window.plugins.socialsharing.available(function(isAvailable) {
      // the boolean is only false on iOS < 6
      $scope.socialsharing = isAvailable;
      if (isAvailable) {

        window.plugins.socialsharing.canShareVia('com.apple.social.facebook', 'msg', null, null, null, function(e) {
          $scope.facebook = true;
        }, function(e) {
          $scope.facebook = false;
        });
        window.plugins.socialsharing.canShareVia('com.apple.social.twitter', 'msg', null, null, null, function(e) {
          $scope.twitter = true;
        }, function(e) {
          $scope.twitter = false;
        });
        window.plugins.socialsharing.canShareVia('com.google.android.apps.plus', 'msg', null, null, null, function(e) {
          $scope.googleplus = true;
        }, function(e) {
          $scope.googleplus = false;
        })
        window.plugins.socialsharing.canShareViaEmail(function(e) {
          $scope.email = true;
        }, function(e) {
          $scope.email = false;
        })
        window.plugins.socialsharing.canShareVia('whatsapp', 'msg', null, null, null, function(e) {
          $scope.whatsapp = true;
        }, function(e) {
          $scope.whatsapp = false;
        })
        window.plugins.socialsharing.canShareVia('sms', 'msg', null, null, null, function(e) {
          $scope.sms = true;
        }, function(e) {
          $scope.sms = false;
        })
      }
    });
  });
});
