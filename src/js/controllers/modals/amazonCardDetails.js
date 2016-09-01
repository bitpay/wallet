'use strict';

angular.module('copayApp.controllers').controller('amazonCardDetailsController', function($scope, $log, $timeout, bwcError, amazonService, lodash, ongoingProcess, popupService, gettextCatalog) {

  $scope.cancelGiftCard = function() {
    ongoingProcess.set('Canceling gift card...', true);
    amazonService.cancelGiftCard($scope.card, function(err, data) {
      ongoingProcess.set('Canceling gift card...', false);
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err));
        return;
      }
      $scope.card.cardStatus = data.cardStatus;
      amazonService.savePendingGiftCard($scope.card, null, function(err) {
        $scope.$emit('UpdateAmazonList');
      });
    });
  };

  $scope.remove = function() {
    amazonService.savePendingGiftCard($scope.card, {
      remove: true
    }, function(err) {
      $scope.$emit('UpdateAmazonList');
      $scope.cancel();
    });
  };

  $scope.refreshGiftCard = function() {
    amazonService.getPendingGiftCards(function(err, gcds) {
      if (err) {
        popupService.showAlert(gettextCatalog.getString('Error'), err);
        return;
      }
      lodash.forEach(gcds, function(dataFromStorage) {
        if (dataFromStorage.status == 'PENDING' && dataFromStorage.invoiceId == $scope.card.invoiceId) {
          $log.debug("creating gift card");
          amazonService.createGiftCard(dataFromStorage, function(err, giftCard) {
            if (err) {
              popupService.showAlert(gettextCatalog.getString('Error'), bwcError.msg(err));
              return;
            }
            if (!lodash.isEmpty(giftCard)) {
              var newData = {};
              lodash.merge(newData, dataFromStorage, giftCard);
              amazonService.savePendingGiftCard(newData, null, function(err) {
                $log.debug("Saving new gift card");
                $scope.card = newData;
                $scope.$emit('UpdateAmazonList');
                $timeout(function() {
                  $scope.$digest();
                });
              });
            } else $log.debug("pending gift card not available yet");
          });
        }
      });
    });
  };

  $scope.cancel = function() {
    $scope.amazonCardDetailsModal.hide();
  };

});
