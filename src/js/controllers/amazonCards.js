'use strict';

angular.module('copayApp.controllers').controller('amazonCardsController',
  function($scope, $timeout, $ionicModal, $log, $ionicScrollDelegate, lodash, amazonService, platformInfo, externalLinkService, popupService, ongoingProcess, timeService) {

    var updateGiftCard;

    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var checkIfCardNeedsUpdate = function(card) {
      // Continues normal flow (update card)
      if (card.status == 'PENDING' || card.status == 'invalid') {
        return true;
      }
      // Check if card status FAILURE for 24 hours
      if (card.status == 'FAILURE' && timeService.withinPastDay(card.date)) {
        return true;
      }
      // Success: do not update
      return false;
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

          updateGiftCard = checkIfCardNeedsUpdate(dataFromStorage);

          if (updateGiftCard) {
            $log.debug("Creating / Updating gift card");
            $scope.updatingPending[dataFromStorage.invoiceId] = true;

            amazonService.createGiftCard(dataFromStorage, function(err, giftCard) {

              $scope.updatingPending[dataFromStorage.invoiceId] = false;
              if (err) {
                $log.error('Error creating gift card:', err);
                giftCard = giftCard || {};
                giftCard['status'] = 'FAILURE';
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
                  $log.debug("Amazon gift card updated");
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
      $scope.updateGiftCard = updateGiftCard;

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
          updateGiftCard = checkIfCardNeedsUpdate(card);
          $scope.openCardModal(card);
        }
      });
    });

    $scope.$on("$ionicView.afterEnter", function(event, data) {
      $scope.updatePendingGiftCards();
    });
  });
