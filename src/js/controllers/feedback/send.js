'use strict';

angular.module('copayApp.controllers').controller('sendController', function($scope, $state, $log, $timeout, $stateParams, $ionicNavBarDelegate, gettextCatalog, popupService, configService, lodash, feedbackService, ongoingProcess) {

  $scope.sendFeedback = function(feedback, skip) {

    var config = configService.getSync();

    var dataSrc = {
      "Email": lodash.values(config.emailFor)[0] || ' ',
      "Feedback": skip ? ' ' : feedback,
      "Score": $stateParams.score || ' '
    };

    ongoingProcess.set('sendingFeedback', true);
    feedbackService.send(dataSrc, function(err) {
      ongoingProcess.set('sendingFeedback', false);
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not send feedback'));
        return;
      }
      if (!$stateParams.score) {
        popupService.showAlert(gettextCatalog.getString('Thank you!'), gettextCatalog.getString('A member of the team will review your feedback as soon as possible.'));
        $scope.feedback.value = '';
        $timeout(function() {
          $scope.$apply();
        });
        return;
      }
      $state.go('feedback.complete', {
        score: $stateParams.score,
        skipped: skip
      });
    });
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    $scope.score = parseInt($stateParams.score);
    $scope.feedback = {};

    switch ($scope.score) {
      case 1:
        $scope.reaction = gettextCatalog.getString("Ouch!");
        $scope.comment = gettextCatalog.getString("There's obviously something we're doing wrong.") + ' ' + gettextCatalog.getString("How could we improve your experience?");
        break;
      case 2:
        $scope.reaction = gettextCatalog.getString("Oh no!");
        $scope.comment = gettextCatalog.getString("There's obviously something we're doing wrong.") + ' ' + gettextCatalog.getString("How could we improve your experience?");
        break;
      case 3:
        $scope.reaction = gettextCatalog.getString("Hmm...");
        $scope.comment = gettextCatalog.getString("We'd love to do better.") + ' ' + gettextCatalog.getString("How could we improve your experience?");
        break;
      case 4:
        $scope.reaction = gettextCatalog.getString("Thanks!");
        $scope.comment = gettextCatalog.getString("That's exciting to hear. We'd love to earn that fifth star from you – how could we improve your experience?");
        break;
      case 5:
        $scope.reaction = gettextCatalog.getString("Thank you!");
        $scope.comment = gettextCatalog.getString("We're always looking for ways to improve BitPay.") + ' ' + gettextCatalog.getString("Is there anything we could do better?");
        break;
      default:
        $scope.reaction = gettextCatalog.getString("Feedback!");
        $scope.comment = gettextCatalog.getString("We're always looking for ways to improve BitPay. How could we improve your experience?");
        break;
    }
  });

});
