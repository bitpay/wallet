'use strict';

angular.module('copayApp.controllers').controller('IndexController', function($scope, $timeout, go, isCordova, identityService, notification) {
  $scope.init = function() {

  };

  $scope.resendVerificationEmail = function() {
    $scope.loading = true; 
    identityService.resendVerificationEmail(function(err) {
      if (err) {
        notification.error('Could not send email', 'There was a problem sending the verification email.'); 
      }
      else {
        notification.success('Email sent', 'Check your inbox and confirms the email');
        $scope.hideReSendButton = true;
      }
      $scope.loading = null;
      $timeout(function() {
        $scope.$digest();
      }, 1);
      return;
    });
  };

  $scope.swipe = function(invert) {
    go.swipe(invert);
  };

});
