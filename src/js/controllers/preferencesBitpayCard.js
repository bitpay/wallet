'use strict';

angular.module('copayApp.controllers').controller('preferencesBitpayCardController',
  function($scope, $state, $timeout, $ionicHistory, bitpayCardService, popupService) {

    $scope.logout = function() {
      var title = 'Are you sure you would like to log out of your Bitpay Card account?';
      popupService.showConfirm(title, null, null, null, function(res) {
        if (res) logout();
      });
    };

    var logout = function() {
      bitpayCardService.logout(function() {
        $ionicHistory.removeBackView();
        $timeout(function() {
          $state.go('tabs.home');
        }, 100);
      });
    };

  });
