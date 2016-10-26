'use strict';

angular.module('copayApp.controllers').controller('preferencesBitpayCardController',
  function($scope, $state, $timeout, $ionicHistory, bitpayCardService, popupService, gettextCatalog) {

    $scope.remove = function() {
      var msg = gettextCatalog.getString('Are you sure you would like to remove your BitPay Card account from this device?');
      popupService.showConfirm(null, msg, null, null, function(res) {
        if (res) remove();
      });
    };

    var remove = function() {
      bitpayCardService.remove(function() {
        $ionicHistory.removeBackView();
        $timeout(function() {
          $state.go('tabs.home');
        }, 100);
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      bitpayCardService.getBitpayDebitCards(function(err, data) {
        if (err) return;
        $scope.bitpayCards = data.cards;
      });
    });

  });
