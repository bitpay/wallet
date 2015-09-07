'use strict';

angular.module('copayApp.controllers').controller('glideraController', 
  function($scope, $timeout, $modal, applicationService, profileService, configService, storageService, glideraService) {
      
    var config = configService.getSync().wallet.settings;

    this.getAuthenticateUrl = function() {
      return glideraService.getOauthCodeUrl();
    };

    this.submitOauthCode = function(code, glideraCredentials) {
      var fc = profileService.focusedClient;
      var self = this;
      this.loading = true;
      $timeout(function() {
        glideraService.getToken(code, glideraCredentials, function(error, data) {
          if (data && data.access_token) {
            storageService.setGlideraToken(fc.credentials.network, data.access_token, function() {
              $scope.$emit('Local/GlideraTokenUpdated', data.access_token);
              $timeout(function() {
                self.loading = null;
                $scope.$apply();
              }, 100);
            });
          }
        });
      }, 100);
    };

    this.openTxModal = function(token, tx) {
      var self = this;
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
          windowClass: 'full animated slideInRight',
          controller: ModalInstanceCtrl,
      });

      modalInstance.result.finally(function() {
        var m = angular.element(document.getElementsByClassName('reveal-modal'));
        m.addClass('slideOutRight');
      });
    };

  });
