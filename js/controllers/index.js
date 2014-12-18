'use strict';

angular.module('copayApp.controllers').controller('IndexController', function($scope, go, isCordova, identityService, notification) {
  $scope.init = function() {

  };

  $scope.resendVerificationEmail = function() {
    identityService.resendVerificationEmail(function(err) {
      if (err) {
        notification.error('Could not send email', 'There was a problem sending the verification email.');
        setTimeout(function() {
          $scope.$digest();
        }, 1);
        return;
      }
    });
  };

  $scope.swipe = function(invert) {
    go.swipe(invert);
  };

});
