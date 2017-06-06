'use strict';
angular.module('copayApp.controllers').controller('bitpayCardIntroController', function($scope, $log, $state, $ionicHistory, storageService, externalLinkService, bitpayCardService, gettextCatalog, popupService, bitpayAccountService) {

  $scope.$on("$ionicView.beforeEnter", function(event, data) {
    if (data.stateParams && data.stateParams.secret) {
      var pairData = {
        secret: data.stateParams.secret,
        email: data.stateParams.email,
        otp: data.stateParams.otp
      };
      var pairingReason = gettextCatalog.getString('add your BitPay Visa card(s)');
      bitpayAccountService.pair(pairData, pairingReason, function(err, paired, apiContext) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error pairing BitPay Account'), err);
          return;
        }
        if (paired) {
          bitpayCardService.sync(apiContext, function(err, cards) {
            if (err) {
              popupService.showAlert(gettextCatalog.getString('Error updating Debit Cards'), err);
              return;
            }
            $ionicHistory.nextViewOptions({
              disableAnimate: true
            });
            $state.go('tabs.home').then(function() {
              if (cards[0]) {
                $state.transitionTo('tabs.bitpayCard', {
                  id: cards[0].id
                });
              }
            });
          });
        }
      });
    }

    bitpayAccountService.getAccounts(function(err, accounts) {
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), err);
        return;
      }
      $scope.accounts = accounts;
    });
  });

  $scope.bitPayCardInfo = function() {
    var url = 'https://bitpay.com/visa/faq';
    externalLinkService.open(url);
  };

  $scope.orderBitPayCard = function() {
    var url = 'https://bitpay.com/visa/get-started';
    externalLinkService.open(url);
  };

  $scope.connectBitPayCard = function() {
    if ($scope.accounts.length == 0) {
      startPairBitPayAccount();
    } else {
      showAccountSelector();
    }
  };

  var startPairBitPayAccount = function() {
    var url = 'https://bitpay.com/visa/dashboard/add-to-bitpay-wallet-confirm';
    externalLinkService.open(url);
  };

  var showAccountSelector = function() {
    $scope.accountSelectorTitle = gettextCatalog.getString('From BitPay account');
    $scope.showAccounts = ($scope.accounts != undefined);
  };

  $scope.onAccountSelect = function(account) {
    if (account == undefined) {
      startPairBitPayAccount();
    } else {
      bitpayCardService.sync(account.apiContext, function(err, data) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        $state.go('tabs.home');
      });
    }
  };

});
