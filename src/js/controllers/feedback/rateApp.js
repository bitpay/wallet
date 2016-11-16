'use strict';

angular.module('copayApp.controllers').controller('rateAppController', function($scope, $state, $stateParams, lodash, externalLinkService, configService, gettextCatalog, platformInfo, feedbackService, ongoingProcess, popupService) {
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
      $state.go('tabs.rate.complete', {
        score: $stateParams.score,
        skipped: true
      });
    });
  };

  $scope.$on("$ionicView.beforeEnter", function() {
    if(window.StatusBar){
      $log.debug('Hiding status bar...');
      StatusBar.hide();
    }
  });

  $scope.$on("$ionicView.afterLeave", function() {
    if(window.StatusBar){
      $log.debug('Showing status bar...');
      StatusBar.show();
    }
  });

  $scope.sendFeedback = function() {
    $state.go('tabs.rate.send', {
      score: $scope.score
    });
  };

  $scope.goAppStore = function() {
    var defaults = configService.getDefaults();
    var url;
    if (isAndroid) url = defaults.rateApp.android;
    if (isIOS) url = defaults.rateApp.ios;
    // if (isWP) url = defaults.rateApp.windows; // TODO
    externalLinkService.open(url);
  };
});
