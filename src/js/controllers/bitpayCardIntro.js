'use strict';
angular.module('copayApp.controllers').controller('bitpayCardIntroController', function($scope, $log, $state, $ionicHistory, storageService, externalLinkService, bitpayCardService, gettextCatalog, popupService) {

  var checkOtp = function(obj, cb) {
    if (obj.otp) {
      var msg = gettextCatalog.getString('Enter Two Factor for BitPay Cards');
      popupService.showPrompt(null, msg, null, function(res) {
        cb(res);
      });
    } else {
      cb();
    }
  };

  $scope.$on("$ionicView.beforeEnter", function(event, data) {

    if (data.stateParams && data.stateParams.secret) {
      var obj = {
        secret: data.stateParams.secret,
        email: data.stateParams.email,
        otp: data.stateParams.otp
      };
      checkOtp(obj, function(otp) {
        obj.otp = otp;
        bitpayCardService.bitAuthPair(obj, function(err, data) {
          if (err) {
            popupService.showAlert(null, err);
            return;
          }
          var title = gettextCatalog.getString('Add BitPay Cards?');
          var msg = gettextCatalog.getString('Would you like to add this account ({{email}}) to your wallet?', {email: obj.email});
          var ok = gettextCatalog.getString('Add cards');
          var cancel = gettextCatalog.getString('Go back');
          popupService.showConfirm(title, msg, ok, cancel, function(res) {
            if (res) {
              // Set flag for nextStep
              storageService.setNextStep('BitpayCard', true, function(err) {});
              // Save data
              bitpayCardService.setBitpayDebitCards(data, function(err) {
                if (err) return;
                $ionicHistory.nextViewOptions({
                  disableAnimate: true
                });
                $state.go('tabs.home').then(function() {
                  if (data.cards[0]) {
                    $state.transitionTo('tabs.bitpayCard', {id: data.cards[0].id});
                  }
                });
              });
            }
          });
        });
      });
    } else {
      bitpayCardService.getCredentials(function(err, credentials) {
        if (err) popupService.showAlert(null, err);
        else $log.info('BitPay Debit Card Credentials: Ok.');
      });
    }
  });

  $scope.orderBitPayCard = function() {
    var url = 'https://bitpay.com/visa/';
    var target = '_system';
    externalLinkService.open(url, target);
  };

  $scope.connectBitPayCard = function() {
    var url = 'https://bitpay.com/visa/login';
    var target = '_system';
    externalLinkService.open(url, target);
  };
});

