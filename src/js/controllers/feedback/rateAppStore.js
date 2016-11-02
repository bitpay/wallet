'use strict';

angular.module('copayApp.controllers').controller('rateAppStoreController', function($scope, $state, $stateParams, externalLinkService, configService, gettextCatalog, platformInfo) {
  $scope.score = parseInt($stateParams.score);
  var isAndroid = platformInfo.isAndroid;
  var isIOS = platformInfo.isIOS;
  var isWP = platformInfo.isWP;
  var config = configService.getSync();

  $scope.skip = function() {
    $state.go('feedback.thanks', {
      score: $scope.score,
      skipped: true
    });
  };

  $scope.sendFeedback = function() {
    $state.go('feedback.sendFeedback', {
      score: $scope.score
    });
  };

  $scope.goAppStore = function() {
    var url;
    if (isAndroid) url = config.rateApp.android;
    if (isIOS) url = config.rateApp.ios;
    // if (isWP) url = config.rateApp.ios; TODO
    var title = gettextCatalog.getString('Rate the app');
    var message = gettextCatalog.getString('You must go to the official website of the app to rate it');
    var okText = gettextCatalog.getString('Go');
    var cancelText = gettextCatalog.getString('Cancel');
    externalLinkService.open(url, true, title, message, okText, cancelText);
  };
});
