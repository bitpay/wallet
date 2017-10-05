'use strict';

angular.module('copayApp.controllers').controller('sendController', function($scope, $state, $log, $timeout, $stateParams, $ionicNavBarDelegate, $ionicHistory, $ionicConfig, $window, gettextCatalog, popupService, configService, lodash, feedbackService, ongoingProcess, platformInfo, appConfigService) {

  $scope.sendFeedback = function(feedback, goHome) {

    var config = configService.getSync();

    var dataSrc = {
      "Email": lodash.values(config.emailFor)[0] || ' ',
      "Feedback": goHome ? ' ' : feedback,
      "Score": $stateParams.score || ' ',
      "AppVersion": $window.version,
      "Platform": ionic.Platform.platform(),
      "DeviceVersion": ionic.Platform.version()
    };

    if (!goHome) ongoingProcess.set('sendingFeedback', true);
    feedbackService.send(dataSrc, function(err) {
      if (goHome) return;
      ongoingProcess.set('sendingFeedback', false);
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Feedback could not be submitted. Please try again later.'));
        return;
      }
      if (!$stateParams.score) {
        popupService.showAlert(gettextCatalog.getString('Thank you!'), gettextCatalog.getString('A member of the team will review your feedback as soon as possible.'), function() {
          $scope.feedback.value = '';
          $ionicHistory.nextViewOptions({
            disableAnimate: false,
            historyRoot: true
          });
          $ionicHistory.goBack();
        }, gettextCatalog.getString('Finish'));
        return;
      }
      $state.go('tabs.rate.complete', {
        score: $stateParams.score
      });
    });
    if (goHome) $state.go('tabs.home');
  };

  $scope.$on("$ionicView.beforeLeave", function(event, data) {
    $ionicConfig.views.swipeBackEnabled(true);
  });

  $scope.$on("$ionicView.enter", function(event, data) {
    if ($scope.score)
      $ionicConfig.views.swipeBackEnabled(false);
  });

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.isCordova = platformInfo.isCordova;
    $scope.score = (data.stateParams && data.stateParams.score) ? parseInt(data.stateParams.score) : null;
    $scope.feedback = {};

    switch ($scope.score) {
      case 1:
        $scope.reaction = "Ouch!";
        $scope.comment = gettextCatalog.getString("There's obviously something we're doing wrong.") + ' ' + gettextCatalog.getString("How could we improve your experience?");
        break;
      case 2:
        $scope.reaction = gettextCatalog.getString("Oh no!");
        $scope.comment = gettextCatalog.getString("There's obviously something we're doing wrong.") + ' ' + gettextCatalog.getString("How could we improve your experience?");
        break;
      case 3:
        $scope.reaction = "Hmm...";
        $scope.comment = gettextCatalog.getString("We'd love to do better.") + ' ' + gettextCatalog.getString("How could we improve your experience?");
        break;
      case 4:
        $scope.reaction = gettextCatalog.getString("Thanks!");
        $scope.comment = gettextCatalog.getString("That's exciting to hear. We'd love to earn that fifth star from you – how could we improve your experience?");
        break;
      case 5:
        $scope.reaction = gettextCatalog.getString("Thank you!");
        $scope.comment = gettextCatalog.getString("We're always looking for ways to improve {{appName}}.", {
          appName: appConfigService.nameCase
        }) + ' ' + gettextCatalog.getString("Is there anything we could do better?");
        break;
      default:
        $scope.justFeedback = true;
        $scope.comment = gettextCatalog.getString("We're always looking for ways to improve {{appName}}. How could we improve your experience?", {
          appName: appConfigService.nameCase
        });
        break;
    }
  });

  $scope.$on("$ionicView.afterEnter", function() {
    $scope.showForm = true;
  });

  $scope.goBack = function() {
    $ionicHistory.nextViewOptions({
      disableAnimate: false,
      historyRoot: true
    });
    $ionicHistory.goBack();
  };

});
