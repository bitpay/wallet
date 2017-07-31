'use strict';

angular.module('copayApp.controllers').controller('preferencesBitpayServicesController',
  function($rootScope, $scope, $state, $timeout, $ionicHistory, bitpayAccountService, bitpayCardService, popupService, gettextCatalog) {

    $scope.removeAccount = function(account) {
      var title = gettextCatalog.getString('Remove NavPay Account?');
      var msg = gettextCatalog.getString('Removing your NavPay account will remove all associated NavPay account data from this device. Are you sure you would like to remove your NavPay Account ({{email}}) from this device?', {
        email: account.email
      });
      popupService.showConfirm(title, msg, null, null, function(res) {
        if (res) {
          removeAccount(account);
        }
      });
    };

    $scope.removeCard = function(card) {
      var title = gettextCatalog.getString('Remove NavPay Card?');
      var msg = gettextCatalog.getString('Are you sure you would like to remove your NavPay Card ({{lastFourDigits}}) from this device?', {
        lastFourDigits: card.lastFourDigits
      });
      popupService.showConfirm(title, msg, null, null, function(res) {
        if (res) {
          removeCard(card);
        }
      });
    };

    var removeAccount = function(account) {
      bitpayAccountService.removeAccount(account, function(err) {
        if (err) {
          return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not remove account'));
        }
        setScope(function() {
          // If there are no paired accounts then change views.
          if ($scope.bitpayAccounts.length == 0) {
            $state.go('tabs.settings').then(function() {
              $ionicHistory.clearHistory();
              $state.go('tabs.home');
            });
          }
        });
      });
    };

    var removeCard = function(card) {
      bitpayCardService.remove(card.id, function(err) {
        if (err) {
          return popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Could not remove card'));
        }
        setScope();
      });
    };

    var setScope = function(cb) {
      bitpayAccountService.getAccounts(function(err, accounts) {
        if (err) return;
        $scope.bitpayAccounts = accounts;

        bitpayCardService.getCards(function(err, cards) {
          if (err) return;
          $scope.bitpayCards = cards;
          if (cb) {
            cb();
          }
          $timeout(function(){
            $rootScope.$apply();
          }, 10);
        });
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      setScope();
    });

  });
