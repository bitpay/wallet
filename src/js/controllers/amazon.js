'use strict';

angular.module('copayApp.controllers').controller('amazonController', 
  function($scope, $timeout, $ionicModal, lodash, configService, amazonService) {

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
        self.giftCards = lodash.isEmpty(gcds) ? null : gcds;
        $timeout(function() {
          $scope.$digest();
        });
      });
    };

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
