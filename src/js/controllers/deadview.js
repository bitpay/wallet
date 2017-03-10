'use strict';

angular.module('copayApp.controllers').controller('deadviewController', function($state, $scope, $ionicHistory, fingerprintService) {

  $scope.requestFingerprint = function() {
    fingerprintService.check('unlockingApp', function(err) {
      if (err) return;
      $state.transitionTo('tabs.home').then(function() {
        $ionicHistory.clearHistory();
      });
    });
  };
});
