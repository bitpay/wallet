'use strict';

angular.module('copayApp.controllers').controller('tabsController', function($rootScope, $ionicHistory, $timeout, $log, $scope, $state, $stateParams, incomingData, lodash, popupService, gettextCatalog) {

  $scope.onScan = function(data) {
    if (!incomingData.redir(data)) {
      popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Invalid data'));
    }
  };

  $scope.setScanFn = function(scanFn) {
    $scope.scan = function() {
      $log.debug('Scanning...');
      scanFn();
    };
  };

  $scope.importInit = function() {
    $scope.fromOnboarding = $stateParams.fromOnboarding;
    $timeout(function() {
      $scope.$apply();
    }, 1);
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if ($ionicHistory.viewHistory() && !$ionicHistory.viewHistory().backView)
      $ionicHistory.viewHistory().backView = $rootScope.viewBack[data.stateName];
    $rootScope.hideTabs = '';
  });
});
