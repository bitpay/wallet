'use strict';

angular.module('copayApp.controllers').controller('amazonController',
  function($scope, $timeout, $ionicModal, $log, lodash, amazonService, platformInfo, externalLinkService, popupService, gettextCatalog) {

    $scope.network = amazonService.getEnvironment();

    $scope.openExternalLink = function(url) {
      externalLinkService.open(url);
    };

    var initAmazon = function() {
      amazonService.getPendingGiftCards(function(err, gcds) {
        if (err) {
          popupService.showAlert(gettextCatalog.getString('Error'), err);
          return;
        }
        $scope.giftCards = lodash.isEmpty(gcds) ? null : gcds;
        $timeout(function() {
          $scope.$digest();
        });
        if ($scope.cardClaimCode) {
          var card = lodash.find($scope.giftCards, {
            claimCode: $scope.cardClaimCode
          });
          if (lodash.isEmpty(card)) {
            popupService.showAlert(gettextCatalog.getString('Error'), gettextCatalog.getString('Card not found'));
            return;
          }
          $scope.openCardModal(card);
        }
      });
      $scope.updatePendingGiftCards();
    };

    $scope.updatePendingGiftCards = lodash.debounce(function() {

      amazonService.getPendingGiftCards(function(err, gcds) {
        $timeout(function() {
          $scope.giftCards = gcds;
          $scope.$digest();
        });
        lodash.forEach(gcds, function(dataFromStorage) {
          if (dataFromStorage.status == 'PENDING') {
            $log.debug("creating gift card");
            amazonService.createGiftCard(dataFromStorage, function(err, giftCard) {
              if (err) {
                popupService.showAlert(gettextCatalog.getString('Error'), err);
                return;
              }
              if (giftCard.status != 'PENDING') {
                var newData = {};

                lodash.merge(newData, dataFromStorage, giftCard);

                if (newData.status == 'expired') {
                  amazonService.savePendingGiftCard(newData, {
                    remove: true
                  }, function(err) {
                    return;
                  });
                }

                amazonService.savePendingGiftCard(newData, null, function(err) {
                  $log.debug("Saving new gift card");
                  amazonService.getPendingGiftCards(function(err, gcds) {
                    if (err) {
                      popupService.showAlert(gettextCatalog.getString('Error'), err);
                      return;
                    }
                    $scope.giftCards = gcds;
                    $timeout(function() {
                      $scope.$digest();
                    });
                  });
                });
              } else $log.debug("pending gift card not available yet");
            });
          }
        });
      });

    }, 1000);

    $scope.openCardModal = function(card) {
      $scope.card = card;

      $ionicModal.fromTemplateUrl('views/modals/amazon-card-details.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.amazonCardDetailsModal = modal;
        $scope.amazonCardDetailsModal.show();
      });

      $scope.$on('UpdateAmazonList', function(event) {
        initAmazon();
      });
    };

    $scope.$on("$ionicView.beforeEnter", function(event, data) {
      $scope.cardClaimCode = data.stateParams.cardClaimCode;
      initAmazon();
    });
  });
