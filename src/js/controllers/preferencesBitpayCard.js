'use strict';

angular.module('copayApp.controllers').controller('preferencesBitpayCardController',
  function($scope, $state, $timeout, $ionicHistory, bitpayCardService, popupService, gettextCatalog) {

    $scope.remove = function(card) {
      var msg = gettextCatalog.getString('Are you sure you would like to remove your BitPay Card ({{lastFourDigits}}) from this device?', {
        lastFourDigits: card.lastFourDigits
      });
      popupService.showConfirm(null, msg, null, null, function(res) {
        if (res) remove(card);
      });
    };

    var remove = function(card) {
      bitpayCardService.remove(card, function(err) {
        if (err) {
          return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not remove card'));
        }
        $ionicHistory.clearHistory();
        $timeout(function() {
          $state.go('tabs.home');
        }, 100);
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      bitpayCardService.getBitpayDebitCards(function(err, data) {
        if (err) return;
        $scope.bitpayCards = data;
      });
    });

  });
