'use strict';

angular.module('copayApp.controllers').controller('preferencesGlideraController',
  function($scope, $timeout, $state, $ionicHistory, glideraService, popupService) {

    $scope.revokeToken = function() {
      popupService.showConfirm('Glidera', 'Are you sure you would like to log out of your Glidera account?', null, null, function(res) {
        if (res) {
          glideraService.remove(function() {
            $ionicHistory.clearHistory();
            $timeout(function() {
              $state.go('tabs.home');
            }, 100);
          });
        }
      });
    };

    $scope.$on("$ionicView.afterEnter", function(event, data){
      glideraService.updateStatus($scope.account);
    });

    $scope.$on("$ionicView.beforeEnter", function(event, data){
      $scope.account = {};
      glideraService.init(function(err, glidera) {
        if (err || !glidera) {
          if (err) popupService.showAlert('Error connecting Glidera', err);
          return;
        }
        $scope.account['token'] = glidera.token;
        $scope.account['permissions'] = glidera.permissions;
        $scope.account['status'] = glidera.status;
      });
    });

  });
