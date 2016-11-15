'use strict';

angular.module('copayApp.controllers').controller('rateAppController', function($scope, $state, $stateParams, lodash, externalLinkService, configService, gettextCatalog, platformInfo, feedbackService, ongoingProcess) {
  $scope.score = parseInt($stateParams.score);
  var isAndroid = platformInfo.isAndroid;
  var isIOS = platformInfo.isIOS;
  var isWP = platformInfo.isWP;
  var config = configService.getSync();

  $scope.skip = function() {

    var dataSrc = {
      "Email": lodash.values(config.emailFor)[0] || ' ',
      "Feedback": ' ',
      "Score": $stateParams.score
    };

    ongoingProcess.set('sendingFeedback', true);
    feedbackService.send(dataSrc, function(err) {
      ongoingProcess.set('sendingFeedback', false);
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not send feedback'));
        return;
      }
      $state.go('feedback.complete', {
        score: $stateParams.score,
        skipped: true
      });
    });
  };

  $scope.sendFeedback = function() {
    $state.go('feedback.send', {
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
