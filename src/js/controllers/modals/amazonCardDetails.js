'use strict';

angular.module('copayApp.controllers').controller('amazonCardDetailsController', function($scope, $log, $timeout, $ionicScrollDelegate, bwcError, amazonService, lodash, ongoingProcess, popupService, externalLinkService) {

  $scope.cancelGiftCard = function() {
    ongoingProcess.set('cancelingGiftCard', true);
    amazonService.cancelGiftCard($scope.card, function(err, data) {
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
      amazonService.savePendingGiftCard($scope.card, null, function(err) {
        $scope.refreshGiftCard();
      });
    });
  };

  $scope.remove = function() {
    amazonService.savePendingGiftCard($scope.card, {
      remove: true
    }, function(err) {
      $scope.cancel();
    });
  };

  $scope.refreshGiftCard = function() {
    if (!$scope.updateGiftCard) return;
    ongoingProcess.set('updatingGiftCard', true);
    amazonService.getPendingGiftCards(function(err, gcds) {
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
        if (dataFromStorage.invoiceId == $scope.card.invoiceId) {
          $log.debug("creating gift card");
          amazonService.createGiftCard(dataFromStorage, function(err, giftCard) {
            if (err) {
              popupService.showAlert('Error', bwcError.msg(err));
              return;
            }
            if (!lodash.isEmpty(giftCard) && giftCard.status != 'PENDING') {
              var newData = {};

              lodash.merge(newData, dataFromStorage, giftCard);

              if (newData.status == 'expired') {
                amazonService.savePendingGiftCard(newData, {
                  remove: true
                }, function(err) {
                  $scope.cancel();
                });
                return;
              }

              amazonService.savePendingGiftCard(newData, null, function(err) {
                $log.debug("Amazon gift card updated");
                $scope.card = newData;
                $timeout(function() {
                  $scope.$digest();
                });
              });
            } else $log.debug("Pending gift card not available yet");
          });
        }
      });
    });
  };

  $scope.cancel = function() {
    $scope.amazonCardDetailsModal.hide();
  };

  $scope.openExternalLink = function(url) {
    externalLinkService.open(url);
  };

});
