'use strict';

angular.module('copayApp.controllers').controller('tabsController', function($rootScope, $log, $scope, $state, $stateParams, $timeout, incomingData, lodash, popupService) {

  $scope.onScan = function(data) {
    if (!incomingData.redir(data)) {
      popupService.showAlert(null, gettextCatalog.getString('Invalid data'));
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

  $scope.$on("$ionicView.beforeEnter", function(event, data){
    $rootScope.hideTabs = '';
  });

});
