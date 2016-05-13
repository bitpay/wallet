'use strict';

angular.module('copayApp.controllers').controller('amazonController', 
  function($rootScope, $scope, $timeout, $modal, profileService, configService, storageService, amazonService, isChromeApp, animationService, lodash, nodeWebkit) {

    window.ignoreMobilePause = true;

    this.init = function() {
      var self = this;
      var network = configService.getSync().amazon.testnet ? 'testnet' : 'livenet';
      amazonService.setCredentials(network);
      amazonService.getGiftCards(function(err, gcds) {
        if (err) {
          self.error = err;
          return;
        }
        self.giftCards = gcds;
      
      });
    };
    
    this.openCardModal = function(card) {
      $rootScope.modalOpened = true;
      var self = this;
      var fc = profileService.focusedClient;
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.card = card;

        $scope.cancel = lodash.debounce(function() {
          $modalInstance.dismiss('cancel');
        }, 0, 1000);

      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/amazon-card-details.html',
          windowClass: animationService.modalAnimated.slideRight,
          controller: ModalInstanceCtrl,
      });

      var disableCloseModal = $rootScope.$on('closeModal', function() {
        modalInstance.dismiss('cancel');
      });

      modalInstance.result.finally(function() {
        $rootScope.modalOpened = false;
        disableCloseModal();
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutRight);
      });
    };

  });
