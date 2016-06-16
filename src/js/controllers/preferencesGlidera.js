'use strict';

angular.module('copayApp.controllers').controller('preferencesGlideraController',
  function($scope, $timeout, $ionicModal, profileService, applicationService, glideraService, storageService) {

    this.getEmail = function(token) {
      var self = this;
      glideraService.getEmail(token, function(error, data) {
        self.email = data;
      });
    };

    this.getPersonalInfo = function(token) {
      var self = this;
      glideraService.getPersonalInfo(token, function(error, info) {
        self.personalInfo = info;
      });
    };

    this.getStatus = function(token) {
      var self = this;
      glideraService.getStatus(token, function(error, data) {
        self.status = data;
      });
    };

    this.getLimits = function(token) {
      var self = this;
      glideraService.getLimits(token, function(error, limits) {
        self.limits = limits;
      });
    };

    this.revokeToken = function(testnet) {
      $scope.network = testnet ? 'testnet' : 'livenet';
      $scope.loading = false;

      $ionicModal.fromTemplateUrl('views/modals/glidera-confirmation.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function(modal) {
        $scope.glideraConfirmationModal = modal;
        $scope.glideraConfirmationModal.show();
      });
    };

  });
