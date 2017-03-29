'use strict';

angular.module('copayApp.controllers').controller('lockedViewController', function($state, $scope, $ionicHistory, fingerprintService, appConfigService, gettextCatalog) {
  $scope.$on("$ionicView.beforeEnter", function(event) {
    $scope.title = appConfigService.nameCase + ' ' + gettextCatalog.getString('is locked');
    $scope.appName = appConfigService.name;
  });

  $scope.requestFingerprint = function() {
    fingerprintService.check('unlockingApp', function(err) {
      if (err) return;
      $state.transitionTo('tabs.home').then(function() {
        $ionicHistory.clearHistory();
      });
    });
  };
});
