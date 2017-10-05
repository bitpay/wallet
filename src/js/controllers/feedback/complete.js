'use strict';

angular.module('copayApp.controllers').controller('completeController', function($scope, $stateParams, $timeout, $log, $ionicHistory, $state, $ionicNavBarDelegate, $ionicConfig, platformInfo, configService, storageService, lodash, appConfigService, gettextCatalog) {
  $scope.isCordova = platformInfo.isCordova;
  $scope.title = gettextCatalog.getString("Share {{appName}}", {
    appName: appConfigService.nameCase
  });

  var defaults = configService.getDefaults();
  var downloadUrl = appConfigService.name == 'copay' ? defaults.download.copay.url : defaults.download.bitpay.url;

  function quickFeedback(cb) {
    window.plugins.spinnerDialog.show();
    $timeout(window.plugins.spinnerDialog.hide, 300);
    $timeout(cb, 20);
  }

  $scope.shareFacebook = function() {
    quickFeedback(function() {
      window.plugins.socialsharing.shareVia($scope.shareFacebookVia, null, null, null, downloadUrl);
    });
  };

  $scope.shareTwitter = function() {
    quickFeedback(function() {
      window.plugins.socialsharing.shareVia($scope.shareTwitterVia, null, null, null, downloadUrl);
    });
  };

  $scope.shareGooglePlus = function() {
    quickFeedback(function() {
      window.plugins.socialsharing.shareVia($scope.shareGooglePlusVia, downloadUrl);
    });
  };

  $scope.shareEmail = function() {
    quickFeedback(function() {
      window.plugins.socialsharing.shareViaEmail(downloadUrl);
    });
  };

  $scope.shareWhatsapp = function() {
    quickFeedback(function() {
      window.plugins.socialsharing.shareViaWhatsApp(downloadUrl);
    });
  };

  $scope.shareMessage = function() {
    quickFeedback(function() {
      window.plugins.socialsharing.shareViaSMS(downloadUrl);
    });
  };

  $scope.$on("$ionicView.beforeLeave", function() {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.$on("$ionicView.enter", function() {
    if (!$scope.fromSettings)
      $ionicConfig.views.swipeBackEnabled(false);
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.score = (data.stateParams && data.stateParams.score) ? parseInt(data.stateParams.score) : null;
    $scope.skipped = (data.stateParams && data.stateParams.skipped) ? true : false;
    $scope.rated = (data.stateParams && data.stateParams.rated) ? true : false;
    $scope.fromSettings = (data.stateParams && data.stateParams.fromSettings) ? true : false;

    if (!$scope.fromSettings) {
      $ionicNavBarDelegate.showBackButton(false);
    } else {
      $ionicNavBarDelegate.showBackButton(true);
    }

    storageService.getFeedbackInfo(function(error, info) {
      var feedbackInfo = lodash.isString(info) ? JSON.parse(info) : null;
      feedbackInfo.sent = true;
      storageService.setFeedbackInfo(JSON.stringify(feedbackInfo), function() {});
    });

    if (!$scope.isCordova) return;
    $scope.animate = true;

    window.plugins.socialsharing.available(function(isAvailable) {
      // the boolean is only false on iOS < 6
      $scope.socialsharing = isAvailable;
      if (isAvailable) {
        window.plugins.socialsharing.canShareVia('com.apple.social.facebook', 'msg', null, null, null, function(e) {
          $scope.shareFacebookVia = 'com.apple.social.facebook';
          $scope.facebook = true;
        }, function(e) {
          window.plugins.socialsharing.canShareVia('com.facebook.katana', 'msg', null, null, null, function(e) {
            $scope.shareFacebookVia = 'com.facebook.katana';
            $scope.facebook = true;
          }, function(e) {
            $log.debug('facebook error: ' + e);
            $scope.facebook = false;
          });
        });
        window.plugins.socialsharing.canShareVia('com.apple.social.twitter', 'msg', null, null, null, function(e) {
          $scope.shareTwitterVia = 'com.apple.social.twitter';
          $scope.twitter = true;
        }, function(e) {
          window.plugins.socialsharing.canShareVia('com.twitter.android', 'msg', null, null, null, function(e) {
            $scope.shareTwitterVia = 'com.twitter.android';
            $scope.twitter = true;
          }, function(e) {
            $log.debug('twitter error: ' + e);
            $scope.twitter = false;
          });
        });
        window.plugins.socialsharing.canShareVia('com.google.android.apps.plus', 'msg', null, null, null, function(e) {
          $scope.shareGooglePlusVia = 'com.google.android.apps.plus';
          $scope.googleplus = true;
        }, function(e) {
          $log.debug('googlePlus error: ' + e);
          $scope.googleplus = false;
        });
        window.plugins.socialsharing.canShareViaEmail(function(e) {
          $scope.email = true;
        }, function(e) {
          $log.debug('email error: ' + e);
          $scope.email = false;
        });
        window.plugins.socialsharing.canShareVia('whatsapp', 'msg', null, null, null, function(e) {
          $scope.whatsapp = true;
        }, function(e) {
          $log.debug('whatsapp error: ' + e);
          $scope.whatsapp = false;
        });
      }
    }, 100);
  });

  $scope.close = function() {
    $ionicHistory.nextViewOptions({
      disableAnimate: false,
      historyRoot: true
    });
    if ($scope.score == 5) $ionicHistory.goBack(-3);
    else $ionicHistory.goBack(-2);
  };
});
