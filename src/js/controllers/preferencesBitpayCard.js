'use strict';

angular.module('copayApp.controllers').controller('preferencesBitpayCardController',
  function($scope, $state, $timeout, $ionicHistory, bitpayCardService, popupService) {

    $scope.logout = function() {
      var msg = 'Are you sure you would like to log out of your BitPay Card account?';
      popupService.showConfirm(null, msg, null, null, function(res) {
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
