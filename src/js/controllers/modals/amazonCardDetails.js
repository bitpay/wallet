'use strict';

angular.module('copayApp.controllers').controller('amazonCardDetailsController', function($scope, $timeout, amazonService, ongoingProcess) {

  $scope.cancelGiftCard = function() {
    var dataSrc = {
      creationRequestId: $scope.card.creationRequestId,
      gcId: $scope.card.gcId,
      bitpayInvoiceId: $scope.card.bitpayInvoiceId,
      bitpayInvoiceUrl: $scope.card.bitpayInvoiceUrl,
      date: $scope.card.date
    };
    ongoingProcess.set('Canceling gift card...', true);
    amazonService.cancelGiftCard(dataSrc, function(err, data) {
      ongoingProcess.set('Canceling gift card...', false);
      if (err || data.status != 'SUCCESS') {
        $scope.error = err || data.status;
        return;
      }
      $scope.refreshGiftCard();
    });
  };

  $scope.remove = function() {
    amazonService.saveGiftCard($scope.card, {remove: true}, function(err) {
      $scope.$emit('UpdateAmazonList');
      $scope.cancel();
    });
  };

  $scope.refreshGiftCard = function() {
    var dataSrc = {
      creationRequestId: $scope.card.creationRequestId,
      amount: $scope.card.cardInfo.value.amount,
      currencyCode: $scope.card.cardInfo.value.currencyCode,
      bitpayInvoiceId: $scope.card.bitpayInvoiceId,
      bitpayInvoiceUrl: $scope.card.bitpayInvoiceUrl,
      date: $scope.card.date
    };
    ongoingProcess.set('Updating gift card...', true);
    amazonService.createGiftCard(dataSrc, function(err, data) {
      ongoingProcess.set('Updating gift card...', false);
      if (err) {
        $scope.error = err;
        return;
      }
      $scope.$emit('UpdateAmazonList');
      $scope.card = data;
      $timeout(function() {
        $scope.$digest();
      });
    });
  };

  $scope.cancel = function() {
    $scope.amazonCardDetailsModal.hide();
  };

});
