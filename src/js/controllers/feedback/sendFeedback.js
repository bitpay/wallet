'use strict';

angular.module('copayApp.controllers').controller('sendFeedbackController', function($scope, $state, $log, $stateParams, gettextCatalog, popupService, configService, lodash, feedbackService, ongoingProcess) {
  $scope.score = parseInt($stateParams.score);
  switch ($scope.score) {
    case 1:
      $scope.reaction = gettextCatalog.getString("Ouch!");
      $scope.comment = gettextCatalog.getString("There's obviously something we're doing wrong.");
      break;
    case 2:
      $scope.reaction = gettextCatalog.getString("Oh no!");
      $scope.comment = gettextCatalog.getString("There's obviously something we're doing wrong.");
      break;
    case 3:
      $scope.reaction = gettextCatalog.getString("Thanks!");
      $scope.comment = gettextCatalog.getString("We're always looking for ways to improve BitPay wallet.");
      break;
    case 4:
      $scope.reaction = gettextCatalog.getString("Thanks!");
      $scope.comment = gettextCatalog.getString("That's exciting to hear. We'd love to earn that fifth star from you.");
      break;
    case 5:
      $scope.reaction = gettextCatalog.getString("Feedback!");
      $scope.comment = gettextCatalog.getString("We're always looking for ways to improve BitPay wallet.");
      break;
  }

  $scope.sendFeedback = function(feedback, skip) {

    var config = configService.getSync();

    var dataSrc = {
      "Email": lodash.values(config.emailFor)[0] || ' ',
      "Feedback": skip ? ' ' : feedback,
      "Score": $stateParams.score
    };

    ongoingProcess.set('sendingFeedback', true);
    feedbackService.send(dataSrc, function(err) {
      ongoingProcess.set('sendingFeedback', false);
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not send feedback'));
        return;
      }
      $state.go('feedback.thanks', {
        score: $stateParams.score,
        skipped: skip
      });
    });
  };

});
