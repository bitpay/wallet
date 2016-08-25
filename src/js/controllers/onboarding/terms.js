'use strict';

angular.module('copayApp.controllers').controller('termsController', function($scope, $log, $state, uxLanguage, profileService) {
  $scope.lang = uxLanguage.currentLanguage;

  $scope.confirm = function() {
    profileService.setDisclaimerAccepted(function(err) {
      if (err) $log.error(err);
      else {
        $state.go('tabs.home');
      }
    });
  };

});
