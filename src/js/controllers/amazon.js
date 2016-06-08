'use strict';

angular.module('copayApp.controllers').controller('amazonController', 
  function($rootScope, $scope, $timeout, $modal, profileService, configService, amazonService, animationService, lodash) {

    window.ignoreMobilePause = true;

    this.init = function() {
      var self = this;
      var network = configService.getSync().amazon.testnet ? 'testnet' : 'livenet';
      self.sandbox = network == 'testnet' ? true : false;
      amazonService.setCredentials(network);
      amazonService.getGiftCards(function(err, gcds) {
        if (err) {
          self.error = err;
          return;
        }
        self.giftCards = gcds;
        $timeout(function() {
          $scope.$digest();
        });
      });
    };
    
    this.openCardModal = function(card) {
      $rootScope.modalOpened = true;
      var self = this;
      var fc = profileService.focusedClient;
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.card = card;

        $scope.cancelGiftCard = function() {
          $scope.refresh = true;
          var dataSrc = {
            creationRequestId: $scope.card.creationRequestId,
            gcId: $scope.card.gcId,
            bitpayInvoiceId: $scope.card.bitpayInvoiceId,
            bitpayInvoiceUrl: $scope.card.bitpayInvoiceUrl,
            date: $scope.card.date
          };
          $scope.loading = true;
          amazonService.cancelGiftCard(dataSrc, function(err, data) {
            $scope.loading = null;
            if (err || data.status != 'SUCCESS') {
              $scope.error = err || data.status;
              return;
            }
            $scope.refreshGiftCard();
          });
        };

        $scope.remove = function() {
          amazonService.saveGiftCard($scope.card, {remove: true}, function(err) {
            $modalInstance.close(true);
          });
        };

        $scope.refreshGiftCard = function() {
          $scope.refresh = true;
          var dataSrc = {
            creationRequestId: $scope.card.creationRequestId,
            amount: $scope.card.cardInfo.value.amount,
            currencyCode: $scope.card.cardInfo.value.currencyCode,
            bitpayInvoiceId: $scope.card.bitpayInvoiceId,
            bitpayInvoiceUrl: $scope.card.bitpayInvoiceUrl,
            date: $scope.card.date
          };
          $scope.loading = true;
          amazonService.createGiftCard(dataSrc, function(err, data) {
            $scope.loading = null;
            if (err) {
              $scope.error = err;
              return;
            }
            $scope.card = data;
            $timeout(function() {
              $scope.$digest();
            });
          });
        };

        $scope.cancel = lodash.debounce(function() {
          $modalInstance.close($scope.refresh);
        }, 0, 1000);

      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/amazon-card-details.html',
          windowClass: animationService.modalAnimated.slideRight,
          controller: ModalInstanceCtrl,
      });

      var disableCloseModal = $rootScope.$on('closeModal', function() {
        modalInstance.close($scope.refresh);
      });

      modalInstance.result.finally(function() {
        $rootScope.modalOpened = false;
        disableCloseModal();
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutRight);
      });

      modalInstance.result.then(function(refresh) {
        if (refresh) self.init();
      }, function() {});
    };

  });
