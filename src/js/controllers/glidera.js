'use strict';

angular.module('copayApp.controllers').controller('glideraController', 
  function($scope, $timeout, $modal, profileService, configService, storageService, glideraService, isChromeApp, animationService) {

    this.getAuthenticateUrl = function() {
      return glideraService.getOauthCodeUrl();
    };

    this.submitOauthCode = function(code) {
      var fc = profileService.focusedClient;
      var self = this;
      this.loading = true;
      this.error = null;
      $timeout(function() {
        glideraService.getToken(code, function(err, data) {
          self.loading = null;
          if (err) {
            self.error = err;
            $timeout(function() {
                $scope.$apply();
              }, 100);
          }
          else if (data && data.access_token) {
            storageService.setGlideraToken(fc.credentials.network, data.access_token, function() {
              $scope.$emit('Local/GlideraUpdated', data.access_token);
              $timeout(function() {
                $scope.$apply();
              }, 100);
            });
          }
        });
      }, 100);
    };

    this.openTxModal = function(token, tx) {
      var self = this;
      var config = configService.getSync().wallet.settings;
      var fc = profileService.focusedClient;
      var ModalInstanceCtrl = function($scope, $modalInstance) {
        $scope.tx = tx;
        $scope.settings = config;
        $scope.color = fc.backgroundColor;

        glideraService.getTransaction(token, tx.transactionUuid, function(error, tx) {
          $scope.tx = tx;
        });

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
        };

      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/glidera-tx-details.html',
          windowClass: animationService.modalAnimated.slideRight,
          controller: ModalInstanceCtrl,
      });

      modalInstance.result.finally(function() {
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass(animationService.modalAnimated.slideOutRight);
      });
    };

  });
