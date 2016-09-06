'use strict';

angular.module('copayApp.controllers').controller('preferencesBitpayCardController',
  function($scope, $state, $timeout, bitpayCardService, popupService) {

    $scope.logout = function() {
      var title = 'Are you sure you would like to log out of your Bitpay Card account?';
      popupService.showConfirm(title, null, function(res) {
        if (res) logout();
      });
    };

    var logout = function() {
      bitpayCardService.logout(function() {
        $timeout(function() {
          $state.go('bitpayCard.main');
        }, 100);
      });
    };

  });
