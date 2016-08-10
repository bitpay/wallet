'use strict';

angular.module('copayApp.controllers').controller('amazonController',
  function($scope, $timeout, $ionicModal, $log, lodash, bwcError, amazonService, platformInfo) {

    if (platformInfo.isCordova && StatusBar.isVisible) {
      StatusBar.backgroundColorByHexString("#4B6178");
    }

    this.init = function() {
      var self = this;
      self.sandbox = amazonService.getEnvironment() == 'testnet' ? true : false;
      amazonService.getPendingGiftCards(function(err, gcds) {
        if (err) {
          self.error = err;
          return;
        }
        $scope.giftCards = lodash.isEmpty(gcds) ? null : gcds;
        $timeout(function() {
          $scope.$digest();
        });
      });
      this.updatePendingGiftCards();
    }

    this.updatePendingGiftCards = lodash.debounce(function() {
      var self = this;

      amazonService.getPendingGiftCards(function(err, gcds) {
        lodash.forEach(gcds, function(dataFromStorage) {
          if (dataFromStorage.status == 'PENDING') {
            $log.debug("creating gift card");
            amazonService.createGiftCard(dataFromStorage, function(err, giftCard) {
              if (err) {
                $log.debug(bwcError.msg(err));
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
                      self.error = err;
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

    this.openCardModal = function(card) {
      var self = this;
      $scope.card = card;

      $ionicModal.fromTemplateUrl('views/modals/amazon-card-details.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.amazonCardDetailsModal = modal;
        $scope.amazonCardDetailsModal.show();
      });

      $scope.$on('UpdateAmazonList', function(event) {
        self.init();
      });
    };
  });
