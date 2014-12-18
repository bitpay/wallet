'use strict';

angular.module('copayApp.controllers').controller('IndexController', function($scope, go, isCordova, identityService) {
  $scope.init = function() {

  };

  $scope.resendVerificationEmail = function (cb) {
  	identityService.resendVerificationEmail(cb);
  };

  $scope.swipe = function(invert) {
    go.swipe(invert);
  };

});
