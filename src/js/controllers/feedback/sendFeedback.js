'use strict';

angular.module('copayApp.controllers').controller('sendFeedbackController', function($scope, $state, $log, $http, $httpParamSerializer, $stateParams, gettextCatalog, popupService, configService, lodash) {
  var URL = "https://docs.google.com/forms/d/e/1FAIpQLSfHHAKb-CKjQnsuC_36IFaXlGsqLd5tZh79ywNfSADoVsw-gQ/formResponse";
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
      "entry.490635314": lodash.values(config.emailFor)[0] || ' ',
      "entry.1447064148": skip ? ' ' : feedback,
      "entry.2142850951": $stateParams.score
    };

    $http(_post(dataSrc)).then(function(data) {
      $log.info("SUCCESS: Feedback sent");
      $state.go('feedback.thanks', {
        score: $stateParams.score,
        skipped: skip
      });
    }, function(data) {
      $log.info("ERROR: Feedback sent anyway.");
      $state.go('feedback.thanks', {
        score: $stateParams.score,
        skipped: skip
      });
    });
  };

  var _post = function(dataSrc) {
    return {
      method: 'POST',
      url: URL,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      data: $httpParamSerializer(dataSrc)
    };
  };

});
