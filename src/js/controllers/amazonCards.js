'use strict';

angular.module('copayApp.controllers').controller('amazonCardsController',
  function($scope, $timeout, $ionicModal, $log, $ionicScrollDelegate, lodash, amazonService, platformInfo, externalLinkService, popupService, ongoingProcess) {

    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var updateGiftCards = function(cb) {
      amazonService.getPendingGiftCards(function(err, gcds) {
        if (err) {
          popupService.showAlert('Could not get gift cards', err);
          if (cb) return cb();
          else return;
        }
        $scope.giftCards = gcds;
        $timeout(function() {
          $scope.$digest();
          $ionicScrollDelegate.resize();
          if (cb) return cb();
        }, 100);
      });
    };

    $scope.updatePendingGiftCards = lodash.debounce(function() {
      $scope.updatingPending = {};
      updateGiftCards(function() {
        var index = 0;
        var gcds = $scope.giftCards;
        lodash.forEach(gcds, function(dataFromStorage) {
          if (dataFromStorage.status == 'PENDING' || dataFromStorage.status == 'invalid') {
            $log.debug("Creating / Updating gift card");
            $scope.updatingPending[dataFromStorage.invoiceId] = true;

            amazonService.createGiftCard(dataFromStorage, function(err, giftCard) {

              $scope.updatingPending[dataFromStorage.invoiceId] = false;
              if (err) {
                popupService.showAlert('Error creating gift card', err);
                return;
              }

              if (giftCard.status != 'PENDING') {
                var newData = {};

                lodash.merge(newData, dataFromStorage, giftCard);

                if (newData.status == 'expired') {
                  amazonService.savePendingGiftCard(newData, {
                    remove: true
                  }, function(err) {
                    updateGiftCards();
                  });
                  return;
                }

                amazonService.savePendingGiftCard(newData, null, function(err) {
                  $log.debug("Saving new gift card");
                  updateGiftCards();
                });
              }
            });
          }
        });
      });

    }, 1000, {
      'leading': true
    });

    $scope.openCardModal = function(card) {
      $scope.card = card;

      $ionicModal.fromTemplateUrl('views/modals/amazon-card-details.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.amazonCardDetailsModal = modal;
        $scope.amazonCardDetailsModal.show();
      });

      $scope.$on('modal.hidden', function() {
        $scope.updatePendingGiftCards();
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.invoiceId = data.stateParams.invoiceId;
      updateGiftCards(function() {
        if ($scope.invoiceId) {
          var card = lodash.find($scope.giftCards, {
            invoiceId: $scope.invoiceId
          });
          if (lodash.isEmpty(card)) {
            popupService.showAlert(null, 'Card not found');
            return;
          }
          $scope.openCardModal(card);
        }
      });
    });

    $scope.$on("$ionicView.afterEnter", function(event, data) {
      $scope.updatePendingGiftCards();
    });
  });
