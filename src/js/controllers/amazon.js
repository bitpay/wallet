'use strict';

angular.module('copayApp.controllers').controller('amazonController', 
  function($scope, $timeout, $ionicModal, configService, amazonService) {

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
      $scope.card = card;

      $ionicModal.fromTemplateUrl('views/modals/amazon-card-details.html', {
        scope: $scope
      }).then(function(modal) {
        $scope.amazonCardDetailsModal = modal;
        $scope.amazonCardDetailsModal.show();
      });
    };
  });
