'use strict';

angular.module('copayApp.controllers').controller('mercadoLibreCardDetailsController', function($scope, $log, $timeout, $ionicScrollDelegate, bwcError, mercadoLibreService, lodash, ongoingProcess, popupService, externalLinkService) {

  $scope.cancelGiftCard = function() {
    ongoingProcess.set('cancelingGiftCard', true);
    mercadoLibreService.cancelGiftCard($scope.card, function(err, data) {
      ongoingProcess.set('cancelingGiftCard', false);
      if (err) {
        popupService.showAlert('Error canceling gift card', bwcError.msg(err));
        return;
      }
      $scope.card.cardStatus = data.cardStatus;
      $timeout(function() {
        $ionicScrollDelegate.resize();
        $ionicScrollDelegate.scrollTop();
      }, 10);
      mercadoLibreService.savePendingGiftCard($scope.card, null, function(err) {
        $scope.refreshGiftCard();
      });
    });
  };

  $scope.remove = function() {
    mercadoLibreService.savePendingGiftCard($scope.card, {
      remove: true
    }, function(err) {
      $scope.cancel();
    });
  };

  $scope.refreshGiftCard = function() {
    ongoingProcess.set('updatingGiftCard', true);
    mercadoLibreService.getPendingGiftCards(function(err, gcds) {
      if (lodash.isEmpty(gcds)) {
        $timeout(function() {
          ongoingProcess.set('updatingGiftCard', false);
        }, 1000);
      }
      if (err) {
        popupService.showAlert('Error', err);
        return;
      }
      var index = 0;
      lodash.forEach(gcds, function(dataFromStorage) {
        if (++index == Object.keys(gcds).length) {
          $timeout(function() {
            ongoingProcess.set('updatingGiftCard', false);
          }, 1000);
        }
        if (dataFromStorage.status == 'PENDING' && dataFromStorage.invoiceId == $scope.card.invoiceId) {
          $log.debug("creating gift card");
          mercadoLibreService.createGiftCard(dataFromStorage, function(err, giftCard) {
            if (err) {
              popupService.showAlert('Error', bwcError.msg(err));
              return;
            }
            if (!lodash.isEmpty(giftCard)) {
              var newData = {};
              lodash.merge(newData, dataFromStorage, giftCard);
              mercadoLibreService.savePendingGiftCard(newData, null, function(err) {
                $log.debug("Saving new gift card");
                $scope.card = newData;
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
    $scope.mercadoLibreCardDetailsModal.hide();
  };

  $scope.openExternalLink = function(url) {
    externalLinkService.open(url);
  };

});
